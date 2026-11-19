"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, RequireAuth, useAuth } from "@/components/AuthProvider";
import { cx } from "@/lib/format";

function Nav() {
  const { me, signOut } = useAuth();
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={cx(
        "rounded-lg px-3 py-1.5 text-sm font-medium",
        pathname === href ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {label}
    </Link>
  );
  return (
    <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
        <span className="mr-2 font-bold text-teal-900">ChamberTriage</span>
        {link("/dashboard", "রোগী-তালিকা")}
        {link("/dashboard/settings", "QR ও সেটিংস")}
        {me?.isAdmin && link("/admin", "অ্যাডমিন")}
        <span className="ml-auto text-sm text-slate-600">{me?.doctor?.fullName}</span>
        <button onClick={() => void signOut()} className="rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
          লগআউট
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth role="doctor">
        <Nav />
        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </RequireAuth>
    </AuthProvider>
  );
}
