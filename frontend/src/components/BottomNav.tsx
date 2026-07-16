import { Link } from "@tanstack/react-router";
import { Home, Package, MessageCircle, HeartPulse, User } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

export function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/home", label: t("home"), Icon: Home },
    { to: "/listing", label: t("listing"), Icon: Package },
    { to: "/qa", label: t("qa"), Icon: MessageCircle },
    { to: "/health", label: t("health"), Icon: HeartPulse },
    { to: "/profile", label: t("profile"), Icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 rounded-[24px] border border-border bg-background/80 py-3 px-4 shadow-lg backdrop-blur-lg">
      <div className="flex justify-around items-center">
        {navItems.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
