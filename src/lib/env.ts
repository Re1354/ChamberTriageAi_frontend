export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100").replace(/\/$/, "");
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "visit-media";
