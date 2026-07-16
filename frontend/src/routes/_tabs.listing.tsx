import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Upload, Sparkles, Plus, X } from "lucide-react";
import { Card, PageHeader, PrimaryButton, Chip, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";

export const Route = createFileRoute("/_tabs/listing")({
  head: () => ({ meta: [{ title: "Listing Agent — शुरुआत AI" }] }),
  component: ListingPage,
});

function ListingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [pincodes, setPincodes] = useState<string[]>(["110001", "400001"]);
  const [pin, setPin] = useState("");

  const MESSAGES = [
    t("loading0"),
    t("loading1"),
    t("loading2"),
    t("loading3"),
    t("loading4"),
    t("loading5"),
  ];

  function start() {
    setGenerating(true);
    setStep(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i >= MESSAGES.length) {
        clearInterval(timer);
        setTimeout(() => navigate({ to: "/listing/preview" }), 500);
      } else {
        setStep(i);
      }
    }, 700);
  }

  return (
    <div>
      <PageHeader title={t("createListing")} subtitle={t("listingSubtitle")} />

      <div className="px-5">
        <Card className="bg-gradient-to-br from-[oklch(0.96_0.04_60)] to-card p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("speakProd")}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.75_0.16_60)] text-primary-foreground shadow-[0_16px_36px_-12px_oklch(0.6_0.15_50/0.55)]"
            aria-label="Record speech"
          >
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <Mic className="relative h-10 w-10" strokeWidth={2.2} />
          </motion.button>
          <div className="mt-4 flex items-end justify-center gap-1 h-8">
            {[8, 14, 22, 10, 26, 18, 12, 20, 8, 14, 22, 10].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: [h, h + 8, h] }}
                transition={{ duration: 0.9 + i * 0.05, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 rounded-full bg-primary/70"
                style={{ height: h }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tap to record in your language</p>
        </Card>
      </div>

      <div className="my-6 flex items-center gap-3 px-5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <button className="card-warm flex flex-col items-center gap-2 p-5 btn-lift">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold">{t("uploadImg").split(" ")[0]} Photo</span>
          </button>
          <button className="card-warm flex flex-col items-center gap-2 p-5 btn-lift">
            <Upload className="h-6 w-6 text-secondary" />
            <span className="text-sm font-semibold">{t("uploadImg")}</span>
          </button>
        </div>
      </div>

      <RangoliDivider className="my-6" />

      <div className="space-y-4 px-5">
        <Field label="Product Name" placeholder="e.g. Pink Banarasi Silk Saree" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Material" placeholder="Silk" />
          <Field label="Fabric" placeholder="Banarasi" />
          <Field label="Colour" placeholder="Pink" />
          <Field label="Pattern" placeholder="Zari" />
          <Field label="Sleeve" placeholder="Half" />
          <Field label="Occasion" placeholder="Wedding" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Sizes</label>
          <div className="flex flex-wrap gap-2">
            {["Free", "S", "M", "L", "XL", "XXL"].map((s) => (
              <Chip key={s} active={s === "Free"}>{s}</Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Description</label>
          <textarea
            rows={4}
            placeholder="Tell buyers what makes it special…"
            className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/30"
          />
        </div>

        <Field label={t("fix2").replace("Add ", "")} placeholder="Dry clean recommended" />

        <div>
          <label className="mb-2 block text-sm font-semibold">{t("targetPins")}</label>
          <div className="flex flex-wrap gap-2">
            {pincodes.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1.5 text-sm font-medium text-secondary">
                {p}
                <button aria-label={`Remove ${p}`} onClick={() => setPincodes((prev) => prev.filter((x) => x !== p))}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t("addPin").replace("Add ", "")}
                className="h-9 w-28 rounded-full border border-border bg-card px-3 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => { if (pin.length === 6) { setPincodes([...pincodes, pin]); setPin(""); } }}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
                aria-label="Add Pincode"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-8">
        <PrimaryButton onClick={start}>
          <Sparkles className="h-5 w-5" /> {t("genListing")}
        </PrimaryButton>
      </div>

      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-md"
          >
            <div className="relative mx-6 w-full max-w-sm text-center">
              <div className="relative mx-auto grid h-28 w-28 place-items-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-30 blur-2xl animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
                />
                {[0, 60, 120, 180, 240, 300].map((d) => (
                  <span
                    key={d}
                    className="absolute h-2 w-2 rounded-full bg-accent animate-spark"
                    style={{
                      transform: `rotate(${d}deg) translateY(-46px)`,
                      animationDelay: `${d / 200}s`,
                    }}
                  />
                ))}
                <Sparkles className="relative h-10 w-10 text-primary" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-6 font-display text-lg font-semibold text-foreground"
                >
                  {MESSAGES[step]}
                </motion.p>
              </AnimatePresence>
              <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                <motion.div
                  animate={{ width: `${((step + 1) / MESSAGES.length) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/30"
      />
    </div>
  );
}
