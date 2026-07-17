import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Check, Pencil, Send, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { runQnaAgent } from "@/api/client";
import { useAppStore, DEMO_LISTING_ID } from "@/store/appStore";
import { SkeletonLoader, ErrorState } from "@/components/SkeletonLoader";

export const Route = createFileRoute("/_tabs/qa")({
  head: () => ({ meta: [{ title: "Q&A Agent — शुरुआत AI" }] }),
  component: QAPage,
});

type IndividualReply = {
  question_id: string;
  question: string;
  drafted_reply: string;
};

type PatternFlag = {
  topic: string;
  question_count: number;
  suggested_addition: string;
  field_to_update: string;
};

const TOPIC_COLORS: Record<string, string> = {
  sizing: "oklch(0.688 0.164 47)",
  fabric: "oklch(0.5 0.09 190)",
  colour: "oklch(0.82 0.16 85)",
  delivery: "oklch(0.55 0.14 145)",
};

function QAPage() {
  const { t, language } = useTranslation();
  const currentListing = useAppStore((s) => s.currentListing);
  const qnaData = useAppStore((s) => s.qnaData);
  const setQnaData = useAppStore((s) => s.setQnaData);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQna = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedLanguage(language);

    const listingContext =
      currentListing?.final_listing ?? {
        title: "Demo Kurti",
        bullets: ["Hand block printed cotton kurti"],
        price: 899,
      };

    try {
      const response = await runQnaAgent(DEMO_LISTING_ID, listingContext as Record<string, unknown>, language);
      setQnaData(response);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || "Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  }, [currentListing, language, setQnaData, setSelectedLanguage]);

  useEffect(() => {
    fetchQna();
  }, [fetchQna]);

  const individualReplies = (qnaData?.individual_replies ?? []) as IndividualReply[];
  const patternFlags = (qnaData?.pattern_flags ?? []) as PatternFlag[];

  const totalPatternQuestions = patternFlags.reduce((sum, p) => sum + p.question_count, 0) || 1;
  const patternPct = patternFlags.map((p) => ({
    label: p.topic.charAt(0).toUpperCase() + p.topic.slice(1),
    pct: Math.round((p.question_count / totalPatternQuestions) * 100),
    color: TOPIC_COLORS[p.topic] ?? "oklch(0.688 0.164 47)",
  }));

  if (loading) {
    return (
      <div>
        <PageHeader title={t("qaAgent")} subtitle={t("qaSubtitle")} />
        <div className="px-5">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error && !qnaData) {
    return (
      <div>
        <PageHeader title={t("qaAgent")} subtitle={t("qaSubtitle")} />
        <ErrorState message={error} onRetry={fetchQna} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("qaAgent")} subtitle={t("qaSubtitle")} />

      {error && (
        <div className="mb-4 px-5">
          <ErrorState message={error} onRetry={fetchQna} />
        </div>
      )}

      {qnaData?.fallback_used && (
        <p className="mx-5 mb-3 text-xs text-muted-foreground">Showing fallback replies — agent was unavailable</p>
      )}

      <section className="px-5">
        <SectionTitle eyebrow={t("recentQ")} title={t("waitingQ")} />
        {individualReplies.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">No buyer questions to answer right now.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {individualReplies.map((qq, i) => (
              <motion.div
                key={qq.question_id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card-warm overflow-hidden p-0"
              >
                <div className="flex items-start gap-3 border-b border-border/60 bg-[oklch(0.97_0.03_75)] p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">
                    ?
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Buyer</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">{qq.question}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">AI Suggested Reply</p>
                    <p className="mt-1 rounded-2xl rounded-tl-sm bg-[oklch(0.97_0.03_140)] p-3 text-sm leading-relaxed text-foreground/85">
                      {qq.drafted_reply}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.55_0.14_145)] px-3.5 py-2 text-xs font-semibold text-white btn-lift">
                        <Check className="h-3.5 w-3.5" /> {t("approve")}
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold">
                        <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground btn-lift">
                        <Send className="h-3.5 w-3.5" /> {t("send")}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {patternFlags.length > 0 && (
        <>
          <RangoliDivider className="my-6" />

          <section className="px-5">
            <SectionTitle eyebrow={t("patternTitle")} title={t("patternTitle")} />
            <Card>
              <div className="space-y-3">
                {patternPct.map((p) => (
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
              {patternFlags.map((flag) => (
                <motion.div
                  key={flag.topic}
                  className="card-warm flex w-full items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="font-semibold text-foreground capitalize">{flag.topic} — {flag.question_count} questions</p>
                    <p className="text-xs text-muted-foreground">{flag.suggested_addition}</p>
                    <p className="mt-1 text-[11px] text-primary">Update field: {flag.field_to_update}</p>
                  </div>
                  <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                    {t("oneTapFix")}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
