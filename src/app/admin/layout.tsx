"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { AuthProvider, RequireAuth, useAuth } from "@/components/AuthProvider";
import { ClipboardList, Users } from "@/components/icons";

function Shell({ children }: { children: ReactNode }) {
  const { me, signOut } = useAuth();
  const nav: NavItem[] = [
    { href: "/admin", label: "ডাক্তার ব্যবস্থাপনা", short: "ডাক্তার", icon: <Users size={22} /> },
    ...(me?.doctor
      ? [{ href: "/dashboard", label: "আমার রোগী", short: "রোগী", icon: <ClipboardList size={22} /> } satisfies NavItem]
      : []),
  ];
  return (
    <AppShell
      nav={nav}
      homeHref="/admin"
      user={{ name: me?.doctor?.fullName ?? me?.email ?? "অ্যাডমিন", subtitle: me?.email ?? "অ্যাডমিন" }}
      onSignOut={() => void signOut()}
    >
      {children}
    </AppShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth role="admin">
        <Shell>{children}</Shell>
      </RequireAuth>
    </AuthProvider>
  );
}
