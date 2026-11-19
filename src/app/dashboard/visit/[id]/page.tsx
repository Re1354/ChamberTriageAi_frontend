"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CATEGORY_LABELS, STATUS_LABELS_BN, UPLOAD_KIND_LABELS_BN, type VisitDetail } from "@chamberai/shared";
import { SummaryCardView } from "@/components/doctor/SummaryCardView";
import { useDoctorEvents } from "@/components/doctor/hooks";
import { useAuth } from "@/components/AuthProvider";
import { Badge, Button, Card, FullPageSpinner, Notice } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { ageBn, codeBoth, drName, sexBn, timeBn } from "@/lib/format";

export default function VisitPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const { me } = useAuth();
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await authedApi<VisitDetail>(`/api/doctor/visits/${id}`));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "তথ্য লোড হয়নি।");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // সামারি তৈরি হতে থাকলে নিজে থেকে আপডেট
  useDoctorEvents(detail?.isOwn ? me?.doctor?.id : undefined, () => void load());
  useEffect(() => {
    if (!detail || detail.summary || detail.visit.status === "abandoned") return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [detail, load]);

  async function markSeen() {
    setMarking(true);
    try {
      await authedApi(`/api/doctor/visits/${id}/seen`, { body: {} });
      await load();
    } finally {
      setMarking(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Notice tone="error">{error}</Notice>
        <Link href="/dashboard" className="text-teal-700 underline">
          ← তালিকায় ফিরুন
        </Link>
      </div>
    );
  }
  if (!detail) return <FullPageSpinner />;

  const v = detail.visit;
  const code = codeBoth(v.patientCode);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link href="/dashboard" className="text-teal-700 underline">
          ← তালিকা
        </Link>
        <span className="flex-1" />
        <Button variant="secondary" onClick={() => window.print()}>
          🖨 প্রিন্ট
        </Button>
        {v.status !== "seen" && (
          <Button onClick={markSeen} loading={marking}>
            দেখা হয়েছে ✓
          </Button>
        )}
      </div>

      {!detail.isOwn && (
        <Notice tone="info">
          এটি <b>{drName(detail.doctor.fullName)}</b>-এর রোগী{detail.doctor.chamberName ? ` (${detail.doctor.chamberName})` : ""} — কোড-সার্চের মাধ্যমে
          দেখছেন। এই দেখা অডিট-লগে রেকর্ড হয়েছে।
        </Notice>
      )}

      <Card className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-3xl font-bold tracking-widest">{code.en}</span>
          <span className="text-lg text-slate-500">({code.bn})</span>
          {v.redFlagLevel !== "none" && <Badge tone="red">🔴 {v.redFlagLevel === "emergency" ? "অতি জরুরি" : "জরুরি"}</Badge>}
          <Badge tone="slate">{STATUS_LABELS_BN[v.status]}</Badge>
        </div>
        <p className="text-slate-700">
          {sexBn(v.sex)} · {ageBn(v.ageYears)} · {timeBn(v.createdAt)}
          {v.category ? ` · ${CATEGORY_LABELS[v.category].bn}` : ""}
        </p>
      </Card>

      <Card>
        {detail.summary ? (
          <SummaryCardView card={detail.summary} comorbidityIds={detail.comorbidities} />
        ) : v.status === "abandoned" ? (
          <Notice tone="warn">রোগী ইন্টারভিউ শেষ করেননি — নিচে যতটুকু উত্তর দিয়েছেন তা দেখুন।</Notice>
        ) : (
          <Notice tone="info">
            {v.status === "finishing" ? "সামারি তৈরি হচ্ছে… (কয়েক সেকেন্ড)" : "রোগী এখনো প্রশ্নের উত্তর দিচ্ছেন… নিচে এ পর্যন্ত উত্তর দেখুন।"}
          </Notice>
        )}
      </Card>

      {detail.uploads.length > 0 && (
        <Card className="space-y-2">
          <h3 className="font-bold">ছবি</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {detail.uploads.map((u) => (
              <figure key={u.id} id={`upl-${u.id}`} className="overflow-hidden rounded-xl border border-slate-200">
                {u.url ? (
                  <a href={u.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.url} alt={UPLOAD_KIND_LABELS_BN[u.kind]} className="h-40 w-full object-cover" />
                  </a>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-500">
                    {u.deleted ? "মেয়াদ শেষে মুছে ফেলা হয়েছে" : "লোড হয়নি"}
                  </div>
                )}
                <figcaption className="p-1 text-xs text-slate-600">{UPLOAD_KIND_LABELS_BN[u.kind]}</figcaption>
              </figure>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-2">
        <h3 className="font-bold">প্রশ্নোত্তর (রোগীর নিজের কথায়)</h3>
        <ol className="space-y-2">
          {detail.messages.map((m) => (
            <li
              key={m.id}
              id={`msg-${m.id}`}
              className={m.role === "assistant" ? "text-slate-500" : "rounded-lg bg-teal-50 px-3 py-2 text-slate-900 target:ring-2 target:ring-teal-500"}
            >
              <span className="mr-2 text-xs font-semibold uppercase">{m.role === "assistant" ? "প্রশ্ন" : "রোগী"}</span>
              {m.textBn}
              {m.sttSource && m.role === "patient" && (
                <span className="ml-2 text-xs text-slate-400">
                  ({m.sttSource === "typed" ? "লিখে" : m.sttSource === "web_speech" ? "ভয়েস→লেখা" : "অডিও"})
                </span>
              )}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
