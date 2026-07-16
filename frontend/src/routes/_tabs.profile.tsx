import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Languages, Bell, HelpCircle, Shield, LogOut, ChevronRight, Award } from "lucide-react";
import { Card, PageHeader, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";

export const Route = createFileRoute("/_tabs/profile")({
  head: () => ({ meta: [{ title: "Profile — शुरुआत AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, businessName } = useTranslation();

  const items = [
    { Icon: Store, label: t("storeDetails"), note: businessName || t("storeName") },
    { Icon: Languages, label: t("language"), note: t("language") === "Language" ? "English" : "हिन्दी" },
    { Icon: Bell, label: t("notifSettings"), note: t("notifNote") },
    { Icon: HelpCircle, label: t("helpSupport") },
    { Icon: Shield, label: t("privacy") },
  ];

  return (
    <div>
      <PageHeader title={t("profile")} subtitle={t("profileSubtitle")} />

      <div className="px-5">
        <Card className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent font-display text-3xl font-extrabold text-primary-foreground">
            {(businessName || "Priya")[0].toUpperCase()}
          </div>
          <h2 className="mt-3 font-display text-xl font-bold">{businessName || "Priya Sharma"}</h2>
          <p className="text-sm text-muted-foreground">{businessName ? `${businessName} • Jaipur` : t("storeName")}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.55_0.14_145)]/15 px-3 py-1 text-xs font-semibold text-[oklch(0.5_0.14_145)]">
            <Award className="h-3.5 w-3.5" /> {t("topRated")}
          </div>
        </Card>
      </div>

      <RangoliDivider className="my-6" />

      <div className="space-y-2 px-5">
        {items.map(({ Icon, label, note }) => (
          <button
            key={label}
            className="card-warm flex w-full items-center gap-4 p-4 text-left btn-lift"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[oklch(0.97_0.03_75)]">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{label}</p>
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="px-5 pt-6">
        <Link to="/" className="flex items-center justify-center gap-2 rounded-full border border-destructive/30 bg-card py-3 text-sm font-semibold text-destructive btn-lift">
          <LogOut className="h-4 w-4" /> {t("logout")}
        </Link>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("madeWith")}
        </p>
      </div>
    </div>
  );
}
