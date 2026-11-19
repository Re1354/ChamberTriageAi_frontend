"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useAuth } from "@/components/AuthProvider";
import { Button, Card, Input, Notice } from "@/components/ui";
import { authedApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { me, refresh } = useAuth();
  const doctor = me!.doctor!;
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const link = `${window.location.origin}/d/${doctor.slug}`;
    setUrl(link);
    void QRCode.toDataURL(link, { width: 900, margin: 2, errorCorrectionLevel: "M" }).then(setQr);
  }, [doctor.slug]);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ tone: "error", text: "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।" });
    if (pw !== pw2) return setMsg({ tone: "error", text: "দুটো পাসওয়ার্ড মেলেনি।" });
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase().auth.updateUser({ password: pw });
      if (error) throw new Error(error.message);
      await authedApi("/api/doctor/me/password-changed", { body: {} });
      await refresh();
      setPw("");
      setPw2("");
      setMsg({ tone: "success", text: "পাসওয়ার্ড বদলানো হয়েছে।" });
      if (doctor.mustChangePassword) router.replace("/dashboard");
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message || "পাসওয়ার্ড বদলানো যায়নি।" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {doctor.mustChangePassword && (
        <Notice tone="warn">প্রথমবার লগইন করেছেন — নিরাপত্তার জন্য আগে নিজের নতুন পাসওয়ার্ড সেট করুন।</Notice>
      )}

      <Card className="space-y-4">
        <h2 className="no-print text-xl font-bold">আমার QR (চেম্বারের দরজায় লাগানোর জন্য)</h2>
        <div className="mx-auto max-w-sm space-y-3 rounded-2xl border-2 border-teal-700 p-6 text-center">
          <p className="text-2xl font-bold text-teal-900">{doctor.fullName}</p>
          {doctor.specialty && <p className="text-slate-700">{doctor.specialty}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR" className="mx-auto w-64" />}
          <p className="text-lg font-semibold">ফোনে স্ক্যান করে AI সহকারী চালু করুন</p>
          <p className="text-sm text-slate-600">ডাক্তার দেখানোর আগে আপনার সমস্যা জানিয়ে দিন — অ্যাপ লাগবে না</p>
          <p className="break-all font-mono text-xs text-slate-500">{url}</p>
        </div>
        <div className="no-print flex flex-wrap justify-center gap-2">
          {qr && (
            <a href={qr} download={`qr-${doctor.slug}.png`}>
              <Button variant="secondary">⬇ PNG ডাউনলোড</Button>
            </a>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            🖨 প্রিন্ট
          </Button>
        </div>
      </Card>

      <Card className="no-print space-y-4">
        <h2 className="text-xl font-bold">পাসওয়ার্ড বদলান</h2>
        <form onSubmit={changePassword} className="max-w-sm space-y-3">
          <Input label="নতুন পাসওয়ার্ড" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Input label="আবার লিখুন" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <Button type="submit" loading={busy}>
            সেভ করুন
          </Button>
        </form>
      </Card>
    </div>
  );
}
