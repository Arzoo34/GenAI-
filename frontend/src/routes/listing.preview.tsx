import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Truck,
  ShieldCheck,
  Pencil,
  Send,
  Wrench,
  Info,
  ChevronDown,
  Mic,
} from "lucide-react";
import { Card, PrimaryButton, GhostButton, Gauge } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { useAppStore } from "@/store/appStore";
import sareeFallback from "@/assets/product-saree.jpg";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listing/preview")({
  head: () => ({ meta: [{ title: "Listing Preview — शुरुआत AI" }] }),
  component: PreviewPage,
});

type ListingContent = {
  title?: string;
  bullets?: string[];
  size_chart?: Record<string, string>;
  price?: number;
  keywords?: string[];
};

type Issue = {
  issue?: string;
  severity?: string;
  contribution_pct?: number;
  explanation?: string;
};

function KantriMotifDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 my-6", className)} aria-hidden>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="text-primary/45 text-xs font-display">❖ ❖ ❖</span>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}

function PreviewPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const currentListing = useAppStore((s) => s.currentListing);
  const resolveIssue = useAppStore((s) => s.resolveIssue);

  useEffect(() => {
    if (!currentListing?.final_listing) {
      navigate({ to: "/listing" });
    }
  }, [currentListing, navigate]);

  if (!currentListing?.final_listing) {
    return null;
  }

  const listing = currentListing.final_listing as ListingContent;
  const riskScore = currentListing.risk_score ?? 0;
  const readiness = Math.round(100 - riskScore);
  const issues = (currentListing.issues_found ?? []) as Issue[];
  const imageSrc = (currentListing.uploadedImageUrl as string) || sareeFallback;
  const initialSizes = listing.size_chart ? Object.keys(listing.size_chart) : ["Free"];

  const category = currentListing?.declared_category || "kurti";
  const isApparel = category === "kurti" || category === "saree";

  // Form states
  const [productName, setProductName] = useState(listing.title || "");
  const [price, setPrice] = useState(listing.price || 1499);
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSizes);
  const [description, setDescription] = useState(
    listing.bullets && listing.bullets.length > 0
      ? listing.bullets.join("\n")
      : `${t("desc1")} ${t("desc2")}`
  );
  
  const [showDetails, setShowDetails] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);

  function handleFixIssue(index: number) {
    resolveIssue(index);
  }

  function handleDescriptionSpeech() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isTranscribing) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

    recognition.onstart = () => {
      setIsTranscribing(true);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsTranscribing(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setDescription((prev) => {
          const spacing = prev.trim() ? " " : "";
          return prev + spacing + transcript;
        });
      }
    };

    recognition.start();
  }

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
        <Link to="/listing" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("previewTitle")}</p>
        <div className="w-10" />
      </div>

      {currentListing.fallback_used && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Generated from fallback catalog — agent was unavailable
        </div>
      )}

      {/* Buyer Preview Card (Top) */}
      <div className="relative">
        <img src={imageSrc} alt={productName || "Product"} className="h-96 w-full object-cover object-top" width={800} height={800} loading="lazy" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
          {t("aiGenerated")}
        </div>
      </div>

      <div className="px-5 pt-5">
        <h1 className="font-display text-xl font-bold leading-snug text-foreground">
          {productName || t("sareeTitle")}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-foreground">
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[oklch(0.55_0.14_145)]/10 px-2 py-0.5">
            <Star className="h-3.5 w-3.5 fill-[oklch(0.5_0.14_145)] text-[oklch(0.5_0.14_145)]" />
            <span className="text-xs font-bold text-[oklch(0.5_0.14_145)]">New listing</span>
          </div>
        </div>

        {listing.keywords && listing.keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.keywords.slice(0, 5).map((kw) => (
              <span key={kw} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {kw}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4">
          <Row icon={<Truck className="h-4 w-4 text-secondary" />} label={t("deliveryBy")} />
          <Row icon={<ShieldCheck className="h-4 w-4 text-[oklch(0.55_0.14_145)]" />} label={t("codBadge")} />
        </div>
      </div>

      {/* Product Attributes Form Section */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h3 className="font-display font-bold text-lg text-foreground">Product Attributes</h3>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition animate-pulse-subtle"
          >
            {showDetails ? "Hide details" : "Show details"}
            <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 space-y-4"
            >
              {/* Product Name & Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Pink Banarasi Silk Saree"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="1499"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Material & Color paired row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Material / Fabric
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Silk, Cotton"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Colour / Pattern
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Indigo Blue, Floral"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Sleeve & Occasion paired row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isApparel && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Sleeve
                    </label>
                    <input
                      type="text"
                      value={sleeve}
                      onChange={(e) => setSleeve(e.target.value)}
                      placeholder="e.g. Half Sleeve, Sleeveless"
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                )}
                <div className={isApparel ? "" : "md:col-span-2"}>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Festive, Casual"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Sizes Multi-Select */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Sizes
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Free", "S", "M", "L", "XL", "XXL"].map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSizes(selectedSizes.filter((s) => s !== size));
                          } else {
                            setSelectedSizes([...selectedSizes, size]);
                          }
                        }}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all btn-lift ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KantriMotifDivider */}
        <KantriMotifDivider />

        {/* Description Section with corner Mic button */}
        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Description
          </label>
          <div className="relative mt-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers what makes it special..."
              rows={5}
              className="w-full rounded-xl border border-border bg-white pl-4 pr-12 py-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
            />
            <button
              type="button"
              onClick={handleDescriptionSpeech}
              className={`absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full shadow-md text-white transition-all btn-lift ${
                isTranscribing
                  ? "bg-destructive animate-pulse ring-4 ring-destructive/40"
                  : "bg-primary hover:bg-primary-dark"
              }`}
              title="Record description"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Return Risk Card */}
      <div className="mt-6 px-5">
        <Card className="bg-gradient-to-br from-[oklch(0.97_0.03_140)] to-card">
          <div className="flex items-center gap-4">
            <Gauge value={riskScore} label="Return Risk" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.5_0.14_145)]">
                {riskScore < 25 ? t("lowRisk") : riskScore < 50 ? "Medium risk" : "High risk"}
              </p>
              <h3 className="font-display text-lg font-semibold">Your listing is {readiness}% ready</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {issues.length > 0
                  ? `${issues.length} gap${issues.length > 1 ? "s" : ""} to address before publishing.`
                  : "Looking marketplace-ready!"}
              </p>
            </div>
          </div>

          {issues.length > 0 && (
            <ul className="mt-4 space-y-2">
              {issues.map((issue, i) => (
                <motion.li
                  key={`${issue.issue}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{issue.explanation || issue.issue || "Listing gap"}</span>
                    {issue.contribution_pct != null && issue.contribution_pct > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">(+{issue.contribution_pct}% risk)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFixIssue(i)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary btn-lift"
                  >
                    <Wrench className="h-3 w-3" /> Fix this
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8 flex gap-3 px-5">
        <GhostButton className="flex-1"><Pencil className="h-4 w-4" /> {t("editListing")}</GhostButton>
        <PrimaryButton className="flex-1"><Send className="h-5 w-5" /> {t("publishStore").replace("to Store", "")}</PrimaryButton>
      </div>
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}
