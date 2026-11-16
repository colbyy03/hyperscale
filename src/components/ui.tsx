/** Small UI primitives shared across screens. */
import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-2xl border border-line bg-surface p-5", className)} {...rest} />;
}

export type Tone = "neutral" | "accent" | "heat" | "danger" | "info" | "violet" | "success";

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-transparent",
  heat: "bg-heat-soft text-heat border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
  violet: "bg-violet-soft text-violet border-transparent",
  success: "bg-accent-soft text-success border-transparent",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", toneClass[tone], className)}>
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-[#04201c] hover:bg-accent-strong font-semibold",
  secondary: "bg-surface-2 text-ink border border-line hover:border-line-strong",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger border border-transparent hover:border-danger",
};

export function Button({ variant = "secondary", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        buttonClass[variant],
        className,
      )}
      {...rest}
    />
  );
}

export function ButtonLink({ variant = "secondary", className, ...rest }: LinkProps & { variant?: ButtonVariant }) {
  return (
    <Link
      className={clsx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors", buttonClass[variant], className)}
      {...rest}
    />
  );
}

export function ProgressBar({ value, tone = "accent", className, label }: { value: number; tone?: "accent" | "heat"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx("h-full rounded-full", tone === "accent" ? "bg-accent" : "bg-heat")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow && <div className="mb-1 text-xs font-semibold tracking-wider text-faint uppercase">{eyebrow}</div>}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-muted">{children}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-wider text-faint uppercase">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
      {icon && <div className="mx-auto mb-3 flex justify-center text-faint">{icon}</div>}
      <div className="font-medium">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}
