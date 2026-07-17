import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonLoader({
  messages,
  step = 0,
  className = "",
}: {
  messages?: string[];
  step?: number;
  className?: string;
}) {
  const displayMessages = messages?.length ? messages : ["Loading…"];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      {messages && (
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="font-display text-sm font-semibold text-muted-foreground"
            >
              {displayMessages[Math.min(step, displayMessages.length - 1)]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function FullScreenLoader({
  messages,
  step = 0,
}: {
  messages: string[];
  step?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-md"
    >
      <div className="relative mx-6 w-full max-w-sm text-center">
        <div className="relative mx-auto grid h-28 w-28 place-items-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-30 blur-2xl animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
          />
          <Sparkles className="relative h-10 w-10 text-primary" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-6 font-display text-lg font-semibold text-foreground"
          >
            {messages[Math.min(step, messages.length - 1)]}
          </motion.p>
        </AnimatePresence>
        <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
          <motion.div
            animate={{ width: `${((step + 1) / messages.length) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ErrorState({
  message = "Something went wrong — please try again",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="font-display text-base font-semibold text-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-lift"
        >
          Try again
        </button>
      )}
    </div>
  );
}
