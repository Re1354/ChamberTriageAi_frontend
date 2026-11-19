"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_SECONDS, type SttSource } from "@chamberai/shared";
import { Button } from "@/components/ui";
import { cx } from "@/lib/format";

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
 *  A. ব্রাউজারের বাংলা স্পিচ-রিকগনিশন (ফ্রি) → লেখা বক্সে আসে, রোগী দেখে ঠিক করতে পারেন (= "ঠিক আছে?" নিশ্চিতকরণ)
 *  B. A না থাকলে অডিও রেকর্ড → সার্ভারে AI বুঝে নেয় (বাড়তি AI কল নয়)
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
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const baseTextRef = useRef("");

  const SR = getSpeechRecognition();
  const canSpeech = !!SR && !speechFailed;
  const canRecord = audioAllowed && typeof window !== "undefined" && "MediaRecorder" in window;

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      mediaRef.current?.stop();
    };
  }, []);

  function startSpeech() {
    if (!SR) return;
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
      alert("মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে লিখে উত্তর দিন।");
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

  // নোট: প্রতিটি নতুন প্রশ্নে প্যারেন্ট `key={question.id}` দিয়ে কম্পোনেন্ট নতুন করে বানায় → বক্স খালি হয়
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {canSpeech ? (
          <button
            type="button"
            onClick={listening ? stopSpeech : startSpeech}
            disabled={busy}
            className={cx(
              "tap flex items-center gap-2 rounded-full px-5 py-3 text-lg font-semibold text-white",
              listening ? "recording bg-red-600" : "bg-teal-700 hover:bg-teal-800",
            )}
          >
            🎤 {listening ? "শুনছি… থামাতে চাপুন" : "চাপুন ও বলুন"}
          </button>
        ) : canRecord ? (
          <button
            type="button"
            onClick={recording ? () => mediaRef.current?.stop() : startRecording}
            disabled={busy}
            className={cx(
              "tap flex items-center gap-2 rounded-full px-5 py-3 text-lg font-semibold text-white",
              recording ? "recording bg-red-600" : "bg-teal-700 hover:bg-teal-800",
            )}
          >
            🎙️ {recording ? "রেকর্ড হচ্ছে… থামাতে চাপুন" : recorded ? "আবার রেকর্ড করুন" : "রেকর্ড করে বলুন"}
          </button>
        ) : (
          <p className="text-sm text-slate-500">এই ফোনে ভয়েস চালু নেই — অনুগ্রহ করে লিখে উত্তর দিন।</p>
        )}
        {recorded && !recording && (
          <span className="text-sm text-slate-600">✅ {recorded.seconds} সেকেন্ডের রেকর্ড প্রস্তুত</span>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-600">
          {usedVoice ? "আপনি যা বলেছেন — ঠিক না হলে এখানে বদলে দিন:" : "অথবা এখানে লিখুন:"}
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="যেমন: ৪ দিন ধরে বুকে চাপ লাগছে…"
          className="w-full rounded-xl border border-slate-300 p-3 text-lg focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100"
        />
      </label>

      <Button size="lg" className="w-full" onClick={submit} loading={busy} disabled={!text.trim() && !recorded}>
        পাঠান ➜
      </Button>
    </div>
  );
}
