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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // এই রিপোই প্রজেক্টের রুট (shared/ ভেতরেই আছে, tsconfig paths দিয়ে ইমপোর্ট)
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  // ঐচ্ছিক: API_PROXY_TARGET দিলে /backend/* রিকোয়েস্ট সেই API-তে ফরওয়ার্ড হয় (same-origin, CORS লাগে না)।
  // লোকাল ডেভ/ফোনে LAN টেস্টে কাজে লাগে: NEXT_PUBLIC_API_BASE_URL=/backend, API_PROXY_TARGET=http://127.0.0.1:4100
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    return target ? [{ source: "/backend/:path*", destination: `${target}/:path*` }] : [];
  },
  async headers() {
    return [
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
