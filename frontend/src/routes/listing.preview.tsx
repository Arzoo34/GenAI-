import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Truck, ShieldCheck, Pencil, Send, Wrench, Info } from "lucide-react";
import { Card, PrimaryButton, GhostButton, Gauge } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { useAppStore } from "@/store/appStore";
import sareeFallback from "@/assets/product-saree.jpg";
import { useEffect } from "react";

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

function PreviewPage() {
  const { t } = useTranslation();
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
  const sizes = listing.size_chart ? Object.keys(listing.size_chart) : ["Free Size"];

  function handleFixIssue(index: number) {
    // Temporary client-side simplification: no live recalculate-risk endpoint yet.
    // Optimistically remove the issue and subtract its contribution_pct from risk_score.
    resolveIssue(index);
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
        <img src={imageSrc} alt={listing.title || "Product"} className="h-96 w-full object-cover object-top" width={800} height={800} loading="lazy" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
          {t("aiGenerated")}
        </div>
      </div>

      <div className="px-5 pt-5">
        <h1 className="font-display text-xl font-bold leading-snug text-foreground">
          {listing.title || t("sareeTitle")}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-foreground">
              ₹{(listing.price ?? 1499).toLocaleString("en-IN")}
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

        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground/70">{t("selectSize")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4">
          <Row icon={<Truck className="h-4 w-4 text-secondary" />} label={t("deliveryBy")} />
          <Row icon={<ShieldCheck className="h-4 w-4 text-[oklch(0.55_0.14_145)]" />} label={t("codBadge")} />
        </div>

        <div className="mt-5">
          <h3 className="font-display font-semibold">{t("aboutItem")}</h3>
          {listing.bullets && listing.bullets.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/80">
              {listing.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {t("desc1")} {t("desc2")}
            </p>
          )}

          {listing.size_chart && Object.keys(listing.size_chart).length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {Object.entries(listing.size_chart).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-dashed border-border/70 py-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

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
