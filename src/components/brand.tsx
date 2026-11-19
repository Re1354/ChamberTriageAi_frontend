import Link from "next/link";
import { cx } from "@/lib/format";

export const APP_NAME = "ChamberTriage AI";
export const APP_TAGLINE_BN = "চেম্বারের AI প্রি-কনসালটেশন সহকারী";

/** লোগো-মার্ক: কথোপকথন (বাবল) + হৃদস্পন্দন রেখা — "রোগীর কথা, ডাক্তারের আগে" */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      {/* গ্রেডিয়েন্ট-id ব্যবহার করা হয়নি: একই পেজে লুকানো কপি থাকলে id-রেফারেন্স ভেঙে লোগো অদৃশ্য হয় */}
      <rect width="64" height="64" rx="15" fill="#0f766e" />
      <path d="M0 15A15 15 0 0 1 15 0h34a15 15 0 0 1 15 15v15C42 34 20 26 0 40z" fill="#14b8a6" fillOpacity=".55" />
      <path
        d="M17 19h30a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H30.5L22 50.5V44h-5a5 5 0 0 1-5-5V24a5 5 0 0 1 5-5z"
        fill="#fff"
        fillOpacity=".16"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 31.5h7l3-6.5 5 13 3.5-9 2.2 2.5h8.3"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  compact = false,
  inverse = false,
  className,
}: {
  href?: string | null;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  const inner = (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={compact ? 30 : 34} />
      <span className="flex flex-col leading-none">
        <span className={cx("text-[17px] font-bold tracking-tight", inverse ? "text-white" : "text-slate-900")}>
          ChamberTriage<span className={inverse ? "text-brand-200" : "text-brand-600"}> AI</span>
        </span>
        {!compact && (
          <span className={cx("mt-1 text-[11px] font-medium", inverse ? "text-brand-100" : "text-slate-500")}>
            {APP_TAGLINE_BN}
          </span>
        )}
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="rounded-lg" aria-label={`${APP_NAME} — হোম`}>
      {inner}
    </Link>
  );
}
