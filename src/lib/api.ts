"use client";

import { API_BASE } from "./env";
import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly data: Record<string, unknown> | null = null,
  ) {
    super(message);
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  secret?: string | null;
  timeoutMs?: number;
}

export async function api<T>(path: string, o: ApiOptions = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 45_000);
  try {
    const headers: Record<string, string> = {};
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    if (o.token) headers.Authorization = `Bearer ${o.token}`;
    if (o.secret) headers["X-Session-Secret"] = o.secret;
    const res = await fetch(`${API_BASE}${path}`, {
      method: o.method ?? (o.body !== undefined ? "POST" : "GET"),
      headers,
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      throw new ApiError(
        res.status,
        typeof data?.code === "string" ? data.code : "error",
        typeof data?.message === "string" ? data.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        data,
      );
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError(0, "timeout", "সার্ভার সাড়া দিতে দেরি করছে। আবার চেষ্টা করুন।");
    }
    throw new ApiError(0, "network", "ইন্টারনেট সংযোগ দেখুন, তারপর আবার চেষ্টা করুন।");
  } finally {
    clearTimeout(timer);
  }
}

/** লগইন-করা ডাক্তার/অ্যাডমিনের রিকোয়েস্ট (Supabase access token সহ) */
export async function authedApi<T>(path: string, o: Omit<ApiOptions, "token"> = {}): Promise<T> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "unauthorized", "অনুগ্রহ করে আবার লগইন করুন।");
  return api<T>(path, { ...o, token });
}

/** ফ্রি Render সার্ভার ঘুমিয়ে থাকলে জাগানো (প্রথমবার ~১ মিনিট লাগতে পারে) */
export async function wakeApi(maxMs = 100_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await api("/health", { timeoutMs: 25_000 });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return false;
}
