# ChamberTriage AI — Frontend (Web)

Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase Auth/Realtime।
ব্যাকএন্ড: https://github.com/Re1354/ChamberTriageAi_backend

পেজ: `/d/<slug>` রোগীর QR পেজ · `/login` · `/dashboard` ডাক্তার · `/admin` অ্যাডমিন · `/docs` আর্কিটেকচার।

## লোকালে চালানো
```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local → মান বসান
npm run dev                  # http://localhost:3000  (ব্যাকএন্ড http://localhost:4100-এ চালু থাকতে হবে)
```

## Vercel-এ ডেপ্লয়
Framework: Next.js (Root Directory খালি — রিপোর রুটই প্রজেক্ট)। Environment Variables:

| Key | মান |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Render API URL, যেমন `https://chamberai-api.onrender.com` (শেষে `/` ছাড়া) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (`sb_publishable_...`) |
| `NEXT_PUBLIC_STORAGE_BUCKET` | `visit-media` |

দরকারি মান না থাকলে বিল্ড ইচ্ছা করে থেমে যায় ও কোনটা বাদ তা বলে। ডেপ্লয়ের পর Vercel URL-টা ব্যাকএন্ডের `ALLOWED_ORIGINS`-এ দিন।

> `shared/` ফোল্ডারটা ব্যাকএন্ড ও ফ্রন্টএন্ড — দুই রিপোতেই একই (API-র টাইপ/স্কিমা)। বদলালে দুই জায়গাতেই একই বদল দিন।
