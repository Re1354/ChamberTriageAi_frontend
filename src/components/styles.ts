import { cx } from "@/lib/format";

/**
 * স্টাইল-হেল্পার (সার্ভার ও ক্লায়েন্ট দুই জায়গাতেই ব্যবহারযোগ্য — "use client" নেই)।
 * সার্ভার কম্পোনেন্টে লিংককে বোতামের মতো দেখাতে buttonClass() ব্যবহার করুন।
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "soft" | "dark" | "white";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300 disabled:shadow-none",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300",
  dark: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400",
  white: "bg-white text-brand-800 shadow-sm hover:bg-brand-50 active:bg-brand-100",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "min-h-11 px-4 text-[15px] gap-2 rounded-xl",
  lg: "min-h-12 px-5 text-base gap-2 rounded-xl",
  xl: "min-h-14 px-6 text-lg gap-2.5 rounded-2xl",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string | false | null) {
  return cx(
    "inline-flex select-none items-center justify-center font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
    SIZES[size],
    VARIANTS[variant],
    extra,
  );
}
