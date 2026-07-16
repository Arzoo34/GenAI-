import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Play, TrendingUp, Leaf, Sparkles, Calendar } from "lucide-react";
import { Card, PageHeader, SectionTitle, Gauge, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";

export const Route = createFileRoute("/_tabs/health")({
  head: () => ({ meta: [{ title: "Health Agent — शुरुआत AI" }] }),
  component: HealthPage,
});

const spark = [12, 18, 14, 22, 20, 28, 32, 26, 34, 40, 38, 46];

function HealthPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t("health")} subtitle={t("healthSubtitle")} />

      <div className="px-5">
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.05_75)] via-card to-[oklch(0.96_0.04_140)]">
          <div className="flex items-center gap-4">
            <Gauge value={92} label={t("scoreVal")} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{t("checklistTitle").split(" ")[0]}</p>
              <h3 className="font-display text-xl font-bold">{t("scoreTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("scoreDesc")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              [t("returns"), "3%", "oklch(0.55 0.14 145)"],
              [t("conv"), "8.2%", "oklch(0.5 0.09 190)"],
              [t("qa").split(" ")[0], "62%", "oklch(0.55 0.14 60)"],
              [t("rto"), "4%", "oklch(0.6 0.2 25)"],
            ].map(([k, v, c]) => (
              <div key={k} className="rounded-2xl bg-card p-3">
                <p className="font-display text-lg font-bold" style={{ color: c }}>{v}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-6 px-5">
        <Card className="bg-gradient-to-br from-secondary to-[oklch(0.4_0.09_190)] text-white">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/95 text-secondary shadow-xl"
              aria-label="Play voice summary"
            >
              <Play className="h-6 w-6 fill-secondary" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{t("voiceSummary")}</p>
              <h3 className="font-display text-lg font-semibold">{t("listenIn")}</h3>
              <div className="mt-2 flex items-end gap-0.5 h-6">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [4 + (i % 5) * 3, 10 + (i % 7) * 2, 4 + (i % 5) * 3] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.03 }}
                    className="w-0.5 rounded-full bg-white/70"
                    style={{ height: 6 }}
                  />
                ))}
              </div>
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
                <p className="font-display text-2xl font-bold text-[oklch(0.55_0.14_145)]">−42%</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("insight1").split(".")[0]}</p>
              </div>
              <MiniSpark data={spark} />
            </div>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("salesGrowth")}</p>
            <div className="mt-3 space-y-2">
              {[
                ["Pink Banarasi Saree", "₹8.4k", "24 orders"],
                ["Kundan Jhumka Set", "₹3.1k", "11 orders"],
                ["Cotton A-line Kurti", "₹2.7k", "9 orders"],
              ].map(([n, r, o]) => (
                <div key={n} className="flex items-center justify-between rounded-2xl bg-[oklch(0.97_0.03_75)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{o}</p>
                  </div>
                  <p className="font-display font-bold text-primary">{r}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle eyebrow="Top Opportunities" title={t("salesGrowth")} />
        <div className="space-y-3">
          {[
            { Icon: Sparkles, tint: "oklch(0.82 0.16 85)", title: t("trendsTitle"), note: t("trends2") },
            { Icon: TrendingUp, tint: "oklch(0.5 0.09 190)", title: t("checklist3"), note: t("insight1") },
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

      <section className="mt-6 px-5">
        <SectionTitle eyebrow={t("trendsTitle")} title={t("trendsTitle")} action={<Calendar className="h-5 w-5 text-primary" />} />
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.06_60)] to-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("trends1")}</p>
              <p className="font-display text-3xl font-extrabold text-primary">+184%</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("trends2")}</p>
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
