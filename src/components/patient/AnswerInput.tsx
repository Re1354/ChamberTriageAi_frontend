"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_SECONDS, type SttSource } from "@chamberai/shared";
import { Keyboard, Mic, Send, StopSquare } from "@/components/icons";
import { Button } from "@/components/ui";
import { cx, numBn } from "@/lib/format";

export interface AnswerSubmit {
  text?: string;
  audioB64?: string;
  mimeType?: string;
  sttSource: SttSource;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * উত্তর দেওয়ার তিন উপায়:
 *  A. ব্রাউজারের বাংলা স্পিচ-রিকগনিশন (ফ্রি) → লেখা বক্সে আসে, রোগী দেখে ঠিক করতে পারেন
 *  B. A না থাকলে অডিও রেকর্ড → সার্ভারে AI বুঝে নেয়
 *  C. টাইপ করা — সবসময়
 */
export function AnswerInput({
  audioAllowed,
  busy,
  onSubmit,
}: {
  audioAllowed: boolean;
  busy: boolean;
  onSubmit: (a: AnswerSubmit) => void;
}) {
  const [text, setText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechFailed, setSpeechFailed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<{ blob: Blob; seconds: number } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const baseTextRef = useRef("");

  // ব্রাউজার-ক্ষমতা শুধু ক্লায়েন্টে জানা যায় — হাইড্রেশন-মিসম্যাচ এড়াতে মাউন্টের পর দেখাই
  useEffect(() => setMounted(true), []);
  const SR = mounted ? getSpeechRecognition() : null;
  const canSpeech = !!SR && !speechFailed;
  const canRecord = mounted && audioAllowed && "MediaRecorder" in window;

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      mediaRef.current?.stop();
    };
  }, []);

  function startSpeech() {
    if (!SR) return;
    setMicError(null);
    const rec = new SR();
    rec.lang = "bn-BD";
    rec.interimResults = true;
    rec.continuous = true;
    baseTextRef.current = text ? `${text.trim()} ` : "";
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(baseTextRef.current + t);
      setUsedVoice(true);
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed" || e?.error === "language-not-supported") {
        setSpeechFailed(true);
        setMicError("মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি — অনুগ্রহ করে লিখে উত্তর দিন।");
      }
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setSpeechFailed(true);
    }
  }

  function stopSpeech() {
    recRef.current?.stop();
    setListening(false);
  }

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"].find((m) =>
        typeof MediaRecorder.isTypeSupported === "function" ? MediaRecorder.isTypeSupported(m) : false,
      );
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setRecorded({ blob, seconds: Math.round((Date.now() - startedAtRef.current) / 1000) });
        setRecording(false);
      };
      startedAtRef.current = Date.now();
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setTimeout(() => mr.state === "recording" && mr.stop(), MAX_AUDIO_SECONDS * 1000);
    } catch {
      setMicError("মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে লিখে উত্তর দিন।");
    }
  }

  async function submit() {
    if (listening) stopSpeech();
    if (recorded && !text.trim()) {
      const audioB64 = await blobToBase64(recorded.blob);
      onSubmit({ audioB64, mimeType: recorded.blob.type.split(";")[0] || "audio/webm", sttSource: "audio" });
    } else if (text.trim()) {
      onSubmit({ text: text.trim(), sttSource: usedVoice ? "web_speech" : "typed" });
    }
  }

  const active = listening || recording;
  const voiceMode = canSpeech ? "speech" : canRecord ? "record" : null;
  const voiceLabel = listening
    ? "শুনছি… শেষ হলে চাপুন"
    : recording
      ? "রেকর্ড হচ্ছে… শেষ হলে চাপুন"
      : recorded
        ? `${numBn(recorded.seconds)} সেকেন্ডের রেকর্ড প্রস্তুত — আবার বলতে চাপুন`
        : "চাপুন ও বাংলায় বলুন";

  // নোট: প্রতিটি নতুন প্রশ্নে প্যারেন্ট `key={question.id}` দিয়ে কম্পোনেন্ট নতুন করে বানায় → বক্স খালি হয়
  return (
    <div className="space-y-4">
      {voiceMode && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={
              voiceMode === "speech"
                ? listening
                  ? stopSpeech
                  : startSpeech
                : recording
                  ? () => mediaRef.current?.stop()
                  : startRecording
            }
            disabled={busy}
            aria-pressed={active}
            aria-label={voiceLabel}
            className={cx(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-[var(--shadow-raised)] transition-colors disabled:opacity-50",
              active ? "recording bg-red-600" : "bg-brand-700 hover:bg-brand-800 active:bg-brand-900",
            )}
          >
            {active ? <StopSquare size={26} /> : <Mic size={28} />}
          </button>
          <p className={cx("text-[15px] font-semibold leading-snug", active ? "text-red-700" : "text-slate-800")} aria-live="polite">
            {voiceLabel}
          </p>
        </div>
      )}
      {micError && <p className="text-sm text-amber-700">{micError}</p>}

      <div>
        <label htmlFor="answer" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <Keyboard size={16} />
          {usedVoice ? "আপনি যা বলেছেন — ঠিক না হলে এখানে বদলে দিন" : voiceMode ? "অথবা এখানে লিখুন" : "এখানে লিখে উত্তর দিন"}
        </label>
        <textarea
          id="answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="যেমন: ৪ দিন ধরে বুকে চাপ লাগছে, হাঁটলে বাড়ে…"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg leading-relaxed placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <Button size="xl" block onClick={submit} loading={busy} disabled={!text.trim() && !recorded}>
        পাঠান <Send size={20} />
      </Button>
    </div>
  );
}
