"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

/** ব্রাউজার-ক্লায়েন্ট (anon key) — শুধু ইভেন্ট/এফেক্টের ভেতরে ডাকুন, রেন্ডারের সময় নয় */
export function supabase(): SupabaseClient {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY সেট করা নেই");
    }
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "chamberai-auth" },
    });
  }
  return client;
}
