"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { MAX_UPLOADS_PER_VISIT, UPLOAD_KIND_LABELS_BN, type UploadKind, type UploadUrlResponse } from "@chamberai/shared";
import { Button, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { cx } from "@/lib/format";

interface Item {
  key: string;
  uploadId: string | null;
  kind: UploadKind;
  preview: string;
  status: "uploading" | "done" | "error";
  warn?: string;
}

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
          warn: blurry ? "ছবিটা একটু ঝাপসা মনে হচ্ছে — পরিষ্কার করে আবার তুলতে পারেন।" : undefined,
        });
      } catch (e) {
        update(key, { status: "error" });
        setError((e as Error)?.message || "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।");
      }
    }
  }

  const doneIds = items.filter((i) => i.status === "done" && i.uploadId).map((i) => i.uploadId!);
  const uploading = items.some((i) => i.status === "uploading");

  return (
    <div className="space-y-4">
      <p className="text-slate-700">
        বর্তমানে যে ওষুধ খাচ্ছেন তার <b>পাতা বা বক্সের</b> ছবি, আর আগের <b>প্রিন্ট করা ল্যাব রিপোর্টের</b> ছবি দিন।
        ছাপা লেখা যেন পরিষ্কার পড়া যায়।
      </p>

      <div className="flex flex-wrap gap-2">
        {(["medicine", "lab_report", "prescription"] as UploadKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cx(
              "rounded-full border px-4 py-2 text-sm font-medium",
              kind === k ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700",
            )}
          >
            {UPLOAD_KIND_LABELS_BN[k]}
          </button>
        ))}
      </div>

      <label
        className={cx(
          "tap flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-600 bg-teal-50 px-4 py-6 text-lg font-semibold text-teal-800",
          items.length >= MAX_UPLOADS_PER_VISIT && "pointer-events-none opacity-50",
        )}
      >
        📷 ছবি তুলুন / বাছুন
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <li key={it.key} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className="h-24 w-full object-cover" />
              <div className="p-1 text-xs">
                {UPLOAD_KIND_LABELS_BN[it.kind]} ·{" "}
                {it.status === "uploading" ? <Spinner small /> : it.status === "done" ? "✅" : "❌"}
                {it.warn && <p className="text-amber-700">{it.warn}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={() => onDone(doneIds)} loading={busy} disabled={uploading || !doneIds.length}>
          ছবি জমা দিন ({doneIds.length}) ➜
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={() => onDone([])} disabled={busy || uploading}>
          এখন সাথে নেই / বাদ দিন
        </Button>
      </div>
    </div>
  );
}
