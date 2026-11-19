"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-300",
  secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost: "bg-transparent text-teal-800 hover:bg-teal-50 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "lg"; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200",
        size === "lg" ? "tap px-6 py-3 text-lg" : "px-4 py-2 text-base",
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

export function Spinner({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-label="লোড হচ্ছে"
      className={cx(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        small ? "h-4 w-4" : "h-8 w-8 text-teal-700",
      )}
    />
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
      <Spinner />
      {label && <p className="text-center">{label}</p>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "red" | "amber" | "green" | "teal" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    teal: "bg-teal-100 text-teal-800",
    blue: "bg-blue-100 text-blue-800",
  } as const;
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium", tones[tone])}>{children}</span>;
}

export function Input({ label, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      <input
        {...rest}
        className={cx(
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100",
          className,
        )}
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "warn" | "danger" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    error: "border-red-200 bg-red-50 text-red-800",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-500 bg-red-600 text-white",
    success: "border-green-200 bg-green-50 text-green-900",
  } as const;
  return <div className={cx("rounded-xl border px-4 py-3", tones[tone])}>{children}</div>;
}
