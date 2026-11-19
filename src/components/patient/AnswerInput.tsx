"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_SECONDS, type SttSource } from "@chamberai/shared";
import { Copy, ExternalLink, Keyboard, Mic, RefreshCw, Send, StopSquare } from "@/components/icons";
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
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** ফেসবুক/মেসেঞ্জার/ইনস্টাগ্রাম/হোয়াটসঅ্যাপ ইত্যাদির ভেতরের ব্রাউজার — এগুলোতে মাইক প্রায়ই চলে না */
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|Snapchat|imo|; wv\)/i.test(ua);
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** ব্রাউজারের স্পিচ-এরর → রোগীর জন্য সহজ বাংলা নির্দেশনা */
const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed":
    "মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজারের ঠিকানা-বারের বাঁ পাশের 🔒 চিহ্নে চাপুন → মাইক্রোফোন (Microphone) → Allow দিন, তারপর আবার মাইকে চাপুন।",
  "service-not-allowed":
    "এই ব্রাউজারে ভয়েস-টাইপিং বন্ধ আছে। iPhone হলে Settings → Siri চালু করুন, অথবা লিংকটি Google Chrome-এ খুলুন। চাইলে নিচে লিখেও দিতে পারেন।",
  "audio-capture": "মাইক্রোফোন পাওয়া যায়নি। অন্য কোনো অ্যাপ (কল, রেকর্ডার) মাইক ব্যবহার করছে কিনা দেখুন, তারপর আবার চাপুন।",
  network: "ভয়েস বুঝতে ইন্টারনেট লাগে — সংযোগ দেখে আবার মাইকে চাপুন, অথবা নিচে লিখে দিন।",
  "no-speech": "কিছু শোনা যায়নি। মাইকে চেপে ফোনের কাছে মুখ এনে একটু জোরে বলুন।",
  "language-not-supported": "এই ব্রাউজারে বাংলা ভয়েস নেই। লিংকটি Google Chrome-এ খুলুন, অথবা নিচে লিখে দিন।",
};

/**
 * উত্তর দেওয়ার তিন উপায়:
 *  A. ব্রাউজারের বাংলা স্পিচ-রিকগনিশন (ফ্রি) → লেখা বক্সে আসে, রোগী দেখে ঠিক করতে পারেন
 *  B. A না থাকলে / কাজ না করলে অডিও রেকর্ড → সার্ভারে AI বুঝে নেয় (AI চালু থাকলে)
 *  C. টাইপ করা — সবসময়
 * মাইক বাটন কখনো নিঃশব্দে হারায় না — সমস্যা হলে কারণ ও সমাধান দেখায়, আবার চেষ্টা করা যায়।
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
  /** স্পিচ-রিকগনিশন এই ডিভাইসে একেবারেই চলবে না (রেকর্ড-মোডে যাওয়া উচিত) */
  const [speechBroken, setSpeechBroken] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<{ blob: Blob; seconds: number } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const baseTextRef = useRef("");
  const heardRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  // ব্রাউজার-ক্ষমতা শুধু ক্লায়েন্টে জানা যায় — হাইড্রেশন-মিসম্যাচ এড়াতে মাউন্টের পর দেখাই
  useEffect(() => setMounted(true), []);
  const SR = mounted ? getSpeechRecognition() : null;
  const canRecord =
    mounted && audioAllowed && typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
  const canSpeech = !!SR && !(speechBroken && canRecord);
  const voiceMode: "speech" | "record" | null = canSpeech ? "speech" : canRecord ? "record" : null;
  const inApp = mounted && isInAppBrowser();

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    };
  }, []);

  function startSpeech() {
    if (!SR) return;
    setMicError(null);
    heardRef.current = false;
    errorRef.current = null;
    let rec: SpeechRecognitionLike;
    try {
      rec = new SR();
    } catch {
      setSpeechBroken(true);
      setMicError(SPEECH_ERRORS["language-not-supported"]);
      return;
    }
    rec.lang = "bn-BD";
    rec.interimResults = true;
    // Android Chrome-এ continuous মোডে একই কথা বারবার আসে — তাই সেখানে এক-একবারে শোনা
    rec.continuous = !isAndroid();
    rec.maxAlternatives = 1;
    baseTextRef.current = text ? `${text.trim()} ` : "";
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (t.trim()) {
        heardRef.current = true;
        setText(baseTextRef.current + t);
        setUsedVoice(true);
      }
    };
    rec.onerror = (e: any) => {
      const code = String(e?.error ?? "");
      errorRef.current = code;
      if (code === "aborted") return;
      if (code === "service-not-allowed" || code === "language-not-supported") setSpeechBroken(true);
      setMicError(SPEECH_ERRORS[code] ?? "ভয়েস চালু করা যায়নি। আবার মাইকে চাপুন, অথবা নিচে লিখে দিন।");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      if (!heardRef.current && !errorRef.current) setMicError(SPEECH_ERRORS["no-speech"]);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // আগের সেশন এখনো বন্ধ হয়নি — একটু পরে আবার চাপলেই চলবে
      setListening(false);
      setMicError("এক সেকেন্ড পর আবার মাইকে চাপুন।");
    }
  }

  function stopSpeech() {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
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
        setRecorded({ blob, seconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) });
        setRecording(false);
      };
      startedAtRef.current = Date.now();
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setTimeout(() => mr.state === "recording" && mr.stop(), MAX_AUDIO_SECONDS * 1000);
    } catch (err) {
      const name = (err as Error)?.name;
      setMicError(
        name === "NotAllowedError" || name === "SecurityError"
          ? SPEECH_ERRORS["not-allowed"]
          : name === "NotFoundError"
            ? SPEECH_ERRORS["audio-capture"]
            : "মাইক্রোফোন চালু করা যায়নি। আবার চাপুন, অথবা নিচে লিখে দিন।",
      );
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* কপি না হলেও সমস্যা নেই */
    }
  }

  function openInChrome() {
    // Android: intent দিয়ে সরাসরি Chrome-এ খোলা; না পারলে সাধারণ লিংক
    const url = window.location.href;
    if (isAndroid()) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  const active = listening || recording;
  const voiceLabel = listening
    ? "শুনছি… বলা শেষ হলে আবার চাপুন"
    : recording
      ? "রেকর্ড হচ্ছে… শেষ হলে চাপুন"
      : recorded
        ? `${numBn(recorded.seconds)} সেকেন্ডের রেকর্ড প্রস্তুত — আবার বলতে চাপুন`
        : micError
          ? "আবার চেষ্টা করতে মাইকে চাপুন"
          : "মাইকে চাপুন ও বাংলায় বলুন";

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
              "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-[var(--shadow-raised)] transition-colors disabled:opacity-50",
              active ? "recording bg-red-600" : "bg-brand-700 hover:bg-brand-800 active:bg-brand-900",
            )}
          >
            {active ? <StopSquare size={26} /> : micError ? <RefreshCw size={24} /> : <Mic size={28} />}
          </button>
          <p className={cx("text-[15px] font-semibold leading-snug", active ? "text-red-700" : "text-slate-800")} aria-live="polite">
            {voiceLabel}
          </p>
        </div>
      )}

      {micError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900" role="status">
          {micError}
        </p>
      )}

      {/* ভয়েস একেবারেই সম্ভব না — কেন, আর কী করলে হবে */}
      {mounted && (!voiceMode || (inApp && !!micError)) && (
        <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900">
          <p>
            {inApp
              ? "ফেসবুক/মেসেঞ্জার/হোয়াটসঅ্যাপের ভেতরের ব্রাউজারে মাইক চলে না। বলে উত্তর দিতে লিংকটি Google Chrome-এ খুলুন (উপরের ⋮ মেনু → “Open in Chrome / ব্রাউজারে খুলুন”)।"
              : "এই ব্রাউজারে বাংলা ভয়েস নেই। বলে উত্তর দিতে লিংকটি Google Chrome-এ খুলুন — অথবা নিচে লিখে দিন।"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={openInChrome}>
              <ExternalLink size={16} /> Chrome-এ খুলুন
            </Button>
            <Button size="sm" variant="ghost" onClick={copyLink}>
              <Copy size={16} /> {copied ? "লিংক কপি হয়েছে" : "লিংক কপি করুন"}
            </Button>
          </div>
        </div>
      )}

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
