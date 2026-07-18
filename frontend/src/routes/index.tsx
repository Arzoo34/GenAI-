import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Chip, PrimaryButton, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { type LanguageCode } from "@/lib/translations";
import { useAppStore } from "@/store/appStore";
import heroImg from "@/assets/hero-entrepreneur.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "शुरुआत AI — Get started in your language" },
      { name: "description", content: "Choose your language, name your business, tell us what you sell. Shuruaat AI takes care of the rest." },
    ],
  }),
  component: Onboarding,
});

const LANGUAGES = [
  { code: "hi", label: "हिन्दी", en: "Hindi" },
  { code: "gu", label: "ગુજરાતી", en: "Gujarati" },
  { code: "ta", label: "தமிழ்", en: "Tamil" },
  { code: "te", label: "తెలుగు", en: "Telugu" },
  { code: "bn", label: "বাংলা", en: "Bengali" },
  { code: "mr", label: "मराठी", en: "Marathi" },
  { code: "kn", label: "ಕನ್ನಡ", en: "Kannada" },
  { code: "pa", label: "ਪੰਜਾਬੀ", en: "Punjabi" },
  { code: "en", label: "English", en: "English" },
];

const CATEGORIES = ["Sarees", "Kurtis", "Jewellery", "Beauty", "Kitchen", "Home Decor", "Handicrafts", "Other"];

function Onboarding() {
  const navigate = useNavigate();
  const { language, setLanguage, t, businessName, setBusinessName } = useTranslation();
  const [cat, setCat] = useState<string | null>(null);

  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);

  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/home" });
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="pb-16">
      <div className="px-6 pt-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[oklch(0.55_0.14_60)]"
        >
          <Sparkles className="h-3 w-3" /> {t("namaste")}
        </motion.div>
        <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[1.05] text-foreground">
          शुरुआत <span className="text-primary">AI</span>
        </h1>
        <p className="mt-3 font-display text-lg font-medium text-foreground/85">
          {t("tagline")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtagline")}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-6 mt-6 overflow-hidden rounded-[36px] border border-border bg-card shadow-[0_20px_50px_-24px_oklch(0.5_0.12_45/0.35)]"
      >
        <img
          src={heroImg}
          alt="Indian woman entrepreneur with her products"
          className="animate-float h-48 sm:h-64 w-full object-cover object-top"
          width={1024}
          height={1024}
        />
      </motion.div>

      <div className="px-6 pt-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground/80">{t("chooseLang")}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip
              key={l.code}
              active={language === l.code}
              onClick={() => setLanguage(l.code as LanguageCode)}
            >
              <span className="font-medium">{l.label}</span>
              {l.code !== "en" && <span className="text-[11px] opacity-70">{l.en}</span>}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6">
        <label className="mb-2 block text-sm font-semibold text-foreground/80">{t("bizName")}</label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={t("bizPlaceholder")}
          className="h-14 w-full rounded-2xl border border-border bg-card px-5 text-base outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-ring/30"
        />
      </div>

      <div className="px-6 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground/80">{t("whatSell")}</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
      </div>

      <div className="px-6 pt-8">
        <PrimaryButton onClick={() => {
          // Send user to auth page to complete registration with their business name pre-filled
          navigate({ to: "/auth" });
        }}>
          {t("continue")} <ArrowRight className="h-5 w-5" />
        </PrimaryButton>

        <div className="mt-4 text-center">
          <Link to="/auth" className="text-sm font-semibold text-primary hover:underline">
            {language === "hi" ? "पहले से खाता है? लॉग इन करें" : "Already have an account? Sign In"}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("encouragement")}
        </p>
      </div>
    </div>
  );
}