import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 pb-16">
      <header className="space-y-3 pt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">ChamberTriage AI · PreDoc BD</p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900">
          ডাক্তার দেখানোর আগেই রোগীর পুরো ইতিহাস — বাংলায়, AI দিয়ে
        </h1>
        <p className="text-lg text-slate-700">
          চেম্বারের বাইরে QR স্ক্যান করে রোগী AI সহকারীর প্রশ্নের উত্তর দেন। রোগী ভেতরে এলে ডাক্তার শুধু রোগী-কোড সার্চ করেন —
          ১-পৃষ্ঠার সামারি সাথে সাথে সামনে।
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["📱", "QR স্ক্যান", "অ্যাপ ছাড়াই, প্রতিটি ডাক্তারের আলাদা লিংক"],
          ["🤖", "বাংলায় AI প্রশ্ন", "ভয়েস বা লিখে; ওষুধের পাতা ও রিপোর্টের ছবি"],
          ["🩺", "কোড দিয়ে সার্চ", "ডাক্তারের স্ক্রিনে ১-পৃষ্ঠার সামারি ও red flag"],
        ].map(([icon, title, body]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-3xl">{icon}</p>
            <p className="mt-2 font-bold">{title}</p>
            <p className="text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/login" className="rounded-xl bg-teal-700 px-6 py-3 text-lg font-semibold text-white hover:bg-teal-800">
          ডাক্তার লগইন
        </Link>
        <Link href="/docs" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-800">
          কীভাবে কাজ করে (/docs)
        </Link>
      </div>

      <p className="text-sm text-slate-500">
        রোগীরা: চেম্বারের দরজায় থাকা QR কোড স্ক্যান করুন। এই AI সহকারী ডাক্তার নয় এবং কোনো চিকিৎসা-পরামর্শ দেয় না।
      </p>
    </main>
  );
}
