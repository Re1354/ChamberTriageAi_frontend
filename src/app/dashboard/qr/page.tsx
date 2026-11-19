"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/components/AuthProvider";
import { LogoMark } from "@/components/brand";
import { Building, Copy, Download, GraduationCap, MapPin, Printer, Share } from "@/components/icons";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { drName } from "@/lib/format";

/** চেম্বারের দরজায় লাগানোর QR পোস্টার (A4 প্রিন্ট-উপযোগী) */
export default function QrPage() {
  const { me } = useAuth();
  const doctor = me!.doctor!;
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const link = `${window.location.origin}/d/${doctor.slug}`;
    setUrl(link);
    setCanShare(typeof navigator.share === "function");
    void QRCode.toDataURL(link, { width: 1000, margin: 1, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } }).then(setQr);
  }, [doctor.slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          title="QR পোস্টার"
          subtitle="প্রিন্ট করে চেম্বারের দরজা বা অপেক্ষার জায়গায় লাগান — রোগীরা ফোনে স্ক্যান করে শুরু করবেন।"
        />
        {!doctor.isOpen && (
          <div className="mb-4">
            <Notice tone="warn">চেম্বার এখন বন্ধ — রোগীরা স্ক্যান করলে “চালু নেই” দেখবেন। রোগী-তালিকা পেজ থেকে চালু করুন।</Notice>
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* পোস্টার */}
        <Card className="mx-auto w-full max-w-[560px] overflow-hidden print:max-w-none print:border-0 print:shadow-none" padded={false}>
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-5 text-white print:bg-brand-700">
            <div className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <span className="text-lg font-bold">ChamberTriage AI</span>
            </div>
            <p className="mt-3 text-[22px] font-bold leading-snug sm:text-2xl">ডাক্তার দেখানোর আগে ফোনে আপনার সমস্যা জানিয়ে দিন</p>
          </div>
          <div className="space-y-5 px-6 py-6 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{drName(doctor.fullName)}</p>
              {doctor.specialty && <p className="mt-0.5 font-semibold text-brand-700">{doctor.specialty}</p>}
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {doctor.qualifications && (
                  <p className="flex items-center justify-center gap-1.5">
                    <GraduationCap size={15} className="text-slate-400" /> {doctor.qualifications}
                  </p>
                )}
                {doctor.chamberName && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Building size={15} className="text-slate-400" /> {doctor.chamberName}
                  </p>
                )}
                {doctor.chamberAddress && (
                  <p className="flex items-center justify-center gap-1.5">
                    <MapPin size={15} className="text-slate-400" /> {doctor.chamberAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="mx-auto w-full max-w-[280px] rounded-3xl border-4 border-brand-700 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qr ? <img src={qr} alt={`QR কোড: ${url}`} className="aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />}
            </div>
            <ol className="mx-auto grid max-w-md gap-2 text-left text-[15px] text-slate-700 sm:grid-cols-3 sm:text-center">
              {["ফোনের ক্যামেরায় QR স্ক্যান করুন", "AI সহকারীর প্রশ্নের উত্তর দিন", "রোগী-কোডটি ডাক্তারকে বলুন"].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2 sm:flex-col sm:gap-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                    {["১", "২", "৩"][i]}
                  </span>
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-slate-500">অ্যাপ লাগবে না · নাম বা ফোন নম্বর লাগবে না · বাংলায় বলুন বা লিখুন</p>
            <p className="break-all font-mono text-xs text-slate-400">{url}</p>
          </div>
        </Card>

        {/* অ্যাকশন */}
        <Card className="no-print space-y-3">
          <p className="font-semibold text-slate-900">পোস্টার ও লিংক</p>
          <Button block size="lg" onClick={() => window.print()}>
            <Printer size={18} /> পোস্টার প্রিন্ট করুন
          </Button>
          {qr && (
            <a
              href={qr}
              download={`chamberai-qr-${doctor.slug}.png`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              <Download size={18} /> শুধু QR ছবি (PNG)
            </a>
          )}
          <Button block size="lg" variant="secondary" onClick={() => void copy()}>
            <Copy size={18} /> {copied ? "কপি হয়েছে ✓" : "লিংক কপি করুন"}
          </Button>
          {canShare && (
            <Button
              block
              size="lg"
              variant="secondary"
              onClick={() => void navigator.share({ title: drName(doctor.fullName), text: "ডাক্তার দেখানোর আগে এখানে আপনার সমস্যা জানান", url }).catch(() => undefined)}
            >
              <Share size={18} /> শেয়ার করুন
            </Button>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            টিপ: A4 কাগজে প্রিন্ট করে লেমিনেট করুন। QR-এর চারপাশে ফাঁকা জায়গা রাখুন, যাতে দূর থেকেও স্ক্যান হয়।
          </p>
        </Card>
      </div>
    </div>
  );
}
