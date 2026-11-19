"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@chamberai/shared";
import { Logo } from "@/components/brand";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, ShieldCheck, Stethoscope, User } from "@/components/icons";
import { Button, IconButton, Input, Notice } from "@/components/ui";
import { authedApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: authErr } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) throw new Error("ইমেইল বা পাসওয়ার্ড ভুল।");
      const me = await authedApi<MeResponse>("/api/me", { timeoutMs: 100_000 });
      if (me.doctor) router.replace("/dashboard");
      else if (me.isAdmin) router.replace("/admin");
      else {
        await supabase().auth.signOut();
        throw new Error("এই অ্যাকাউন্টের কোনো ডাক্তার-প্রোফাইল নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।");
      }
    } catch (err) {
      setError((err as Error).message || "লগইন হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ব্র্যান্ড-প্যানেল (বড় স্ক্রিন) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
        <Logo inverse />
        <div className="relative mt-auto max-w-md space-y-6">
          <h2 className="text-3xl font-bold leading-snug">রোগী ভেতরে আসার আগেই তার পুরো ইতিহাস আপনার সামনে</h2>
          <ul className="space-y-4 text-brand-50">
            {[
              [<Stethoscope key="s" size={20} />, "এক পৃষ্ঠার গোছানো ক্লিনিক্যাল সামারি"],
              [<ShieldCheck key="sh" size={20} />, "জরুরি লক্ষণে তাৎক্ষণিক অ্যালার্ট"],
              [<Lock key="l" size={20} />, "প্রত্যেক ডাক্তারের আলাদা, সুরক্ষিত অ্যাকাউন্ট"],
            ].map(([icon, text], i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">{icon}</span>
                <span className="text-[17px]">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-sm text-brand-200">© {new Date().getFullYear()} ChamberTriage AI</p>
      </aside>

      {/* ফর্ম */}
      <main className="flex flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> হোম
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <User size={24} />
            </span>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">লগইন করুন</h1>
            <p className="mt-1.5 text-slate-500">ডাক্তার ও অ্যাডমিনের জন্য — নিজের ইমেইল ও পাসওয়ার্ড দিন।</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="ইমেইল"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
            />
            <Input
              label="পাসওয়ার্ড"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              trailing={
                <IconButton label={showPw ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"} onClick={() => setShowPw((s) => !s)}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
            />
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" size="xl" block loading={busy} disabled={!email.trim() || !password}>
              লগইন
            </Button>
            {busy && (
              <p className="text-center text-xs text-slate-500" role="status">
                সার্ভার ঘুমিয়ে থাকলে প্রথমবার এক মিনিট লাগতে পারে…
              </p>
            )}
          </form>

          <div className="mt-8 space-y-3 rounded-2xl bg-slate-100/70 p-4 text-sm text-slate-600">
            <p className="flex gap-2">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-brand-600" />
              পাসওয়ার্ড ভুলে গেলে অ্যাডমিনকে বলুন — তিনি নতুন অস্থায়ী পাসওয়ার্ড দেবেন।
            </p>
            <p className="flex gap-2">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-brand-600" />
              রোগী? লগইন লাগবে না — চেম্বারের দরজায় থাকা QR কোড স্ক্যান করুন।
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
