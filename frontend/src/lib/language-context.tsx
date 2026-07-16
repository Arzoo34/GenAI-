import * as React from "react";
import { getTranslations, type LanguageCode } from "./translations";

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof ReturnType<typeof getTranslations>) => string;
  businessName: string;
  setBusinessName: (name: string) => void;
};

const LanguageContext = React.createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shuruaat_language");
      if (saved) return saved as LanguageCode;
    }
    return "hi"; // Default selection is Hindi
  });

  const [businessName, setBusinessNameState] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shuruaat_business_name");
      if (saved) return saved;
    }
    return ""; // Default empty business name
  });

  const setLanguage = React.useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("shuruaat_language", lang);
    }
  }, []);

  const setBusinessName = React.useCallback((name: string) => {
    setBusinessNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("shuruaat_business_name", name);
    }
  }, []);

  const t = React.useCallback(
    (key: keyof ReturnType<typeof getTranslations>): string => {
      const dict = getTranslations(language);
      if (dict && key in dict) {
        return dict[key] as string;
      }
      const engDict = getTranslations("en");
      return (engDict[key] as string) || String(key);
    },
    [language]
  );

  const value = React.useMemo(
    () => ({ language, setLanguage, t, businessName, setBusinessName }),
    [language, setLanguage, t, businessName, setBusinessName]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
