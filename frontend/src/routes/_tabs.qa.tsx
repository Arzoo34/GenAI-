import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Pencil, Send, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";

export const Route = createFileRoute("/_tabs/qa")({
  head: () => ({ meta: [{ title: "Q&A Agent — शुरुआत AI" }] }),
  component: QAPage,
});

function QAPage() {
  const { t } = useTranslation();

  const questions = [
    {
      buyer: "Meera",
      q: "Is this saree pure silk or blend? Can I wear it for my wedding?",
      ai: "Namaste Meera 🙏 Yes, this is pure Banarasi silk (250 GSM) with hand-woven zari. It's crafted for weddings and festive occasions — the drape stays elegant all day. Dry-clean recommended.",
      ago: "2 min",
    },
    {
      buyer: "Rekha",
      q: "Aap delivery Rajasthan mein karte ho? Kitne din lagega?",
      ai: "Ji haan Rekha ji! Hum Rajasthan bhi deliver karte hain — Jaipur, Udaipur, Jodhpur sabhi jagah. Delivery mein 4–6 din lagenge, aur COD bhi available hai. 💝",
      ago: "18 min",
    },
  ];

  const patterns = [
    { label: t("fabric"), pct: 42, color: "oklch(0.688 0.164 47)" },
    { label: t("size"), pct: 26, color: "oklch(0.5 0.09 190)" },
    { label: t("colour"), pct: 18, color: "oklch(0.82 0.16 85)" },
    { label: t("delivery").split(" ")[0], pct: 14, color: "oklch(0.55 0.14 145)" },
  ];

  const fixes = [
    { label: t("fix1"), pct: t("fix1Sub") },
    { label: t("fix2"), pct: t("fix2Sub") },
    { label: t("fix3"), pct: t("fix3Sub") },
  ];

  return (
    <div>
      <PageHeader title={t("qaAgent")} subtitle={t("qaSubtitle")} />

      <section className="px-5">
        <SectionTitle eyebrow={t("recentQ")} title={t("waitingQ")} />
        <div className="space-y-4">
          {questions.map((qq, i) => (
            <motion.div
              key={qq.buyer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-warm overflow-hidden p-0"
            >
              <div className="flex items-start gap-3 border-b border-border/60 bg-[oklch(0.97_0.03_75)] p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">
                  {qq.buyer[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{qq.buyer}</p>
                    <span className="text-[11px] text-muted-foreground">{qq.ago}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">{qq.q}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">AI Suggested Reply</p>
                  <p className="mt-1 rounded-2xl rounded-tl-sm bg-[oklch(0.97_0.03_140)] p-3 text-sm leading-relaxed text-foreground/85">
                    {qq.ai}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.55_0.14_145)] px-3.5 py-2 text-xs font-semibold text-white btn-lift">
                      <Check className="h-3.5 w-3.5" /> {t("approve")}
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold">
                      <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground btn-lift">
                      <Send className="h-3.5 w-3.5" /> {t("send")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <RangoliDivider className="my-6" />

      <section className="px-5">
        <SectionTitle eyebrow={t("patternTitle")} title={t("patternTitle")} />
        <Card>
          <div className="space-y-3">
            {patterns.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-semibold" style={{ color: p.color }}>{p.pct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle eyebrow={t("topMissing")} title={t("missingTitle")} />
        <div className="space-y-2">
          {fixes.map((s) => (
            <motion.button
              key={s.label}
              whileTap={{ scale: 0.98 }}
              className="card-warm flex w-full items-center justify-between p-4 text-left btn-lift"
            >
              <div>
                <p className="font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.pct}</p>
              </div>
              <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                {t("oneTapFix")}
              </span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}