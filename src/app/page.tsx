import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle,
  ClipboardList,
  FileText,
  Lock,
  Mic,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
} from "@/components/icons";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { buttonClass } from "@/components/styles";

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-lg leading-relaxed text-slate-600">{body}</p>}
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">{icon}</span>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

/** হিরো-সেকশনের ফোন-মকআপ (শুধু চিত্র, আসল ডেটা নয়) */
function PhoneMockup() {
  return (
    <div aria-hidden className="relative mx-auto w-[300px] sm:w-[320px]">
      <div className="absolute -inset-10 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="relative rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="overflow-hidden rounded-[2rem] bg-slate-50">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 pb-3 pt-8">
            <LogoMark size={24} />
            <span className="flex-1 text-sm font-bold">ChamberTriage AI</span>
            <span className="rounded-full bg-brand-700 px-2 py-0.5 font-mono text-[11px] font-bold text-white">482 731</span>
          </div>
          <div className="space-y-2.5 p-3.5">
            <div className="grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i < 2 ? "h-1 rounded-full bg-brand-600" : i === 2 ? "h-1 rounded-full bg-brand-400" : "h-1 rounded-full bg-slate-200"} />
              ))}
            </div>
            <div className="flex items-end gap-1.5">
              <LogoMark size={20} />
              <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[13px] leading-snug shadow-sm">
                আপনার মূল সমস্যাটা কী, আর কতদিন ধরে হচ্ছে?
              </p>
            </div>
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-3 py-2 text-[13px] leading-snug text-white">
                ৪ দিন ধরে বুকে চাপ লাগছে, হাঁটলে বাড়ে
              </p>
            </div>
            <div className="flex items-end gap-1.5">
              <LogoMark size={20} />
              <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[13px] font-semibold leading-snug shadow-sm">
                ব্যথাটা কি বাম হাত বা চোয়ালের দিকে যায়? সাথে ঘাম হয়?
              </p>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white">
                <Mic size={20} />
              </span>
              <span className="text-[13px] font-semibold text-slate-700">চাপুন ও বাংলায় বলুন</span>
            </div>
          </div>
        </div>
      </div>
      {/* ডাক্তারের দিকের ছোট কার্ড */}
      <div className="absolute -right-6 bottom-10 hidden w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-raised)] sm:block lg:-right-16">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle size={16} />
          </span>
          <span className="text-xs font-bold text-red-700">জরুরি লক্ষণ</span>
        </div>
        <p className="mt-1.5 font-mono text-sm font-bold">482 731</p>
        <p className="text-xs text-slate-500">পরিশ্রমে বুকে চাপ — আগে দেখার বিবেচনা করুন</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main>
        {/* ---------- হিরো ---------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-inset ring-brand-200">
                <Stethoscope size={16} /> বাংলাদেশের চেম্বারের জন্য
              </span>
              <h1 className="mt-5 text-[34px] font-bold leading-[1.2] tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.15]">
                ডাক্তার দেখানোর আগেই রোগীর পুরো ইতিহাস — <span className="text-brand-700">বাংলায়, AI দিয়ে</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                চেম্বারের বাইরে QR স্ক্যান করে রোগী নিজের ভাষায় AI সহকারীকে সমস্যা জানান। রোগী ভেতরে এলে ডাক্তার শুধু ৬ অঙ্কের
                কোড সার্চ করেন — এক পৃষ্ঠার গোছানো সামারি সাথে সাথে সামনে।
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className={buttonClass("primary", "xl")}>
                  ডাক্তার লগইন <ArrowRight />
                </Link>
                <Link href="/d/dr-rahman" className={buttonClass("secondary", "xl")}>
                  <Smartphone /> রোগীর দিক থেকে দেখুন
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                {["অ্যাপ ইনস্টল লাগবে না", "নাম/ফোন নম্বর লাগে না", "ভয়েস বা লিখে উত্তর"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-brand-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <PhoneMockup />
          </div>
        </section>

        {/* ---------- কীভাবে কাজ করে ---------- */}
        <section id="how" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="কীভাবে কাজ করে" title="তিন ধাপে, অপেক্ষার সময়েই" body="রোগী লাইনে বসে থাকতেই তথ্য তৈরি — ডাক্তারের সময় যায় আসল চিকিৎসায়।" />
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: <QrCode size={26} />, title: "QR স্ক্যান", body: "প্রতিটি ডাক্তারের আলাদা QR পোস্টার চেম্বারের দরজায়। ফোনের ক্যামেরায় স্ক্যান করলেই শুরু।" },
                {
                  icon: <Mic size={26} />,
                  title: "বাংলায় প্রশ্নোত্তর",
                  body: "AI সহকারী ডাক্তারের মতো ধাপে ধাপে প্রশ্ন করে; রোগী বলে বা লিখে উত্তর দেন, ওষুধ ও রিপোর্টের ছবি দেন।",
                },
                {
                  icon: <Search size={26} />,
                  title: "কোড দিয়ে সামারি",
                  body: "রোগী ভেতরে এসে কোড বলেন; ডাক্তার সার্চ করলেই অভিযোগ, ইতিহাস, ওষুধ ও জরুরি লক্ষণ এক পাতায়।",
                },
              ].map((s, i) => (
                <li key={s.title} className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
                  <span className="absolute right-6 top-6 text-5xl font-bold text-slate-100">{["১", "২", "৩"][i]}</span>
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white">{s.icon}</span>
                  <h3 className="relative mt-5 text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="relative mt-2 leading-relaxed text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- সুবিধা ---------- */}
        <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="সুবিধা" title="চেম্বারের বাস্তবতা মাথায় রেখে তৈরি" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard icon={<Mic size={24} />} title="বাংলা ভয়েস" body="ফোনে বলুন, লেখা হয়ে যাবে — আঞ্চলিক টানেও। বয়স্ক রোগীর জন্য বড় বোতাম ও সহজ ভাষা।" />
              <FeatureCard
                icon={<AlertTriangle size={24} />}
                title="জরুরি লক্ষণে অ্যালার্ট"
                body="বুকে ব্যথা, স্ট্রোকের লক্ষণ বা ডেঙ্গুর সতর্কসংকেত — নির্ধারিত নিয়মে ধরা পড়ে, ডাক্তারের স্ক্রিনে সাথে সাথে শব্দসহ অ্যালার্ট।"
              />
              <FeatureCard
                icon={<ClipboardList size={24} />}
                title="এক পৃষ্ঠার সামারি"
                body="Chief complaint, HPI, আগের রোগ, ওষুধ, ল্যাব — প্রতিটি তথ্যের পাশে রোগীর আসল কথার উৎস-লিংক।"
              />
              <FeatureCard icon={<Camera size={24} />} title="ওষুধ ও রিপোর্টের ছবি" body="ওষুধের পাতা ও প্রিন্ট করা রিপোর্টের ছবি; ঝাপসা হলে সাথে সাথে জানায়। ব্র্যান্ড থেকে জেনেরিক নাম মেলায়।" />
              <FeatureCard icon={<Users size={24} />} title="প্রত্যেক ডাক্তারের আলাদা অ্যাকাউন্ট" body="নিজের রোগী-তালিকা শুধু নিজের। দরকারে অন্য ডাক্তারের রোগী কোড দিয়ে দেখা যায় — অডিট-লগসহ।" />
              <FeatureCard icon={<FileText size={24} />} title="প্রিন্ট ও QR পোস্টার" body="সামারি প্রিন্ট করে ফাইলে রাখুন; চেম্বারের জন্য তৈরি QR পোস্টার এক ক্লিকে প্রিন্ট।" />
            </div>
          </div>
        </section>

        {/* ---------- নিরাপত্তা ---------- */}
        <section id="privacy" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-700">নিরাপত্তা ও গোপনীয়তা</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">রোগীর তথ্য, রোগীর সম্মতিতে</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">
                শুরুতেই স্পষ্ট সম্মতি নেওয়া হয়। AI সহকারী রোগ নির্ণয় করে না, ওষুধ বলে না — শুধু তথ্য গুছিয়ে ডাক্তারকে দেয়।
              </p>
              <Link href="/privacy" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
                গোপনীয়তা নীতি পড়ুন <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                [<Lock key="a" size={20} />, "নাম বা ফোন নম্বর নেওয়া হয় না; বললেও স্বয়ংক্রিয়ভাবে মাস্ক হয়"],
                [<ShieldCheck key="b" size={20} />, "ডাটাবেসে Row-Level Security; ব্রাউজার থেকে সরাসরি কোনো রোগীর তথ্য পড়া যায় না"],
                [<Camera key="c" size={20} />, "ছবি ১৪ দিন পর স্বয়ংক্রিয়ভাবে মুছে যায়"],
                [<Users key="d" size={20} />, "অন্য ডাক্তারের রোগী দেখার প্রতিটি ঘটনা অডিট-লগে রেকর্ড"],
              ].map(([icon, text], i) => (
                <li key={i} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
                  <span className="text-[15px] leading-relaxed text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">আপনার চেম্বারে চালু করতে চান?</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-brand-100">
              অ্যাডমিন আপনার অ্যাকাউন্ট তৈরি করে দিলে লগইন করে QR পোস্টার প্রিন্ট করুন — সেদিন থেকেই শুরু।
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/login" className={buttonClass("white", "xl")}>
                ডাক্তার লগইন <ArrowRight />
              </Link>
              <Link
                href="/d/dr-karim"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl px-6 text-lg font-semibold text-white ring-1 ring-inset ring-white/40 transition-colors hover:bg-white/10"
              >
                ডেমো রোগী-পেজ
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
