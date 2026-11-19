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
  /** সার্ভারে পৌঁছানোর আগেই ব্যর্থ হলে (নেটওয়ার্ক/502/503/504) কতবার আবার চেষ্টা করবে */
  retries?: number;
}

const TRANSIENT_STATUS = new Set([502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Render-এর ফ্রি সার্ভার ঘুম থেকে উঠতে/নতুন ডিপ্লয়ে বদলাতে কয়েক সেকেন্ড 502/নেটওয়ার্ক-এরর দেয়।
 * তখন রোগীকে এরর না দেখিয়ে নিজে থেকেই আবার চেষ্টা করা হয়।
 */
export async function api<T>(path: string, o: ApiOptions = {}): Promise<T> {
  const retries = o.retries ?? 3;
  for (let attempt = 0; ; attempt++) {
    try {
      return await apiOnce<T>(path, o);
    } catch (err) {
      const transient =
        err instanceof ApiError &&
        (err.code === "network" ||
          TRANSIENT_STATUS.has(err.status) ||
          // POST-এ টাইমআউট মানে সার্ভার হয়তো কাজটা করে ফেলেছে — শুধু GET-এ আবার চেষ্টা
          (err.code === "timeout" && o.body === undefined));
      if (!transient || attempt >= retries) throw err;
      await sleep(Math.min(2000 * 2 ** attempt, 8000));
    }
  }
}

async function apiOnce<T>(path: string, o: ApiOptions): Promise<T> {
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
        typeof data?.message === "string"
          ? data.message
          : TRANSIENT_STATUS.has(res.status)
            ? "সার্ভার চালু হচ্ছে — এক মিনিট পর আবার চেষ্টা করুন।"
            : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        data,
      );
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError(0, "timeout", "সার্ভার সাড়া দিতে দেরি করছে। আবার চেষ্টা করুন।");
    }
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new ApiError(
      0,
      "network",
      offline ? "ইন্টারনেট সংযোগ নেই — সংযোগ দেখে আবার চেষ্টা করুন।" : "সার্ভারে সংযোগ হচ্ছে না — একটু পরে আবার চেষ্টা করুন।",
    );
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

/**
 * ফ্রি Render সার্ভার ঘুমিয়ে থাকলে জাগানো (প্রথমবার ~১ মিনিট লাগতে পারে)।
 * একই পেজে একাধিক জায়গা থেকে ডাকলেও একটাই চেষ্টা চলে।
 */
let wakePromise: Promise<boolean> | null = null;
export function wakeApi(maxMs = 150_000): Promise<boolean> {
  wakePromise ??= (async () => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      try {
        await apiOnce("/health", { timeoutMs: 30_000 });
        return true;
      } catch {
        await sleep(3000);
      }
    }
    return false;
  })().then((ok) => {
    if (!ok) wakePromise = null; // ব্যর্থ হলে পরের বার নতুন করে চেষ্টা
    return ok;
  });
  return wakePromise;
}
