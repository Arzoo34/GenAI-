import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AppLayout } from "../components/AppLayout";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/error-reporting";
import { LanguageProvider } from "../lib/language-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">
          यह पेज नहीं मिला — This page doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-lift"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Let's try that again.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-lift"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#FFF8F2" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "MobileOptimized", content: "320" },
      { name: "HandheldFriendly", content: "true" },
      { title: "शुरुआत AI — Your smartest business partner, in your language" },
      { name: "description", content: "Shuruaat AI helps first-time Indian sellers create listings, answer buyers and grow — in Hindi, Tamil, Bengali and more." },
      { property: "og:title", content: "शुरुआत AI — Your smartest business partner" },
      { property: "og:description", content: "India's AI copilot for first-time online sellers across Bharat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Hind:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <div className="min-h-dvh bg-background bg-block-print">
          <AppLayout className="relative mx-auto max-w-[480px] bg-background/60">
            {/* Global minimal Indian texture borders */}
            <div className="absolute left-0 top-0 bottom-0 w-[6px] indian-border-minimal-left z-50 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-[6px] indian-border-minimal-right z-50 pointer-events-none" />
            <div className="indian-border-minimal-top w-full max-w-[480px] fixed top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none" />
            <div className="indian-border-minimal-bottom w-full max-w-[480px] fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none" />

            <Outlet />
          </AppLayout>
        </div>
      </LanguageProvider>
    </QueryClientProvider>
  );
}