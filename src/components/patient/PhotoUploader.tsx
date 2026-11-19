"use client";

import { useState, type ReactNode } from "react";
import imageCompression from "browser-image-compression";
import { MAX_UPLOADS_PER_VISIT, UPLOAD_KIND_LABELS_BN, type UploadKind, type UploadUrlResponse } from "@chamberai/shared";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, CheckCircle, ClipboardList, FileText, Pill, X } from "@/components/icons";
import { Button, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { cx, numBn } from "@/lib/format";

interface Item {
  key: string;
  uploadId: string | null;
  kind: UploadKind;
  preview: string;
  status: "uploading" | "done" | "error";
  warn?: string;
}

const KINDS: { kind: UploadKind; icon: ReactNode }[] = [
  { kind: "medicine", icon: <Pill size={18} /> },
  { kind: "lab_report", icon: <FileText size={18} /> },
  { kind: "prescription", icon: <ClipboardList size={18} /> },
];

/** ব্রাউজারেই ঝাপসা-চেক (Laplacian variance) — সার্ভারের দুর্বল CPU-তে চাপ নেই */
async function isBlurry(file: Blob): Promise<boolean> {
  try {
    const bmp = await createImageBitmap(file);
    const w = 320;
    const h = Math.max(1, Math.round((bmp.height / bmp.width) * w));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(bmp, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) gray[i] = 0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!;
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = gray[i - 1]! + gray[i + 1]! + gray[i - w]! + gray[i + w]! - 4 * gray[i]!;
        sum += lap;
        sumSq += lap * lap;
        n++;
      }
    }
    const mean = sum / n;
    return sumSq / n - mean * mean < 60;
  } catch {
    return false;
  }
}

export function PhotoUploader({
  visitId,
  secret,
  busy,
  onDone,
}: {
  visitId: string;
  secret: string;
  busy: boolean;
  onDone: (uploadIds: string[]) => void;
}) {
  // ছবি ঐচ্ছিক: আগে জিজ্ঞেস করা হয় সাথে আছে কিনা — না থাকলে এক ট্যাপেই শেষ
  const [mode, setMode] = useState<"ask" | "upload">("ask");
  const [items, setItems] = useState<Item[]>([]);
  const [kind, setKind] = useState<UploadKind>("medicine");
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  async function handleFiles(files: FileList | null) {
    setError(null);
    const list = Array.from(files ?? []).slice(0, MAX_UPLOADS_PER_VISIT - items.length);
    for (const file of list) {
      const key = `${Date.now()}-${Math.random()}`;
      setItems((prev) => [...prev, { key, uploadId: null, kind, preview: URL.createObjectURL(file), status: "uploading" }]);
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.8,
        });
        const blurry = await isBlurry(compressed);
        const up = await api<UploadUrlResponse>(`/api/visits/${visitId}/upload-url`, {
          body: { kind, contentType: "image/jpeg" },
          secret,
        });
        const { error: upErr } = await supabase()
          .storage.from(up.bucket)
          .uploadToSignedUrl(up.path, up.token, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        update(key, {
          uploadId: up.uploadId,
          status: "done",
          warn: blurry ? "একটু ঝাপসা — চাইলে আবার তুলুন" : undefined,
        });
      } catch (e) {
        update(key, { status: "error" });
        setError((e as Error)?.message || "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।");
      }
    }
  }

  const doneIds = items.filter((i) => i.status === "done" && i.uploadId).map((i) => i.uploadId!);
  const uploading = items.some((i) => i.status === "uploading");
  const full = items.length >= MAX_UPLOADS_PER_VISIT;

  if (mode === "ask") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-brand-700">ঐচ্ছিক — না থাকলেও চলবে</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">ওষুধের পাতা বা আগের রিপোর্ট সাথে আছে?</h2>
          <p className="mt-1.5 leading-relaxed text-slate-600">
            থাকলে ছবি দিন — ডাক্তার সহজে বুঝবেন আপনি কী ওষুধ খাচ্ছেন। না থাকলে কোনো সমস্যা নেই, সরাসরি শেষ করুন।
          </p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button size="xl" block onClick={() => onDone([])} loading={busy}>
            <CheckCircle size={22} /> না, নেই — শেষ করুন
          </Button>
          <Button size="xl" block variant="secondary" onClick={() => setMode("upload")} disabled={busy}>
            <Camera size={22} /> হ্যাঁ, ছবি দেব
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => setMode("ask")}
          disabled={uploading || busy || items.length > 0}
          className="mb-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:hidden"
        >
          <ArrowLeft size={16} /> ফিরে যান
        </button>
        <h2 className="text-xl font-bold">ওষুধ ও রিপোর্টের ছবি <span className="text-base font-semibold text-slate-400">(ঐচ্ছিক)</span></h2>
        <p className="mt-1 leading-relaxed text-slate-600">
          যে ওষুধ খাচ্ছেন তার <b>পাতা বা বক্স</b>, অথবা আগের <b>প্রিন্ট করা রিপোর্টের</b> ছবি — যেটা আছে শুধু সেটাই দিন। লেখা যেন পরিষ্কার পড়া যায়।
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">কিসের ছবি?</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="ছবির ধরন">
          {KINDS.map(({ kind: k, icon }) => {
            const on = kind === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setKind(k)}
                className={cx(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-center text-[13px] font-semibold leading-tight transition-colors",
                  on ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {icon}
                {UPLOAD_KIND_LABELS_BN[k]}
              </button>
            );
          })}
        </div>
      </div>

      <label
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50/60 px-4 py-7 text-center transition-colors hover:bg-brand-50 focus-within:ring-4 focus-within:ring-brand-100",
          full && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-[var(--shadow-raised)]">
          <Camera size={26} />
        </span>
        <span className="text-lg font-semibold text-brand-900">ছবি তুলুন বা গ্যালারি থেকে বাছুন</span>
        <span className="text-sm text-slate-500">
          সর্বোচ্চ {numBn(MAX_UPLOADS_PER_VISIT)}টি · এখন বাছাই: {UPLOAD_KIND_LABELS_BN[kind]}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {items.map((it) => (
            <li key={it.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt={UPLOAD_KIND_LABELS_BN[it.kind]} className="aspect-square w-full object-cover" />
                <span
                  className={cx(
                    "absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow",
                    it.status === "uploading" && "bg-slate-900/60",
                    it.status === "done" && "bg-emerald-600",
                    it.status === "error" && "bg-red-600",
                  )}
                  aria-label={it.status === "uploading" ? "আপলোড হচ্ছে" : it.status === "done" ? "আপলোড হয়েছে" : "আপলোড হয়নি"}
                >
                  {it.status === "uploading" ? <Spinner small /> : it.status === "done" ? <Check size={16} strokeWidth={3} /> : <X size={16} />}
                </span>
              </div>
              <div className="space-y-0.5 p-2">
                <p className="truncate text-xs font-medium text-slate-700">{UPLOAD_KIND_LABELS_BN[it.kind]}</p>
                {it.warn && (
                  <p className="flex items-center gap-1 text-[11px] leading-tight text-amber-700">
                    <AlertTriangle size={12} /> {it.warn}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        {doneIds.length > 0 ? (
          <>
            <Button size="xl" block onClick={() => onDone(doneIds)} loading={busy} disabled={uploading}>
              {numBn(doneIds.length)}টি ছবি জমা দিয়ে শেষ করুন <ArrowRight />
            </Button>
            <Button size="lg" variant="ghost" block onClick={() => onDone([])} disabled={busy || uploading}>
              ছবি ছাড়াই শেষ করুন
            </Button>
          </>
        ) : (
          <Button size="xl" block variant="secondary" onClick={() => onDone([])} loading={busy} disabled={uploading}>
            ছবি ছাড়াই শেষ করুন <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
