import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Store, Languages, Bell, HelpCircle, Shield, LogOut, ChevronRight, Award } from "lucide-react";
import { Card, PageHeader, RangoliDivider } from "@/components/ui-bits";
import { useTranslation } from "@/lib/language-context";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/_tabs/profile")({
  head: () => ({ meta: [{ title: "Profile — शुरुआत AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, businessName } = useTranslation();
  const publishedListings = useAppStore((s) => s.publishedListings);
  const setCurrentListing = useAppStore((s) => s.setCurrentListing);
  const navigate = useNavigate();
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  const items = [
    { id: "store", Icon: Store, label: t("storeDetails"), note: businessName || t("storeName") },
    { id: "lang", Icon: Languages, label: t("language"), note: t("language") === "Language" ? "English" : "हिन्दी" },
    { id: "notif", Icon: Bell, label: t("notifSettings"), note: t("notifNote") },
    { id: "help", Icon: HelpCircle, label: t("helpSupport") },
    { id: "privacy", Icon: Shield, label: t("privacy") },
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
        {items.map(({ id, Icon, label, note }) => {
          const isStore = id === "store";
          return (
            <div key={label} className="w-full">
              <button
                onClick={() => {
                  if (isStore) {
                    setShowStoreDetails(!showStoreDetails);
                  }
                }}
                className="card-warm flex w-full items-center gap-4 p-4 text-left btn-lift"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[oklch(0.97_0.03_75)]">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{label}</p>
                  {note && <p className="text-xs text-muted-foreground">{note}</p>}
                </div>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isStore && showStoreDetails ? "rotate-90" : ""}`} />
              </button>

              {/* Render products when store details expanded */}
              {isStore && showStoreDetails && (
                <div className="mt-2 space-y-2.5 pl-4 pr-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Listed Products ({publishedListings.length})
                  </h4>
                  {publishedListings.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center bg-card/40 rounded-2xl border border-dashed border-border">
                      No products listed yet.
                    </div>
                  ) : (
                    publishedListings.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setCurrentListing({
                            final_listing: {
                              title: product.title,
                              bullets: product.bullets || [
                                `High-quality ${product.material || "fabric"} material for comfort`,
                                `Perfect for ${product.occasion || "daily"} wear`,
                                `Color: ${product.colour || "Standard"}`
                              ],
                              size_chart: product.size_chart || { Free: "Standard Size Fit" },
                              price: product.price,
                              keywords: product.keywords || [product.title.toLowerCase()],
                              material: product.material,
                              fabric: product.fabric || product.material,
                              colour: product.colour,
                              pattern: product.pattern || "Solid",
                              sleeve: product.sleeve,
                              occasion: product.occasion,
                              available_sizes: product.available_sizes
                            },
                            risk_score: product.risk_score ?? 15,
                            issues_found: product.issues_found ?? [],
                            pincode_risk: { risk_level: "low", estimated_return_rate_pct: 8.4 },
                            declared_category: product.category,
                            uploadedImageUrl: product.uploadedImageUrl
                          });
                          navigate({ to: "/listing/preview" });
                        }}
                        className="flex w-full text-left gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all btn-lift"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm text-foreground truncate">{product.title}</h5>
                            <span className="text-xs font-bold text-primary shrink-0">₹{product.price}</span>
                          </div>
                          
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                            <span className="bg-muted px-1.5 py-0.5 rounded">{product.category}</span>
                            {product.material && <span className="bg-muted px-1.5 py-0.5 rounded">{product.material}</span>}
                            {product.colour && <span className="bg-muted px-1.5 py-0.5 rounded">{product.colour}</span>}
                            {product.sleeve && <span className="bg-muted px-1.5 py-0.5 rounded">{product.sleeve}</span>}
                          </div>

                          {product.available_sizes && product.available_sizes.length > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Sizes:</span>
                              <div className="flex gap-1 flex-wrap">
                                {product.available_sizes.map((sz) => (
                                  <span key={sz} className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
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
