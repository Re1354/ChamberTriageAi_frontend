"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { AuthProvider, RequireAuth, useAuth } from "@/components/AuthProvider";
import { ClipboardList, QrCode, Settings, ShieldCheck } from "@/components/icons";
import { cx } from "@/lib/format";

function Shell({ children }: { children: ReactNode }) {
  const { me, signOut } = useAuth();
  const doctor = me?.doctor;
  const nav: NavItem[] = [
    {
      href: "/dashboard",
      label: "রোগী-তালিকা",
      short: "রোগী",
      icon: <ClipboardList size={22} />,
      match: (p) => p === "/dashboard" || p.startsWith("/dashboard/visit"),
    },
    { href: "/dashboard/qr", label: "QR পোস্টার", short: "QR", icon: <QrCode size={22} /> },
    { href: "/dashboard/settings", label: "প্রোফাইল ও সেটিংস", short: "সেটিংস", icon: <Settings size={22} /> },
    ...(me?.isAdmin
      ? [{ href: "/admin", label: "অ্যাডমিন", short: "অ্যাডমিন", icon: <ShieldCheck size={22} /> } satisfies NavItem]
      : []),
  ];

  return (
    <AppShell
      nav={nav}
      homeHref="/dashboard"
      user={{ name: doctor?.fullName ?? "", subtitle: doctor?.specialty, settingsHref: "/dashboard/settings" }}
      onSignOut={() => void signOut()}
      topRight={
        doctor && (
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              doctor.isOpen ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200",
            )}
          >
            <span className={cx("h-2 w-2 rounded-full", doctor.isOpen ? "bg-emerald-500" : "bg-slate-400")} aria-hidden />
            {doctor.isOpen ? "চেম্বার চালু" : "বন্ধ"}
          </span>
        )
      }
    >
      {children}
    </AppShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth role="doctor">
        <Shell>{children}</Shell>
      </RequireAuth>
    </AuthProvider>
  );
}
