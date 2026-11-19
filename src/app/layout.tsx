import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// বাংলা ফন্ট সাইটের সাথেই সার্ভ হয় (Google-এ আলাদা রিকোয়েস্ট নেই, লেআউট-শিফট নেই)
const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChamberTriage AI — চেম্বারের AI প্রি-কনসালটেশন সহকারী",
    template: "%s · ChamberTriage AI",
  },
  description:
    "রোগী ডাক্তার দেখানোর আগে চেম্বারের QR স্ক্যান করে বাংলায় AI সহকারীকে সমস্যা জানান; ডাক্তার পান এক পৃষ্ঠার গোছানো সামারি ও জরুরি লক্ষণের অ্যালার্ট।",
  applicationName: "ChamberTriage AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "ChamberAI", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "ChamberTriage AI",
    title: "ChamberTriage AI — চেম্বারের AI প্রি-কনসালটেশন সহকারী",
    description: "ডাক্তার দেখানোর আগেই রোগীর পুরো ইতিহাস — বাংলায়, AI দিয়ে।",
    locale: "bn_BD",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={hind.variable}>
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
