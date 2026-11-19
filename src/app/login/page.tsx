"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@chamberai/shared";
import { Button, Card, Input, Notice } from "@/components/ui";
import { authedApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <Card className="w-full space-y-5">
        <div>
          <p className="text-sm text-slate-500">ChamberTriage AI</p>
          <h1 className="text-2xl font-bold text-teal-900">ডাক্তার / অ্যাডমিন লগইন</h1>
          <p className="mt-1 text-sm text-slate-600">প্রত্যেক ডাক্তারের নিজস্ব অ্যাকাউন্ট — নিজের ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="ইমেইল" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="পাসওয়ার্ড"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            লগইন
          </Button>
          {busy && <p className="text-center text-xs text-slate-500">সার্ভার ঘুমিয়ে থাকলে প্রথমবার এক মিনিট লাগতে পারে…</p>}
        </form>
        <p className="text-xs text-slate-500">পাসওয়ার্ড ভুলে গেলে অ্যাডমিনকে বলুন — তিনি নতুন অস্থায়ী পাসওয়ার্ড দেবেন।</p>
      </Card>
    </main>
  );
}
