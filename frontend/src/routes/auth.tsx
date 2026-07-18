import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Sparkles, AlertCircle, Eye, EyeOff, Globe, Server, Check } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/lib/language-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Chip, PrimaryButton, RangoliDivider } from "@/components/ui-bits";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In / Register — शुरुआत AI" },
      { name: "description", content: "Access your account or sign up to create AI listing and manage your store." },
    ],
  }),
  component: AuthPage,
});

const AUTH_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "Start Your Journey",
    subtitle: "Unlock AI tools to grow your business across Bharat",
    signInTab: "Sign In",
    signUpTab: "Register",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password (6+ chars)",
    bizLabel: "Business Name",
    bizPlaceholder: "e.g., Priya's Boutique",
    langLabel: "Select Interface Language",
    signInBtn: "Sign In",
    signUpBtn: "Create Account",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    switchSignUp: "Register Now",
    switchSignIn: "Sign In",
    demoModeTitle: "Running in Demo Mode",
    demoModeDesc: "Configure VITE_SUPABASE_URL in .env to connect a live database. Any credentials will work.",
    connectedTitle: "Connected to Supabase",
    connectedDesc: "Real, secure user authentication is active.",
    successMsg: "Successfully authenticated! Redirecting...",
  },
  hi: {
    title: "अपनी शुरुआत करें",
    subtitle: "भारत भर में अपना व्यवसाय बढ़ाने के लिए AI टूल्स का उपयोग करें",
    signInTab: "लॉग इन करें",
    signUpTab: "रजिस्टर करें",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "name@example.com",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड दर्ज करें (6+ अक्षर)",
    bizLabel: "बिजनेस का नाम",
    bizPlaceholder: "जैसे: प्रिया बुटीक",
    langLabel: "इंटरफेस भाषा चुनें",
    signInBtn: "लॉग इन करें",
    signUpBtn: "खाता बनाएं",
    noAccount: "खाता नहीं है?",
    haveAccount: "पहले से ही खाता है?",
    switchSignUp: "नया खाता बनाएं",
    switchSignIn: "लॉग इन करें",
    demoModeTitle: "डेमो मोड सक्रिय है",
    demoModeDesc: ".env में VITE_SUPABASE_URL कॉन्फ़िगर करें। कोई भी क्रेडेंशियल काम करेंगे।",
    connectedTitle: "सुपाबेस से कनेक्टेड",
    connectedDesc: "सुरक्षित, वास्तविक यूजर ऑथेंटिकेशन सक्रिय है।",
    successMsg: "सफलतापूर्वक लॉगिन हो गया! आगे बढ़ रहे हैं...",
  },
  ta: {
    title: "உங்கள் பயணத்தைத் தொடங்குங்கள்",
    subtitle: "பாரதம் முழுவதும் உங்கள் வணிகத்தை வளர்க்க AI கருவிகளைப் பயன்படுத்தவும்",
    signInTab: "உள்நுழைக",
    signUpTab: "பதிவு செய்க",
    emailLabel: "மின்னஞ்சல் முகவரி",
    emailPlaceholder: "name@example.com",
    passwordLabel: "கடவுச்சொல்",
    passwordPlaceholder: "கடவுச்சொல்லை உள்ளிடவும் (6+ எழுத்துக்கள்)",
    bizLabel: "வணிகப் பெயர்",
    bizPlaceholder: "உதாரணம்: பிரியா புட்டிக்",
    langLabel: "மொழி தேர்ந்தெடுக்கவும்",
    signInBtn: "உள்நுழைக",
    signUpBtn: "கணக்கை உருவாக்கு",
    noAccount: "கணக்கு இல்லையா?",
    haveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    switchSignUp: "இப்போது பதிவு செய்க",
    switchSignIn: "உள்நுழைக",
    demoModeTitle: "டெமோ பயன்முறை செயலில் உள்ளது",
    demoModeDesc: "தனிப்பட்ட தரவுத்தளத்தை இணைக்க .env இல் VITE_SUPABASE_URL ஐ உள்ளமைக்கவும்.",
    connectedTitle: "சூப்பாபேஸுடன் இணைக்கப்பட்டது",
    connectedDesc: "பாதுகாப்பான பயனர் அங்கீகாரம் செயலில் உள்ளது.",
    successMsg: "வெற்றிகரமாக உள்நுழைந்தது! திசைதிருப்பப்படுகிறது...",
  },
  bn: {
    title: "আপনার যাত্রা শুরু করুন",
    subtitle: "ভারতজুড়ে আপনার ব্যবসা বাড়াতে AI টুলস ব্যবহার করুন",
    signInTab: "লগ ইন করুন",
    signUpTab: "রেজিস্টার করুন",
    emailLabel: "ইমেল ঠিকানা",
    emailPlaceholder: "name@example.com",
    passwordLabel: "পাসওয়ার্ড",
    passwordPlaceholder: "পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)",
    bizLabel: "ব্যবসার নাম",
    bizPlaceholder: "যেমন: প্রিয়া বুটিক",
    langLabel: "ভাষা নির্বাচন করুন",
    signInBtn: "লগ ইন করুন",
    signUpBtn: "অ্যাকাউন্ট তৈরি করুন",
    noAccount: "অ্যাকাউন্ট নেই?",
    haveAccount: "ইতিমধ্যেই অ্যাকাউন্ট আছে?",
    switchSignUp: "এখনই রেজিস্টার করুন",
    switchSignIn: "লগ ইন করুন",
    demoModeTitle: "ডেমো মোড সক্রিয় রয়েছে",
    demoModeDesc: "ডাটাবেস যুক্ত করতে .env ফাইলে VITE_SUPABASE_URL সেট করুন। যেকোনো পাসওয়ার্ড কাজ করবে।",
    connectedTitle: "সুপাবেসের সাথে সংযুক্ত",
    connectedDesc: "নিরাপদ ইউজার অথেনটিকেশন সক্রিয় আছে।",
    successMsg: "সফলভাবে লগইন হয়েছে! এগিয়ে যাওয়া হচ্ছে...",
  }
};

const LANGUAGES = [
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "bn", label: "বাংলা" }
];

function AuthPage() {
  const navigate = useNavigate();
  const { language, setLanguage, setBusinessName } = useTranslation();
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const authError = useAppStore((s) => s.authError);
  const login = useAppStore((s) => s.login);
  const signUp = useAppStore((s) => s.signUp);
  const setAuthError = useAppStore((s) => s.setAuthError);

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bizNameField, setBizNameField] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clear errors when toggling tabs
  useEffect(() => {
    setAuthError(null);
    setValidationError(null);
  }, [activeTab, setAuthError]);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/home" });
    }
  }, [user, authLoading, navigate]);

  // Get current active translation dictionary
  const getAuthT = () => {
    return AUTH_TRANSLATIONS[language] || AUTH_TRANSLATIONS["en"];
  };

  const tAuth = getAuthT();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setAuthError(null);

    // Basic Validation
    if (!email || !email.includes("@")) {
      setValidationError(language === "hi" ? "कृपया एक वैध ईमेल पता दर्ज करें।" : "Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setValidationError(language === "hi" ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" : "Password must be at least 6 characters.");
      return;
    }

    if (activeTab === "signup" && !bizNameField.trim()) {
      setValidationError(language === "hi" ? "कृपया अपने बिजनेस का नाम दर्ज करें।" : "Please enter your business name.");
      return;
    }

    let ok = false;
    if (activeTab === "signin") {
      ok = await login(email, password, setLanguage, setBusinessName);
    } else {
      ok = await signUp(email, password, bizNameField.trim(), language, setLanguage, setBusinessName);
    }

    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/home" });
      }, 1500);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center px-5 py-8">
      {/* Language Switcher Bar at Top */}
      <div className="flex justify-end gap-1.5 mb-6">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
          <Globe className="h-3 w-3" />
        </div>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code as any)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
              language === l.code
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Header Info */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.55_0.14_60)] mb-3"
        >
          <Sparkles className="h-3 w-3" /> शुरुआत AI
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">
          {tAuth.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px] mx-auto">
          {tAuth.subtitle}
        </p>
      </div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full bg-card border border-border rounded-[32px] overflow-hidden shadow-[0_20px_40px_-15px_rgba(224,122,95,0.12)] p-6"
      >
        {/* Toggle tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted mb-6">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="h-4 w-4" />
            {tAuth.signInTab}
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {tAuth.signUpTab}
          </button>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {(validationError || authError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-start gap-2 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{validationError || authError}</div>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3.5 bg-[oklch(0.55_0.14_145)]/15 border border-[oklch(0.5_0.14_145)]/20 text-[oklch(0.5_0.14_145)] rounded-2xl text-xs font-semibold">
                <Check className="h-4 w-4 shrink-0" />
                <div>{tAuth.successMsg}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {/* Sign Up Fields */}
          {activeTab === "signup" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 pl-1">
                  {tAuth.bizLabel}
                </label>
                <input
                  type="text"
                  required
                  value={bizNameField}
                  onChange={(e) => setBizNameField(e.target.value)}
                  placeholder={tAuth.bizPlaceholder}
                  disabled={authLoading || success}
                  className="w-full h-13 rounded-2xl border border-border bg-muted/20 px-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-ring/20 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* Email input */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 pl-1">
              {tAuth.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tAuth.emailPlaceholder}
              disabled={authLoading || success}
              className="w-full h-13 rounded-2xl border border-border bg-muted/20 px-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-ring/20 transition-all"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 pl-1">
              {tAuth.passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth.passwordPlaceholder}
                disabled={authLoading || success}
                className="w-full h-13 rounded-2xl border border-border bg-muted/20 pl-4 pr-11 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-ring/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-all"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Language selector in signup */}
          {activeTab === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-1.5"
            >
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 pl-1">
                {tAuth.langLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Chip
                    key={l.code}
                    active={language === l.code}
                    onClick={() => setLanguage(l.code as any)}
                  >
                    {l.label}
                  </Chip>
                ))}
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <PrimaryButton
              type="submit"
              disabled={authLoading || success}
              className="relative w-full overflow-hidden"
            >
              {authLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {activeTab === "signin" ? (
                    <>
                      <LogIn className="h-5 w-5" />
                      {tAuth.signInBtn}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      {tAuth.signUpBtn}
                    </>
                  )}
                </span>
              )}
            </PrimaryButton>
          </div>
        </form>

        {/* Tab switch helpers */}
        <div className="mt-5 text-center text-xs text-muted-foreground">
          {activeTab === "signin" ? (
            <>
              {tAuth.noAccount}{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="font-bold text-primary hover:underline pl-0.5"
              >
                {tAuth.switchSignUp}
              </button>
            </>
          ) : (
            <>
              {tAuth.haveAccount}{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="font-bold text-primary hover:underline pl-0.5"
              >
                {tAuth.switchSignIn}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Decorative Rangoli divider */}
      <RangoliDivider className="my-6" />

      {/* Environment Config Info Card */}
      {!isSupabaseConfigured && (
        <div className="px-1 text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-[11px] text-amber-600 font-semibold leading-normal max-w-sm mx-auto">
            <Server className="h-3.5 w-3.5 shrink-0" />
            <div className="text-left">
              <strong className="block text-[12px]">{tAuth.demoModeTitle}</strong>
              <span className="opacity-90 font-medium">{tAuth.demoModeDesc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
