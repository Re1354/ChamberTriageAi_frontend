"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";
import { Logo, LogoMark } from "./brand";
import { LogOut } from "./icons";
import { Avatar, IconButton } from "./ui";

export interface NavItem {
  href: string;
  label: string;
  short?: string;
  icon: ReactNode;
  /** কোন পাথে এই ট্যাব সক্রিয় দেখাবে */
  match?: (pathname: string) => boolean;
}

function isActive(item: NavItem, pathname: string) {
  return item.match ? item.match(pathname) : pathname === item.href;
}

/**
 * অ্যাপ-শেল: বড় স্ক্রিনে (≥1024px) বাম পাশে সাইডবার; ফোন ও ট্যাবলেটে উপরে অ্যাপ-বার আর নিচে ট্যাব-বার
 * (নেটিভ মোবাইল অ্যাপের মতো, নচ/হোম-বারের জায়গা বাদ দিয়ে)।
 */
export function AppShell({
  nav,
  user,
  onSignOut,
  topRight,
  homeHref,
  children,
}: {
  nav: NavItem[];
  user: { name: string; subtitle?: string | null; settingsHref?: string };
  onSignOut: () => void;
  topRight?: ReactNode;
  homeHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const active = nav.find((n) => isActive(n, pathname));
  const showTabs = nav.length > 1;

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* ---------- সাইডবার (ডেস্কটপ / ল্যান্ডস্কেপ ট্যাবলেট) ---------- */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo href={homeHref} compact />
        </div>
        <nav aria-label="প্রধান মেনু" className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const on = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors",
                  on ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <span className={on ? "text-brand-700" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              {user.subtitle && <p className="truncate text-xs text-slate-500">{user.subtitle}</p>}
            </div>
            <IconButton label="লগআউট" onClick={onSignOut}>
              <LogOut size={18} />
            </IconButton>
          </div>
        </div>
      </aside>

      {/* ---------- অ্যাপ-বার (ফোন / ট্যাবলেট) ---------- */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 pt-safe backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href={homeHref} aria-label="হোম" className="rounded-lg">
            <LogoMark size={30} />
          </Link>
          <p className="min-w-0 flex-1 truncate text-[17px] font-bold text-slate-900">{active?.label ?? "ChamberTriage"}</p>
          {topRight}
          {user.settingsHref ? (
            <Link href={user.settingsHref} aria-label="প্রোফাইল ও সেটিংস" className="rounded-full">
              <Avatar name={user.name} size="sm" />
            </Link>
          ) : (
            <IconButton label="লগআউট" onClick={onSignOut}>
              <LogOut size={18} />
            </IconButton>
          )}
        </div>
      </header>

      <main className={cx("mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:pb-12 lg:pt-8", showTabs ? "pb-32" : "pb-12")}>
        {children}
      </main>

      {/* ---------- নিচের ট্যাব-বার (ফোন / ট্যাবলেট) ---------- */}
      {showTabs && (
      <nav
        aria-label="প্রধান মেনু"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const on = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[12px] font-semibold"
              >
                <span
                  className={cx(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    on ? "bg-brand-100 text-brand-800" : "text-slate-500",
                  )}
                >
                  {item.icon}
                </span>
                <span className={on ? "text-brand-800" : "text-slate-500"}>{item.short ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
