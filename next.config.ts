import type { NextConfig } from "next";

// Vercel-এ বিল্ডের সময় দরকারি env না থাকলে পরিষ্কার মেসেজ দিয়ে থামানো
// (নইলে সাইট ডিপ্লয় হয়ে যায় কিন্তু ব্রাউজারে localhost-এ API খোঁজে — নীরবে ভেঙে থাকে)
if (process.env.VERCEL) {
  const required = ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    throw new Error(`Vercel → Settings → Environment Variables-এ এগুলো দিন: ${missing.join(", ")}`);
  }
  const api = process.env.NEXT_PUBLIC_API_BASE_URL!;
  if (/localhost|127\.0\.0\.1/.test(api) && !process.env.API_PROXY_TARGET) {
    throw new Error(`NEXT_PUBLIC_API_BASE_URL (${api}) localhost হতে পারবে না — Render-এর URL দিন।`);
  }
}

/**
 * API প্রক্সি (ডিফল্ট চালু): ব্রাউজার শুধু নিজের ডোমেইনের /backend/* -এ কথা বলে, Vercel সেটা Render-এ পাঠায়।
 * কেন: অনেক মোবাইল নেটওয়ার্ক/ফোন onrender.com-এ সরাসরি যেতে পারে না (DNS/ISP/IPv6), CORS-ও লাগে না,
 * আর Vercel-এর যেকোনো URL (preview সহ) থেকে চলে। Vercel রোগীর আসল IP x-forwarded-for-এ পাঠায়।
 * বন্ধ করতে (সরাসরি API-তে যেতে): Vercel-এ API_DIRECT=1
 */
const rawApi = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");
const proxyTarget =
  process.env.API_DIRECT === "1"
    ? ""
    : (process.env.API_PROXY_TARGET?.trim() || (/^https?:\/\//.test(rawApi) ? rawApi : "")).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_API_VIA_PROXY: proxyTarget ? "1" : "0" },
  // এই রিপোই প্রজেক্টের রুট (shared/ ভেতরেই আছে, tsconfig paths দিয়ে ইমপোর্ট)
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  // লোকাল ডেভে: API_PROXY_TARGET=http://127.0.0.1:4100 ; প্রোডাকশনে: NEXT_PUBLIC_API_BASE_URL (Render URL)
  async rewrites() {
    return proxyTarget ? [{ source: "/backend/:path*", destination: `${proxyTarget}/:path*` }] : [];
  },
  async headers() {
    return [
      // API-র উত্তর কখনো CDN-এ ক্যাশ হবে না
      { source: "/backend/:path*", headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
