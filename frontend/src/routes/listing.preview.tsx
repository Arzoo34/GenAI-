import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Truck, ShieldCheck, Check, Pencil, Send } from "lucide-react";
import { Card, PrimaryButton, GhostButton, Gauge } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import saree from "@/assets/product-saree.jpg";

export const Route = createFileRoute("/listing/preview")({
  head: () => ({ meta: [{ title: "Listing Preview — शुरुआत AI" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const { t } = useTranslation();

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
        <Link to="/listing" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("previewTitle")}</p>
        <div className="w-10" />
      </div>

      <div className="relative">
        <img src={saree} alt="Pink Banarasi silk saree" className="h-96 w-full object-cover object-top" width={800} height={800} loading="lazy" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
          {t("aiGenerated")}
        </div>
      </div>

      <div className="px-5 pt-5">
        <h1 className="font-display text-xl font-bold leading-snug text-foreground">
          {t("sareeTitle")}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-foreground">₹1,499</span>
            <span className="text-sm text-muted-foreground line-through">₹2,999</span>
            <span className="rounded-md bg-[oklch(0.55_0.14_145)]/15 px-1.5 py-0.5 text-xs font-bold text-[oklch(0.5_0.14_145)]">{t("discount")}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[oklch(0.55_0.14_145)]/10 px-2 py-0.5">
            <Star className="h-3.5 w-3.5 fill-[oklch(0.5_0.14_145)] text-[oklch(0.5_0.14_145)]" />
            <span className="text-xs font-bold text-[oklch(0.5_0.14_145)]">4.6</span>
            <span className="text-[11px] text-muted-foreground">(238)</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground/70">{t("colour")}</p>
          <div className="mt-2 flex gap-2">
            {["#E91E63", "#8E24AA", "#00897B", "#FBC02D"].map((c, i) => (
              <button
                key={c}
                className="h-9 w-9 rounded-full border-2"
                style={{ background: c, borderColor: i === 0 ? "var(--color-primary)" : "transparent" }}
                aria-label={`colour ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground/70">{t("selectSize")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Free Size", "S", "M", "L", "XL"].map((s, i) => (
              <button
                key={s}
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
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            {t("desc1")} {t("desc2")}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              [t("fabric"), "Banarasi Silk"],
              ["Material", "Pure Silk 250 GSM"],
              ["Sizes", "Free Size"],
              [t("fix2").replace("Add ", ""), "Dry clean only"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-dashed border-border/70 py-1.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-6 px-5">
        <Card className="bg-gradient-to-br from-[oklch(0.97_0.03_140)] to-card">
          <div className="flex items-center gap-4">
            <Gauge value={18} label="Return Risk" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.5_0.14_145)]">{t("lowRisk")}</p>
              <h3 className="font-display text-lg font-semibold">Your listing is 82% ready</h3>
              <p className="mt-1 text-sm text-muted-foreground">A few small tweaks and it's marketplace-perfect.</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {[
              "Add size chart",
              t("fix2"),
              t("fix3").replace("Add ", "Upload "),
              t("insight1").split(" conversion")[0],
            ].map((s) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 text-sm"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[oklch(0.55_0.14_145)]/15 text-[oklch(0.5_0.14_145)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{s}</span>
              </motion.li>
            ))}
          </ul>
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
