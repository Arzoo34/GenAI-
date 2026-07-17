import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Play, TrendingUp, Leaf, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, SectionTitle, Gauge, RangoliDivider, PrimaryButton } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { getWeeklyBrief, applyHealthSuggestion } from "@/api/client";
import { useAppStore, DEMO_SELLER_ID } from "@/store/appStore";
import { SkeletonLoader, ErrorState } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/_tabs/health")({
  head: () => ({ meta: [{ title: "Health Agent — शुरुआत AI" }] }),
  component: HealthPage,
});

type HealthBrief = {
  seller_name: string;
  week_range: string;
  stats: {
    return_rate: number;
    return_rate_trend: string;
    cod_returns: number;
    prepaid_returns: number;
    top_complaint_theme: string;
    total_orders: number;
  };
  recommendation: {
    text: string;
    money_saved_estimate: number;
    action: string;
    action_value: number;
  };
  narrative_summary: string;
  narrative_source?: string;
};

const spark = [12, 18, 14, 22, 20, 28, 32, 26, 34, 40, 38, 46];

function formatTrend(trend: string) {
  if (trend.startsWith("down_from_")) {
    const prev = trend.replace("down_from_", "");
    return { label: `↓ from ${prev}%`, positive: true };
  }
  if (trend.startsWith("up_from_")) {
    const prev = trend.replace("up_from_", "");
    return { label: `↑ from ${prev}%`, positive: false };
  }
  return { label: trend, positive: true };
}

function HealthPage() {
  const { t, language } = useTranslation();
  const sellerProfile = useAppStore((s) => s.sellerProfile);
  const healthBrief = useAppStore((s) => s.healthBrief);
  const setHealthBrief = useAppStore((s) => s.setHealthBrief);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const sellerId = sellerProfile?.seller_id || DEMO_SELLER_ID;

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedLanguage(language);

    try {
      const response = await getWeeklyBrief(sellerId, language);
      setHealthBrief(response);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || "Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  }, [sellerId, language, setHealthBrief, setSelectedLanguage]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  async function handleApplySuggestion() {
    const brief = healthBrief as HealthBrief | null;
    if (!brief?.recommendation?.action) return;

    setApplying(true);
    setApplySuccess(null);
    try {
      const result = await applyHealthSuggestion(sellerId, brief.recommendation.action);
      setApplySuccess(result?.message || "Suggestion applied successfully!");
      setTimeout(() => setApplySuccess(null), 4000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || "Something went wrong — please try again");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title={t("health")} subtitle={t("healthSubtitle")} />
        <div className="px-5">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error && !healthBrief) {
    return (
      <div>
        <PageHeader title={t("health")} subtitle={t("healthSubtitle")} />
        <ErrorState message={error} onRetry={fetchBrief} />
      </div>
    );
  }

  const brief = healthBrief as HealthBrief;
  const trend = formatTrend(brief.stats.return_rate_trend);
  const healthScore = Math.max(0, Math.min(100, 100 - brief.stats.return_rate));

  return (
    <div>
      <PageHeader title={t("health")} subtitle={t("healthSubtitle")} />

      {error && (
        <div className="mb-4 px-5">
          <ErrorState message={error} onRetry={fetchBrief} />
        </div>
      )}

      {/* Narrative summary — newspaper digest feel */}
      <div className="px-5">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-[oklch(0.98_0.02_60)] to-card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {brief.week_range} · {brief.seller_name}&apos;s Weekly Digest
          </p>
          <p className="mt-3 font-display text-base leading-relaxed text-foreground">
            {brief.narrative_summary}
          </p>
        </Card>
      </div>

      <div className="mt-6 px-5">
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.05_75)] via-card to-[oklch(0.96_0.04_140)]">
          <div className="flex items-center gap-4">
            <Gauge value={healthScore} label={t("scoreVal")} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{t("checklistTitle").split(" ")[0]}</p>
              <h3 className="font-display text-xl font-bold">{t("scoreTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("scoreDesc")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              [t("returns"), `${brief.stats.return_rate}%`, "oklch(0.55 0.14 145)"],
              [t("conv"), `${brief.stats.total_orders}`, "oklch(0.5 0.09 190)"],
              ["COD", `${brief.stats.cod_returns}`, "oklch(0.55 0.14 60)"],
              [t("rto"), `${brief.stats.prepaid_returns}`, "oklch(0.6 0.2 25)"],
            ].map(([k, v, c]) => (
              <div key={k as string} className="rounded-2xl bg-card p-3">
                <p className="font-display text-lg font-bold" style={{ color: c as string }}>{v as string}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k as string}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-6 px-5">
        <Card className="bg-gradient-to-br from-secondary to-[oklch(0.4_0.09_190)] text-white">
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/95 text-secondary shadow-xl"
              aria-label="Play voice summary"
            >
              <Play className="h-6 w-6 fill-secondary" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{t("voiceSummary")}</p>
              <h3 className="font-display text-lg font-semibold">{t("listenIn")}</h3>
              <p className="mt-1 text-sm opacity-90 line-clamp-2">{brief.narrative_summary}</p>
            </div>
          </div>
        </Card>
      </section>

      <RangoliDivider className="my-6" />

      <section className="px-5">
        <SectionTitle eyebrow="Insights" title={t("salesGrowth")} />
        <div className="space-y-3">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("returns")}</p>
                <p className="font-display text-2xl font-bold text-[oklch(0.55_0.14_145)]">{trend.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{brief.stats.top_complaint_theme}</p>
              </div>
              <MiniSpark data={spark} />
            </div>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">This week</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-2xl bg-[oklch(0.97_0.03_75)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Total orders</p>
                  <p className="text-[11px] text-muted-foreground">{brief.week_range}</p>
                </div>
                <p className="font-display font-bold text-primary">{brief.stats.total_orders}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[oklch(0.97_0.03_75)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Return rate</p>
                  <p className="text-[11px] text-muted-foreground">{brief.stats.return_rate}%</p>
                </div>
                <p className="font-display font-bold text-primary">{brief.stats.return_rate}%</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle eyebrow="Recommendation" title="Suggested action" />
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.06_60)] to-card">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-foreground">{brief.recommendation.text}</p>
              {brief.recommendation.money_saved_estimate > 0 && (
                <p className="mt-2 text-sm font-semibold text-[oklch(0.5_0.14_145)]">
                  Est. savings: ₹{brief.recommendation.money_saved_estimate.toLocaleString("en-IN")}/week
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <PrimaryButton onClick={handleApplySuggestion} disabled={applying}>
              {applying ? "Applying…" : "Apply Suggestion"}
            </PrimaryButton>
          </div>
          {applySuccess && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-[oklch(0.5_0.14_145)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              {applySuccess}
            </motion.div>
          )}
        </Card>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle eyebrow="Top Opportunities" title={t("salesGrowth")} />
        <div className="space-y-3">
          {[
            { Icon: Sparkles, tint: "oklch(0.82 0.16 85)", title: t("trendsTitle"), note: brief.stats.top_complaint_theme },
            { Icon: TrendingUp, tint: "oklch(0.5 0.09 190)", title: t("checklist3"), note: brief.recommendation.text },
            { Icon: Leaf, tint: "oklch(0.55 0.14 145)", title: t("reduceReturns"), note: t("insight2") },
          ].map((r) => (
            <Card key={r.title}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${r.tint} 20%, white)` }}>
                  <r.Icon className="h-5 w-5" style={{ color: r.tint }} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-semibold">{r.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5 pb-6">
        <SectionTitle eyebrow={t("trendsTitle")} title={t("trendsTitle")} action={<Calendar className="h-5 w-5 text-primary" />} />
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.06_60)] to-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{brief.week_range}</p>
              <p className="font-display text-3xl font-extrabold text-primary">{brief.stats.return_rate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Return rate this week</p>
            </div>
            <div className="text-5xl">🪔</div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function MiniSpark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const w = 96, h = 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="text-[oklch(0.55_0.14_145)]">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
