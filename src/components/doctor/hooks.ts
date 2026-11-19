"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Supabase Realtime: শুধু নিজের doctor_events (RLS) — নতুন রোগী/সামারি/অ্যালার্ট এলে তালিকা রিফ্রেশ।
 * Realtime বিচ্ছিন্ন হলেও ড্যাশবোর্ড ৩০ সেকেন্ড পরপর নিজে থেকে রিফ্রেশ হয় (polling fallback)।
 */
export function useDoctorEvents(doctorId: string | undefined, onEvent: (kind: string) => void) {
  const cb = useRef(onEvent);
  useEffect(() => {
    cb.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!doctorId) return;
    const sb = supabase();
    const channel = sb
      .channel(`doctor-events-${doctorId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "doctor_events", filter: `doctor_id=eq.${doctorId}` },
        (payload: { new: { kind?: string } }) => cb.current(payload.new?.kind ?? "visit_updated"),
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [doctorId]);
}

let audioCtx: AudioContext | null = null;

/** অ্যালার্ট-শব্দ (WebAudio, কোনো ফাইল লাগে না)। ব্রাউজারের নিয়মে প্রথমে একবার কোথাও ক্লিক করতে হয়। */
export function unlockAlertSound() {
  if (typeof window === "undefined") return;
  audioCtx ??= new AudioContext();
  void audioCtx.resume();
}

export function playAlertSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = i % 2 ? 660 : 880;
    gain.gain.setValueAtTime(0.25, t0 + i * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.35 + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0 + i * 0.35);
    osc.stop(t0 + i * 0.35 + 0.3);
  }
}
