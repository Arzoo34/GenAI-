import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Star, Truck, ShieldCheck, Pencil, Send, Wrench, Info, Mic } from "lucide-react";
import { Card, PrimaryButton, GhostButton, Gauge } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { useAppStore } from "@/store/appStore";
import sareeFallback from "@/assets/product-saree.jpg";
import { useEffect, useState, useRef } from "react";
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
  material?: string;
  colour?: string;
  sleeve?: string;
  occasion?: string;
  sizes?: string[];
  description?: string;
};

type Issue = {
  issue?: string;
  severity?: string;
  contribution_pct?: number;
  explanation?: string;
};

function extractMaterial(listing: any): string {
  const text = `${listing.title || ""} ${listing.keywords?.join(" ") || ""} ${listing.bullets?.join(" ") || ""}`.toLowerCase();
  if (text.includes("cotton") || text.includes("सूती")) return "Cotton";
  if (text.includes("silk") || text.includes("रेशम")) return "Silk";
  if (text.includes("chiffon")) return "Chiffon";
  if (text.includes("georgette")) return "Georgette";
  if (text.includes("linen") || text.includes("लिनन")) return "Linen";
  if (text.includes("wool") || text.includes("ऊन")) return "Wool";
  if (text.includes("leather") || text.includes("चमड़ा")) return "Leather";
  if (text.includes("metal") || text.includes("धातु")) return "Metal";
  if (text.includes("silver") || text.includes("चांदी")) return "Silver";
  if (text.includes("gold") || text.includes("सोना")) return "Gold";
  return "";
}

function extractColour(listing: any): string {
  const text = `${listing.title || ""} ${listing.keywords?.join(" ") || ""} ${listing.bullets?.join(" ") || ""}`.toLowerCase();
  if (text.includes("red") || text.includes("लाल")) return "Red";
  if (text.includes("blue") || text.includes("नीला")) return "Blue";
  if (text.includes("green") || text.includes("हरा")) return "Green";
  if (text.includes("yellow") || text.includes("पीला")) return "Yellow";
  if (text.includes("pink") || text.includes("गुलाबी")) return "Pink";
  if (text.includes("black") || text.includes("काला")) return "Black";
  if (text.includes("white") || text.includes("सफ़ेद")) return "White";
  if (text.includes("gold") || text.includes("सुनहरा")) return "Gold";
  if (text.includes("orange") || text.includes("नारंगी")) return "Orange";
  if (text.includes("purple") || text.includes("बैंगनी")) return "Purple";
  if (text.includes("indigo") || text.includes("इंडिगो")) return "Indigo";
  return "";
}

function extractSleeve(listing: any): string {
  const text = `${listing.title || ""} ${listing.keywords?.join(" ") || ""} ${listing.bullets?.join(" ") || ""}`.toLowerCase();
  if (text.includes("sleeveless") || text.includes("बिना आस्तीन")) return "Sleeveless";
  if (text.includes("short sleeve") || text.includes("छोटी आस्तीन")) return "Short Sleeve";
  if (text.includes("full sleeve") || text.includes("पूरी आस्तीन") || text.includes("full-sleeve")) return "Full Sleeve";
  if (text.includes("half sleeve") || text.includes("half-sleeve")) return "Half Sleeve";
  if (text.includes("3/4 sleeve") || text.includes("three-quarter")) return "3/4 Sleeve";
  return "";
}

function extractOccasion(listing: any): string {
  const text = `${listing.title || ""} ${listing.keywords?.join(" ") || ""} ${listing.bullets?.join(" ") || ""}`.toLowerCase();
  if (text.includes("wedding") || text.includes("शादी") || text.includes("bridal")) return "Wedding";
  if (text.includes("festive") || text.includes("त्यौहार") || text.includes("festival")) return "Festive";
  if (text.includes("party") || text.includes("पार्टी")) return "Party Wear";
  if (text.includes("casual") || text.includes("कैजुअल")) return "Casual";
  if (text.includes("formal") || text.includes("औपचारिक")) return "Formal";
  if (text.includes("daily") || text.includes("रोजाना")) return "Daily Wear";
  return "";
}

export function KantriMotifDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center my-4 opacity-30", className)} aria-hidden>
      <svg width="100%" height="12" viewBox="0 0 100 12" preserveAspectRatio="none" className="text-primary fill-current">
        <pattern id="kantri-pattern" width="10" height="12" patternUnits="userSpaceOnUse">
          <polygon points="0,6 5,0 10,6 5,12" className="fill-primary" />
          <circle cx="5" cy="6" r="1.5" className="fill-background" />
        </pattern>
        <rect width="100" height="12" fill="url(#kantri-pattern)" />
      </svg>
    </div>
  );
}

function PreviewPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const currentListing = useAppStore((s) => s.currentListing);
  const setCurrentListing = useAppStore((s) => s.setCurrentListing);
  const resolveIssue = useAppStore((s) => s.resolveIssue);

  useEffect(() => {
    if (!currentListing?.final_listing) {
      navigate({ to: "/listing" });
    }
  }, [currentListing, navigate]);

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState(1499);
  const [material, setMaterial] = useState("");
  const [colour, setColour] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [isRecordingDescription, setIsRecordingDescription] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize values when currentListing loads
  useEffect(() => {
    if (currentListing?.final_listing) {
      const listingObj = currentListing.final_listing as any;
      setProductName(listingObj.title || "");
      setPrice(listingObj.price || 1499);
      setMaterial(listingObj.material || extractMaterial(listingObj));
      setColour(listingObj.colour || extractColour(listingObj));
      setSleeve(listingObj.sleeve || extractSleeve(listingObj));
      setOccasion(listingObj.occasion || extractOccasion(listingObj));
      
      const initialSizes = listingObj.sizes || (listingObj.size_chart ? Object.keys(listingObj.size_chart) : ["Free"]);
      setSelectedSizes(initialSizes);
      
      setDescription(listingObj.description || (listingObj.bullets ? listingObj.bullets.join("\n") : ""));
    }
  }, [currentListing]);

  if (!currentListing?.final_listing) {
    return null;
  }

  const riskScore = currentListing.risk_score ?? 0;
  const readiness = Math.round(100 - riskScore);
  const issues = (currentListing.issues_found ?? []) as Issue[];
  const imageSrc = (currentListing.uploadedImageUrl as string) || sareeFallback;
  const isApparel = currentListing.declared_category === "kurti" || currentListing.declared_category === "saree";

  function updateListingField(key: string, value: any) {
    if (!currentListing) return;
    setCurrentListing({
      ...currentListing,
      final_listing: {
        ...currentListing.final_listing,
        [key]: value,
      },
    });
  }

  function handleFixIssue(index: number) {
    resolveIssue(index);
  }

  function toggleSizeSelection(sz: string) {
    let next: string[];
    if (selectedSizes.includes(sz)) {
      next = selectedSizes.filter((s) => s !== sz);
    } else {
      next = [...selectedSizes, sz];
    }
    setSelectedSizes(next);
    updateListingField("sizes", next);
    
    const newChart: Record<string, string> = {};
    next.forEach((s) => {
      newChart[s] = (currentListing?.final_listing as any)?.size_chart?.[s] || "Standard Fit";
    });
    updateListingField("size_chart", newChart);
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
      alert("Speech recognition is not supported in this browser. Please type your description manually.");
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
        setDescription((prev) => {
          const next = prev ? prev + " " + transcript : transcript;
          updateListingField("description", next);
          const lines = next.split("\n").filter((l: string) => l.trim().length > 0);
          updateListingField("bullets", lines);
          return next;
        });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        setIsRecordingDescription(false);
      };

      recognition.onend = () => {
        setIsRecordingDescription(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsRecordingDescription(false);
    }
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

      <div className="relative">
        <img src={imageSrc} alt={productName || "Product"} className="h-96 w-full object-cover object-top" width={800} height={800} loading="lazy" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
          {t("aiGenerated")}
        </div>
      </div>

      {/* Interactive & Editable Attributes Grid Section */}
      <div className="px-5 pt-5 space-y-4">
        {/* Product Name (Full Width) */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Product Name / SEO Title
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              updateListingField("title", e.target.value);
            }}
            placeholder="e.g. Pink Banarasi Silk Saree"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
          />
        </div>

        {/* Price & Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setPrice(val);
                  updateListingField("price", val);
                }}
                className="w-full rounded-xl border border-border bg-card pl-7 pr-4 py-2.5 text-sm font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-1 rounded-xl bg-[oklch(0.55_0.14_145)]/10 border border-[oklch(0.55_0.14_145)]/20 px-3 py-2.5 justify-center h-[42px]">
              <Star className="h-4 w-4 fill-[oklch(0.5_0.14_145)] text-[oklch(0.5_0.14_145)]" />
              <span className="text-xs font-bold text-[oklch(0.5_0.14_145)]">New Listing</span>
            </div>
          </div>
        </div>

        {/* Product Attributes Header */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <h3 className="font-display font-bold text-foreground">Product Attributes</h3>
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
              className="overflow-hidden space-y-4"
            >
              {/* Material & Colour Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Material / Fabric
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => {
                      setMaterial(e.target.value);
                      updateListingField("material", e.target.value);
                    }}
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
                    onChange={(e) => {
                      setColour(e.target.value);
                      updateListingField("colour", e.target.value);
                    }}
                    placeholder="e.g. Indigo Blue Floral"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Occasion & Sleeve (Apparel Only) Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => {
                      setOccasion(e.target.value);
                      updateListingField("occasion", e.target.value);
                    }}
                    placeholder="e.g. Wedding / Festive"
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
                      onChange={(e) => {
                        setSleeve(e.target.value);
                        updateListingField("sleeve", e.target.value);
                      }}
                      placeholder="e.g. Full Sleeve"
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
                          "rounded-xl border px-4 py-2 text-xs font-semibold btn-lift transition-all",
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider motif */}
        <KantriMotifDivider />

        {/* Description Textarea with Integrated Mic Button */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Description
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                updateListingField("description", e.target.value);
                const lines = e.target.value.split("\n").filter(l => l.trim().length > 0);
                updateListingField("bullets", lines);
              }}
              placeholder="Tell buyers what makes it special..."
              rows={5}
              className="w-full rounded-xl border border-border bg-card pl-4 pr-12 py-3 text-sm leading-relaxed focus:border-primary focus:outline-none"
            />
            {/* Corner circular mic button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={toggleDescriptionRecording}
              className={cn(
                "absolute right-3 bottom-4 grid h-9 w-9 place-items-center rounded-full text-white shadow-md btn-lift",
                isRecordingDescription
                  ? "bg-destructive ring-4 ring-destructive/30 animate-pulse"
                  : "bg-primary hover:bg-primary-hover"
              )}
              aria-label={isRecordingDescription ? "Stop description recording" : "Record description speech"}
            >
              {isRecordingDescription ? (
                <span className="h-3 w-3 rounded-full bg-white animate-ping" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Static Delivery & COD details badge */}
        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4">
          <Row icon={<Truck className="h-4 w-4 text-secondary" />} label={t("deliveryBy")} />
          <Row icon={<ShieldCheck className="h-4 w-4 text-[oklch(0.55_0.14_145)]" />} label={t("codBadge")} />
        </div>
      </div>

      {/* Return Risk Evaluation summary card */}
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
