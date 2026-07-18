import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { PrimaryButton, Card } from "@/components/ui-bits";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, FastForward } from "lucide-react";

export const Route = createFileRoute("/publish-success")({
  component: PublishSuccessPage,
});

export function KantriMotifDivider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center my-4 opacity-30 ${className || ""}`} aria-hidden>
      <svg width="100%" height="12" viewBox="0 0 100 12" preserveAspectRatio="none" className="text-primary fill-current">
        <pattern id="kantri-pattern-success" width="10" height="12" patternUnits="userSpaceOnUse">
          <polygon points="0,6 5,0 10,6 5,12" className="fill-primary" />
          <circle cx="5" cy="6" r="1.5" className="fill-background" />
        </pattern>
        <rect width="100" height="12" fill="url(#kantri-pattern-success)" />
      </svg>
    </div>
  );
}

function PublishSuccessPage() {
  const navigate = useNavigate();
  const setSimulationUnlocked = useAppStore(s => s.setSimulationUnlocked);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFF8F2]">
      {/* Top Border Accent */}
      <KantriMotifDivider className="mt-0 opacity-40 text-[oklch(0.55_0.14_145)]" />

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Animated Celebration Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
          className="relative mb-6"
        >
          {/* Decorative floating dots for "confetti" in turmeric/terracotta/sage tones */}
          <motion.div 
            animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-4 -left-4 h-3 w-3 rounded-full bg-[#E57373]"
          />
          <motion.div 
            animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} 
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.2 }}
            className="absolute top-0 -right-6 h-4 w-4 rounded-full bg-[#FFB74D]"
          />
          <motion.div 
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }} 
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }}
            className="absolute -bottom-2 -left-6 h-3 w-3 rounded-full bg-[#81C784]"
          />

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[oklch(0.55_0.14_145)]/10 text-[oklch(0.5_0.14_145)] shadow-inner">
            <CheckCircle2 className="h-12 w-12" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-4xl font-bold text-foreground">
            🎉 Your listing is live!
          </h1>
          
          <Card className="mt-8 border-border/50 bg-card/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-[#FFB74D] mt-0.5" />
              <p className="text-sm leading-relaxed text-muted-foreground text-left">
                New listings don't have buyer activity yet. Let's fast-forward a few days to see how your AI agents would help once buyers start responding.
              </p>
            </div>
          </Card>

          <PrimaryButton
            className="mt-10 w-full py-4 text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            onClick={() => {
              setSimulationUnlocked(true);
              navigate({ to: "/home" });
            }}
          >
            <FastForward className="h-5 w-5" /> Simulate a few days passing
          </PrimaryButton>
        </motion.div>
      </div>

      {/* Bottom Border Accent */}
      <KantriMotifDivider className="mb-0 opacity-40 text-[oklch(0.55_0.14_145)] rotate-180" />
    </div>
  );
}
