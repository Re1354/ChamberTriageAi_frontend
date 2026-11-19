"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider, RequireAuth, useAuth } from "@/components/AuthProvider";

function Header() {
  const { me, signOut } = useAuth();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <span className="font-bold text-teal-900">ChamberTriage · অ্যাডমিন</span>
        {me?.doctor && (
          <Link href="/dashboard" className="text-sm text-teal-700 underline">
            আমার ডাক্তার-ড্যাশবোর্ড
          </Link>
        )}
        <span className="ml-auto text-sm text-slate-600">{me?.email}</span>
        <button onClick={() => void signOut()} className="text-sm text-red-700">
          লগআউট
        </button>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth role="admin">
        <Header />
        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </RequireAuth>
    </AuthProvider>
  );
}
