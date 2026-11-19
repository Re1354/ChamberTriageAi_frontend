import Link from "next/link";
import { LogoMark } from "@/components/brand";
import { ArrowLeft, QrCode } from "@/components/icons";
import { buttonClass } from "@/components/styles";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={56} />
      <p className="mt-8 font-mono text-sm font-bold tracking-widest text-brand-700">৪০৪</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-3 max-w-sm leading-relaxed text-slate-600">
        লিংকটি ভুল হতে পারে। রোগী হলে চেম্বারের দরজায় থাকা QR কোডটি আবার স্ক্যান করুন।
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass("primary", "lg")}>
          <ArrowLeft size={18} /> হোমে ফিরুন
        </Link>
        <Link href="/login" className={buttonClass("secondary", "lg")}>
          <QrCode size={18} /> ডাক্তার লগইন
        </Link>
      </div>
    </main>
  );
}
