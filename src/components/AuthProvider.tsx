"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { MeResponse } from "@chamberai/shared";
import { authedApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { FullPageSpinner } from "./ui";

interface AuthCtx {
  me: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase().auth.getSession();
      if (!data.session) {
        setMe(null);
        return;
      }
      setMe(await authedApi<MeResponse>("/api/me", { timeoutMs: 100_000 }));
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const { data } = supabase().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setMe(null);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    setMe(null);
    window.location.href = "/login";
  }, []);

  return <Ctx.Provider value={{ me, loading, refresh, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * পেজ-সুরক্ষা: লগইন না থাকলে /login; ডাক্তার-পেজে শুধু ডাক্তার; অ্যাডমিন-পেজে শুধু অ্যাডমিন।
 * প্রত্যেক ডাক্তার নিজের অ্যাকাউন্টে লগইন করেন — ড্যাশবোর্ডের সব ডেটা টোকেনের মালিকের, অন্য কারো নয়।
 */
export function RequireAuth({ role, children }: { role: "doctor" | "admin"; children: ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    !!me && (role === "doctor" ? !!me.doctor && me.doctor.isActive : me.isAdmin);
  const mustChange = role === "doctor" && !!me?.doctor?.mustChangePassword && pathname !== "/dashboard/settings";

  useEffect(() => {
    if (loading) return;
    if (!me) router.replace("/login");
    else if (role === "doctor" && !me.doctor) router.replace(me.isAdmin ? "/admin" : "/login");
    else if (role === "admin" && !me.isAdmin) router.replace("/dashboard");
    else if (mustChange) router.replace("/dashboard/settings");
  }, [loading, me, role, router, mustChange]);

  if (loading) return <FullPageSpinner label="লোড হচ্ছে… (সার্ভার ঘুমিয়ে থাকলে প্রথমবার এক মিনিট লাগতে পারে)" />;
  if (!allowed || mustChange) return <FullPageSpinner />;
  return <>{children}</>;
}
