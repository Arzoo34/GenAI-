import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Upload, Sparkles, Plus, X, AlertTriangle } from "lucide-react";
import { Card, PageHeader, PrimaryButton, Chip, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { runListingAgent } from "@/api/client";
import { useAppStore } from "@/store/appStore";
import { FullScreenLoader, ErrorState } from "@/components/SkeletonLoader";
import { cn } from "@/lib/utils";
import { KantriMotifDivider } from "./listing.preview";

export const Route = createFileRoute("/_tabs/listing")({
  head: () => ({ meta: [{ title: "Listing Agent — शुरुआत AI" }] }),
  component: ListingPage,
});

const CATEGORIES = ["kurti", "saree", "tshirt", "pants", "dress", "footwear", "jewelry", "decor"];

function ListingPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const setCurrentListing = useAppStore((s) => s.setCurrentListing);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);

  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null);
  const [inputStep, setInputStep] = useState<"input" | "form">("input");

  const [declaredCategory, setDeclaredCategory] = useState("kurti");
  const [pincode, setPincode] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const [productName, setProductName] = useState("");
  const [material, setMaterial] = useState("");
  const [colour, setColour] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [isRecordingDescription, setIsRecordingDescription] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isApparel = declaredCategory === "kurti" || declaredCategory === "saree" || declaredCategory === "tshirt" || declaredCategory === "pants" || declaredCategory === "dress";

  function toggleSizeSelection(sz: string) {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  }

  function toggleDescriptionRecording() {
    if (isRecordingDescription) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecordingDescription(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type manually.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecordingDescription(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error(event);
        setIsRecordingDescription(false);
      };

      recognition.onend = () => {
        setIsRecordingDescription(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
      setIsRecordingDescription(false);
    }
  }

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MESSAGES = [
    t("loading0"),
    t("loading1"),
    t("loading2"),
    t("loading3"),
    t("loading4"),
    t("loading5"),
  ];

  async function toggleRecording() {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Microphone access denied — you can still upload a photo and generate.");
    }
  }

  function handleImageSelect(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files);
    setImageFiles((prev) => [...prev, ...next]);
    next.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, url]);
    });
    setInputStep("form");
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function generateListing() {
    setError(null);
    setMismatchMessage(null);
    setGenerating(true);
    setLoadingStep(0);

    const stepTimer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, MESSAGES.length - 1));
    }, 700);

    try {
      setSelectedLanguage(language);

      const formData = new FormData();
      formData.append("declared_category", declaredCategory);
      formData.append("target_language", language);

      if (pincode.trim().length === 6) {
        formData.append("pincode", pincode.trim());
      }

      if (audioBlob) {
        formData.append("audio", audioBlob, "recording.webm");
      }

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (productName.trim()) formData.append("product_name", productName.trim());
      if (material.trim()) formData.append("material", material.trim());
      if (colour.trim()) formData.append("colour", colour.trim());
      if (sleeve.trim() && isApparel) formData.append("sleeve", sleeve.trim());
      if (occasion.trim()) formData.append("occasion", occasion.trim());
      if (selectedSizes.length > 0) formData.append("sizes", selectedSizes.join(","));
      if (description.trim()) formData.append("description", description.trim());

      const response = await runListingAgent(formData);

      if (response.category_mismatch_flagged) {
        setMismatchMessage(
          response.mismatch_message ||
            "The photo doesn't match the declared category. Please try again with a matching image.",
        );
        setInputStep("input");
        return;
      }

      const primaryImageUrl = imagePreviews[0] ?? null;
      setCurrentListing({
        ...response,
        uploadedImageUrl: primaryImageUrl,
        declared_category: declaredCategory,
      });
      navigate({ to: "/listing/preview" });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || "Something went wrong — please try again");
    } finally {
      clearInterval(stepTimer);
      setGenerating(false);
    }
  }

  function dismissMismatch() {
    setMismatchMessage(null);
    setInputStep("input");
  }

  return (
    <div>
      <PageHeader title={t("createListing")} subtitle={t("listingSubtitle")} />

      {error && (
        <div className="mb-4 px-5">
          <ErrorState message={error} onRetry={() => setError(null)} />
        </div>
      )}

      {mismatchMessage && (
        <div className="mx-5 mb-4 rounded-2xl border border-amber-500/40 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-foreground">Category mismatch</p>
              <p className="mt-1 text-sm text-foreground/80">{mismatchMessage}</p>
              <button
                type="button"
                onClick={dismissMismatch}
                className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground btn-lift"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {(inputStep === "input" || imagePreviews.length === 0) && (
        <>
          <div className="px-5">
            <Card className="bg-gradient-to-br from-[oklch(0.96_0.04_60)] to-card p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("speakProd")}</p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={toggleRecording}
                className={`relative mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.75_0.16_60)] text-primary-foreground shadow-[0_16px_36px_-12px_oklch(0.6_0.15_50/0.55)] ${isRecording ? "ring-4 ring-destructive/40" : ""}`}
                aria-label={isRecording ? "Stop recording" : "Record speech"}
              >
                {isRecording && <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />}
                <Mic className="relative h-10 w-10" strokeWidth={2.2} />
              </motion.button>
              <p className="mt-4 text-sm text-muted-foreground">
                {isRecording
                  ? "Recording… tap again to stop"
                  : audioBlob
                    ? "✓ Voice recorded — tap to re-record"
                    : "Tap to record in your language"}
              </p>
            </Card>
          </div>

          <div className="my-6 flex items-center gap-3 px-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="px-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="card-warm flex flex-col items-center gap-2 p-5 btn-lift"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold">Take Photo</span>
              </button>
              <button
                type="button"
                className="card-warm flex flex-col items-center gap-2 p-5 btn-lift"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-secondary" />
                <span className="text-sm font-semibold">{t("uploadImg")}</span>
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageSelect(e.target.files)}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageSelect(e.target.files)}
            />
          </div>
        </>
      )}

      {imagePreviews.length > 0 && (
        <div className="mt-4 px-5">
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((url, i) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <RangoliDivider className="my-6" />

      <div className="space-y-4 px-5">
        <div>
          <label className="mb-2 block text-sm font-semibold">Declared Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat} active={declaredCategory === cat} onClick={() => setDeclaredCategory(cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Chip>
            ))}
          </div>
        </div>

        <Field
          label="Delivery Pincode (optional)"
          placeholder="e.g. 110001"
          value={pincode}
          onChange={(v) => setPincode(v.replace(/\D/g, "").slice(0, 6))}
        />

        {/* Product Attributes Header */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <h3 className="text-sm font-semibold text-foreground">Product Attributes</h3>
          <button
            type="button"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            {detailsExpanded ? "Hide details" : "Show details"}
          </button>
        </div>

        {/* Collapsible Attributes Container */}
        <AnimatePresence initial={false}>
          {detailsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-4 pt-2"
            >
              {/* Product Name (Full Width) */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Product Name / Title (optional)
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Pink Banarasi Silk Saree"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Material & Colour Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Material / Fabric
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Pure Cotton"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Colour / Pattern
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Indigo Blue"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Occasion & Sleeve (Apparel Only) Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Festive Wear"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                {isApparel && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Sleeve
                    </label>
                    <input
                      type="text"
                      value={sleeve}
                      onChange={(e) => setSleeve(e.target.value)}
                      placeholder="e.g. 3/4 Sleeve"
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Sizes Multi-Select */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Sizes Available
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Free", "S", "M", "L", "XL", "XXL"].map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeSelection(sz)}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-semibold btn-lift transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider motif */}
              <KantriMotifDivider />

              {/* Description Textarea with Mic Button */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell buyers what makes it special..."
                    rows={4}
                    className="w-full rounded-xl border border-border bg-card pl-4 pr-12 py-2.5 text-sm leading-relaxed focus:border-primary focus:outline-none"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDescriptionRecording}
                    className={cn(
                      "absolute right-3 bottom-3 grid h-8 w-8 place-items-center rounded-full text-white shadow-md btn-lift",
                      isRecordingDescription
                        ? "bg-destructive ring-4 ring-destructive/30 animate-pulse"
                        : "bg-primary hover:bg-primary-hover"
                    )}
                    aria-label={isRecordingDescription ? "Stop description recording" : "Record description speech"}
                  >
                    {isRecordingDescription ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pt-8">
        <PrimaryButton onClick={generateListing} disabled={generating || (!audioBlob && imageFiles.length === 0)}>
          <Sparkles className="h-5 w-5" /> {t("genListing")}
        </PrimaryButton>
        {!audioBlob && imageFiles.length === 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Record a voice note or upload at least one photo to generate
          </p>
        )}
      </div>

      <AnimatePresence>
        {generating && <FullScreenLoader messages={MESSAGES} step={loadingStep} />}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/30"
      />
    </div>
  );
}
