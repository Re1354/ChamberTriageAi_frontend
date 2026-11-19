"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "@/components/icons";
import { buttonClass } from "@/components/styles";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertTriangle size={32} />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">কিছু একটা সমস্যা হয়েছে</h1>
      <p className="mt-3 max-w-sm leading-relaxed text-slate-600">ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন। সমস্যা থাকলে কিছুক্ষণ পর আসুন।</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonClass("primary", "lg")}>
          <RefreshCw size={18} /> আবার চেষ্টা করুন
        </button>
        <Link href="/" className={buttonClass("secondary", "lg")}>
          হোমে ফিরুন
        </Link>
      </div>
    </main>
  );
}
