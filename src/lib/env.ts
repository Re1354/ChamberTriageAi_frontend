const DIRECT_API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100").replace(/\/$/, "");
/**
 * next.config.ts প্রক্সি চালু করলে ব্রাউজার শুধু নিজের ডোমেইনের /backend-এ কথা বলে —
 * ফোনের নেটওয়ার্ক onrender.com-এ সরাসরি যেতে না পারলেও চলে।
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_VIA_PROXY === "1" ? "/backend" : DIRECT_API;
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "visit-media";
