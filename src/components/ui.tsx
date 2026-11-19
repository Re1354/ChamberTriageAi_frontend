"use client";

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { cx } from "@/lib/format";
import { AlertTriangle, CheckCircle, Info, X } from "./icons";
import { buttonClass, type ButtonSize as Size, type ButtonVariant as Variant } from "./styles";

/* ---------------------------------------------------------------------------
   Buttons (স্টাইল: ./styles.ts — সার্ভার কম্পোনেন্টেও ব্যবহারযোগ্য)
   --------------------------------------------------------------------------- */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; block?: boolean }) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, cx(block && "w-full", className))}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  external = false,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={buttonClass(variant, size, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  tone = "ghost",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "ghost" | "soft" | "secondary" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40",
        tone === "ghost" && "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
        tone === "soft" && "bg-brand-50 text-brand-800 hover:bg-brand-100",
        tone === "secondary" && "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------------
   Surfaces
   --------------------------------------------------------------------------- */
export function Card({
  children,
  className,
  padded = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cx(
        "print-plain rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-4 flex items-start gap-3", className)}>
      {icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  icon,
  tone = "slate",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "slate" | "brand" | "green" | "amber" | "red" | "sky";
  hint?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    sky: "bg-sky-50 text-sky-700",
  } as const;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Status
   --------------------------------------------------------------------------- */
export type Tone = "slate" | "red" | "amber" | "green" | "brand" | "sky" | "violet";

const BADGE: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};
const DOT: Record<Tone, string> = {
  slate: "bg-slate-400",
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  brand: "bg-brand-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export function Badge({
  children,
  tone = "slate",
  dot = false,
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset sm:text-[13px]",
        BADGE[tone],
        className,
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", DOT[tone])} aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  icon,
  action,
}: {
  tone?: "info" | "error" | "warn" | "danger" | "success";
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    error: "border-red-200 bg-red-50 text-red-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-600 bg-red-600 text-white",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;
  const defaultIcon =
    tone === "success" ? <CheckCircle size={20} /> : tone === "info" ? <Info size={20} /> : <AlertTriangle size={20} />;
  return (
    <div
      role={tone === "error" || tone === "danger" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-2xl border px-4 py-3 animate-fade-in", tones[tone])}
    >
      <span className="mt-0.5 shrink-0">{icon ?? defaultIcon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold leading-snug">{title}</p>}
        {children && <div className={cx("leading-relaxed", !!title && "mt-0.5 text-[15px] opacity-95")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <span
      role="status"
      aria-label="লোড হচ্ছে"
      className={cx(
        "inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        small ? "h-4 w-4" : "h-8 w-8 text-brand-700",
        className,
      )}
    />
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center text-slate-600">
      <Spinner />
      {label && <p className="max-w-xs text-sm leading-relaxed">{label}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-slate-200/70", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">{icon}</span>
      <p className="mt-4 text-lg font-semibold text-slate-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Forms
   --------------------------------------------------------------------------- */
export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: ReactNode;
  error?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  return (
    <div className="block">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{leading}</span>}
        <input
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={hint || error ? hintId : undefined}
          {...rest}
          className={cx(
            "min-h-12 w-full rounded-xl border bg-white px-3.5 text-slate-900 placeholder:text-slate-400 transition-shadow focus:outline-none focus:ring-4",
            error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-brand-600 focus:ring-brand-100",
            !!leading && "pl-10",
            !!trailing && "pr-12",
            className,
          )}
        />
        {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
      </div>
      {(error || hint) && (
        <p id={hintId} className={cx("mt-1.5 text-xs leading-relaxed", error ? "text-red-600" : "text-slate-500")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode }) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="block">
      {label && (
        <label htmlFor={tid} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={tid}
        {...rest}
        className={cx(
          "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100",
          className,
        )}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** অন/অফ সুইচ (role=switch) */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-slate-300",
      )}
    >
      <span
        className={cx(
          "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; count?: number }[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cx("no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold transition-colors sm:px-3",
              on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cx(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  on ? "bg-brand-100 text-brand-800" : "bg-slate-200 text-slate-600",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Dialog (মোবাইলে নিচ থেকে শিট, বড় স্ক্রিনে মাঝখানে)
   --------------------------------------------------------------------------- */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input, button, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="বন্ধ করুন" className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={onClose} />
      <div
        ref={ref}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-raised)] animate-slide-up sm:rounded-3xl sm:pb-5"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="flex-1 text-lg font-bold text-slate-900">{title}</h2>
          <IconButton label="বন্ধ করুন" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Identity
   --------------------------------------------------------------------------- */
export function initialsOf(name: string): string {
  const clean = name.replace(/^(ডা\.?|ডাঃ|dr\.?)\s*/i, "").replace(/\(.*?\)/g, "").trim();
  return Array.from(clean)[0] ?? "ড";
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white",
        size === "sm" && "h-8 w-8 text-sm",
        size === "md" && "h-10 w-10 text-base",
        size === "lg" && "h-14 w-14 text-xl",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
