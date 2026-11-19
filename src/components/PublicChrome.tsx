import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./brand";
import { Phone } from "./icons";
import { buttonClass } from "./styles";

/** পাবলিক পেজের (হোম, গোপনীয়তা, শর্ত, ডকস) উপরের বার */
export function PublicHeader({ links = true }: { links?: boolean }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 pt-safe backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        {links && (
          <nav aria-label="প্রধান" className="ml-6 hidden items-center gap-1 text-[15px] font-medium text-slate-600 md:flex">
            <a href="/#how" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              কীভাবে কাজ করে
            </a>
            <a href="/#features" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              সুবিধা
            </a>
            <a href="/#privacy" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              নিরাপত্তা
            </a>
          </nav>
        )}
        <span className="flex-1" />
        <Link href="/login" className={buttonClass("primary", "md")}>
          ডাক্তার লগইন
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="no-print border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            রোগী ডাক্তার দেখানোর আগে বাংলায় AI সহকারীকে নিজের সমস্যা জানান; ডাক্তার পান এক পৃষ্ঠার গোছানো সামারি।
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">লিংক</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link className="hover:text-brand-700" href="/login">
                ডাক্তার / অ্যাডমিন লগইন
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-700" href="/privacy">
                গোপনীয়তা নীতি
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-700" href="/terms">
                ব্যবহারের শর্তাবলি
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-700" href="/docs">
                প্রযুক্তি ও লাইভ মেট্রিক্স
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">জরুরি অবস্থায়</p>
          <a
            href="tel:999"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200"
          >
            <Phone size={16} /> জাতীয় জরুরি সেবা ৯৯৯
          </a>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            এই AI সহকারী ডাক্তার নয়; রোগ নির্ণয় বা চিকিৎসা-পরামর্শ দেয় না। সব সিদ্ধান্ত চিকিৎসকের।
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ChamberTriage AI · বাংলাদেশে তৈরি
      </div>
    </footer>
  );
}

/** সাধারণ লেখার পেজ (গোপনীয়তা/শর্ত) */
export function ProsePage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader links={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">সর্বশেষ হালনাগাদ: {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
