import { Link } from "@tanstack/react-router";
import { Home, Package, MessageCircle, HeartPulse, User, Lock } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { useAppStore } from "@/store/appStore";

export function BottomNav() {
  const { t } = useTranslation();
  const simulationUnlocked = useAppStore(s => s.simulationUnlocked);

  const navItems = [
    { to: "/home", label: t("home"), Icon: Home },
    { to: "/listing", label: t("listing"), Icon: Package },
    { to: "/qa", label: t("qa"), Icon: MessageCircle, locked: !simulationUnlocked },
    { to: "/health", label: t("health"), Icon: HeartPulse, locked: !simulationUnlocked },
    { to: "/profile", label: t("profile"), Icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 rounded-[24px] border border-border bg-background/80 py-3 px-4 shadow-lg backdrop-blur-lg">
      <div className="flex justify-around items-center">
        {navItems.map(({ to, label, Icon, locked }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 transition-colors hover:text-foreground [&.active]:text-primary ${locked ? "opacity-50 text-muted-foreground/60" : "text-muted-foreground"}`}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {locked && (
                <div className="absolute -top-1 -right-2 bg-background rounded-full p-[1px]">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
