import { useEffect, useRef } from "react";
import { checkBackendHealth } from "@/api/client";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/lib/language-context";

export function BackendStatusIndicator() {
  const backendStatus = useAppStore((s) => s.backendStatus);
  const setBackendStatus = useAppStore((s) => s.setBackendStatus);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);
  const { language } = useTranslation();
  const checked = useRef(false);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language, setSelectedLanguage]);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    setBackendStatus("checking");
    checkBackendHealth()
      .then((res) => {
        setBackendStatus(res ? "online" : "offline");
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, [setBackendStatus]);

  if (backendStatus === "checking" || backendStatus === "online") return null;

  return (
    <div
      className="fixed left-1/2 top-2 z-[60] -translate-x-1/2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive shadow-sm"
      role="status"
    >
      Backend offline — some features may not work
    </div>
  );
}
