import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function RangoliDivider({ className }: { className?: string }) {
  return <div className={cn("divider-rangoli w-full", className)} aria-hidden />;
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className={cn("card-warm p-5", className)}
    >
      {children}
    </motion.div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-[oklch(0.72_0.16_55)] px-6 text-base font-semibold text-primary-foreground shadow-[0_12px_28px_-10px_oklch(0.6_0.15_50/0.55)] transition-all disabled:opacity-60",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground btn-lift",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("chip", active && "chip-active")}>
      {children}
    </button>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
            {eyebrow}
          </p>
        )}
        <h2 className="truncate font-display text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="px-5 pt-6 pb-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Gauge({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color =
    clamped < 25 ? "oklch(0.58 0.14 145)" : clamped < 50 ? "oklch(0.82 0.16 85)" : "oklch(0.6 0.2 25)";
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} strokeWidth="10" fill="none" stroke="oklch(0.92 0.02 70)" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          strokeWidth="10"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-bold" style={{ color }}>{clamped}%</div>
        {label && <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}