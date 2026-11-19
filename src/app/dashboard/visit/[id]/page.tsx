"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AI_MODE_LABELS_BN, CATEGORY_LABELS, STATUS_LABELS_BN, UPLOAD_KIND_LABELS_BN, type VisitDetail } from "@chamberai/shared";
import { SummaryCardView } from "@/components/doctor/SummaryCardView";
import { useDoctorEvents } from "@/components/doctor/hooks";
import { useAuth } from "@/components/AuthProvider";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ImageIcon,
  Info,
  MessageSquare,
  Printer,
  User,
} from "@/components/icons";
import { Badge, Button, Card, CardHeader, FullPageSpinner, IconButton, Notice, Spinner } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { ageBn, codeBoth, cx, drName, sexBn, timeBn } from "@/lib/format";

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
      <div className="mx-auto max-w-xl space-y-4">
        <Notice tone="error" title="রোগীর তথ্য খোলা যায়নি">
          {error}
        </Notice>
        <Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold text-brand-700">
          <ArrowLeft size={18} /> তালিকায় ফিরুন
        </Link>
      </div>
    );
  }
  if (!detail) return <FullPageSpinner label="রোগীর তথ্য লোড হচ্ছে…" />;

  const v = detail.visit;
  const code = codeBoth(v.patientCode);
  const flagged = v.redFlagLevel !== "none";
  const seen = v.status === "seen";

  return (
    <div className="space-y-5">
      {/* ---------- উপরের সারি ---------- */}
      <div className="no-print flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 font-semibold text-slate-600 hover:text-slate-900"
          aria-label="রোগী-তালিকায় ফিরুন"
        >
          <ArrowLeft size={20} /> তালিকা
        </Link>
        <span className="flex-1" />
        <IconButton label="প্রিন্ট" tone="secondary" onClick={() => window.print()}>
          <Printer size={18} />
        </IconButton>
        {!seen ? (
          <Button onClick={markSeen} loading={marking} className="hidden sm:inline-flex">
            <CheckCircle size={18} /> দেখা হয়েছে
          </Button>
        ) : (
          <Badge tone="green" icon={<CheckCircle size={14} />}>
            দেখা হয়েছে
          </Badge>
        )}
      </div>

      {!detail.isOwn && (
        <Notice tone="info" icon={<Info size={20} />} title={`${drName(detail.doctor.fullName)}-এর রোগী`}>
          {detail.doctor.chamberName ? `${detail.doctor.chamberName} · ` : ""}কোড-সার্চের মাধ্যমে দেখছেন — এই দেখা অডিট-লগে রেকর্ড হয়েছে।
        </Notice>
      )}

      {/* ---------- রোগীর পরিচয় ---------- */}
      <Card className={cx("relative overflow-hidden", flagged && (v.redFlagLevel === "emergency" ? "border-red-300" : "border-amber-300"))}>
        {flagged && (
          <span aria-hidden className={cx("absolute inset-y-0 left-0 w-1.5", v.redFlagLevel === "emergency" ? "bg-red-500" : "bg-amber-400")} />
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">রোগী-কোড</p>
            <p className="font-mono text-3xl font-bold tracking-[0.15em] text-slate-900 sm:text-4xl">{code.en}</p>
            <p className="text-sm text-slate-500">{code.bn}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {flagged && (
              <Badge tone="red" icon={<AlertTriangle size={13} />}>
                {v.redFlagLevel === "emergency" ? "অতি জরুরি" : "জরুরি"}
              </Badge>
            )}
            <Badge tone={v.status === "completed" ? "green" : seen ? "slate" : "sky"} dot>
              {STATUS_LABELS_BN[v.status]}
            </Badge>
            <Badge tone="slate">{AI_MODE_LABELS_BN[v.aiMode]}</Badge>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-[15px] text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <User size={16} className="text-slate-400" /> {sexBn(v.sex)}, {ageBn(v.ageYears)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" /> {timeBn(v.createdAt)}
          </span>
          {v.category && <span className="inline-flex items-center gap-1.5">{CATEGORY_LABELS[v.category].bn}</span>}
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* ---------- সামারি ---------- */}
        <Card as="section">
          <CardHeader title="ক্লিনিক্যাল সামারি" subtitle="রোগীর উত্তর থেকে গোছানো — যাচাই করে ব্যবহার করুন" />
          {detail.summary ? (
            <SummaryCardView card={detail.summary} comorbidityIds={detail.comorbidities} />
          ) : v.status === "abandoned" ? (
            <Notice tone="warn">রোগী ইন্টারভিউ শেষ করেননি — পাশে যতটুকু উত্তর দিয়েছেন তা দেখুন।</Notice>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-4 text-sky-900">
              <Spinner small className="text-sky-700" />
              <p>{v.status === "finishing" ? "সামারি তৈরি হচ্ছে… কয়েক সেকেন্ড" : "রোগী এখনো প্রশ্নের উত্তর দিচ্ছেন — শেষ হলে সামারি নিজে থেকেই আসবে।"}</p>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          {/* ---------- ছবি ---------- */}
          {detail.uploads.length > 0 && (
            <Card as="section">
              <CardHeader title="ছবি" icon={<ImageIcon size={18} />} subtitle="ট্যাপ করলে বড় করে খুলবে" />
              <div className="grid grid-cols-2 gap-2.5">
                {detail.uploads.map((u) => (
                  <figure key={u.id} id={`upl-${u.id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 target:ring-4 target:ring-brand-200">
                    {u.url ? (
                      <a href={u.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.url} alt={UPLOAD_KIND_LABELS_BN[u.kind]} loading="lazy" className="aspect-[4/3] w-full bg-slate-100 object-cover" />
                      </a>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 p-2 text-center text-xs text-slate-500">
                        {u.deleted ? "মেয়াদ শেষে মুছে ফেলা হয়েছে" : "লোড হয়নি"}
                      </div>
                    )}
                    <figcaption className="px-2 py-1.5 text-xs font-medium text-slate-600">{UPLOAD_KIND_LABELS_BN[u.kind]}</figcaption>
                  </figure>
                ))}
              </div>
            </Card>
          )}

          {/* ---------- প্রশ্নোত্তর ---------- */}
          <Card as="section">
            <CardHeader title="প্রশ্নোত্তর" icon={<MessageSquare size={18} />} subtitle="রোগীর নিজের কথায়" />
            <ol className="space-y-3">
              {detail.messages.map((m) =>
                m.role === "assistant" ? (
                  <li key={m.id} id={`msg-${m.id}`} className="text-sm leading-relaxed text-slate-500">
                    {m.textBn}
                  </li>
                ) : (
                  <li
                    key={m.id}
                    id={`msg-${m.id}`}
                    className="scroll-mt-24 rounded-2xl rounded-tl-md bg-brand-50 px-3.5 py-2.5 leading-relaxed text-slate-900 ring-brand-300 target:ring-2"
                  >
                    {m.textBn}
                    {m.sttSource && (
                      <span className="ml-2 whitespace-nowrap text-xs text-slate-400">
                        · {m.sttSource === "typed" ? "লিখে" : m.sttSource === "web_speech" ? "ভয়েস→লেখা" : "অডিও"}
                      </span>
                    )}
                  </li>
                ),
              )}
              {detail.messages.length === 0 && <p className="text-sm text-slate-400">এখনো কোনো উত্তর নেই।</p>}
            </ol>
          </Card>
        </div>
      </div>

      {/* ---------- মোবাইলে নিচের অ্যাকশন-বার ---------- */}
      {!seen && (
        <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
          <Button block size="lg" onClick={markSeen} loading={marking}>
            <CheckCircle size={20} /> দেখা হয়েছে — তালিকায় চিহ্নিত করুন
          </Button>
        </div>
      )}
      {!seen && <div className="h-16 sm:hidden" aria-hidden />}
    </div>
  );
}
