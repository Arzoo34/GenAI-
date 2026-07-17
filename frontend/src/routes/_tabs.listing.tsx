import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Upload, Sparkles, Plus, X, AlertTriangle } from "lucide-react";
import { Card, PageHeader, PrimaryButton, Chip, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { runListingAgent } from "@/api/client";
import { useAppStore } from "@/store/appStore";
import { FullScreenLoader, ErrorState } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/_tabs/listing")({
  head: () => ({ meta: [{ title: "Listing Agent — शुरुआत AI" }] }),
  component: ListingPage,
});

const CATEGORIES = ["kurti", "saree", "footwear", "jewelry", "decor"];

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
