"use client";

import { useEffect, useState } from "react";
import type { MetricsResponse } from "@chamberai/shared";
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldCheck, Sparkles, Users } from "@/components/icons";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { Card, CardHeader, Notice, PageHeader, Skeleton, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { numBn } from "@/lib/format";

function mermaidImg(src: string): string {
  const b64 = btoa(unescape(encodeURIComponent(src)));
  return `https://mermaid.ink/svg/${b64}`;
}

const ARCH = `flowchart LR
  P[Patient phone<br/>QR → /d/slug] --> W[Next.js on Vercel]
  D[Doctor dashboard<br/>own login] --> W
  W -->|interview API| A[Fastify on Render]
  A --> G[LangGraph<br/>Interview agent]
  A --> S[LangGraph<br/>Summarizer agent]
  G --> GM[Gemini Flash-Lite]
  S --> GM
  A --> DB[(Supabase Postgres<br/>RLS · pgvector · pg_trgm)]
  P -->|signed upload| ST[(Supabase Storage)]
  DB -->|Realtime doctor_events| D`;

export default function DocsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [graphs, setGraphs] = useState<{ interview: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MetricsResponse>("/api/metrics", { timeoutMs: 100_000 })
      .then(setMetrics)
      .catch(() => setError("লাইভ মেট্রিক্স লোড হয়নি — সার্ভার চালু হচ্ছে, একটু পরে রিফ্রেশ করুন।"));
    api<{ interview: string; summary: string }>("/api/graphs", { timeoutMs: 100_000 }).then(setGraphs).catch(() => undefined);
  }, []);

  const v = (n: number | null | undefined) => (n === null || n === undefined ? "—" : numBn(n));

  return (
    <>
      <PublicHeader links={false} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <PageHeader title="প্রযুক্তি ও লাইভ মেট্রিক্স" subtitle="আর্কিটেকচার, এজেন্ট-গ্রাফ ও আজকের আসল মাপা সংখ্যা (কোনো রোগীর ব্যক্তিগত তথ্য নয়)।" />

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">আজকের লাইভ মেট্রিক্স</h2>
          {error && <Notice tone="warn">{error}</Notice>}
          {!metrics && !error && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          )}
          {metrics && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="আজকের ইন্টারভিউ" value={v(metrics.visitsToday)} icon={<Users size={18} />} tone="brand" />
              <Stat label="সম্পূর্ণ" value={v(metrics.completedToday)} icon={<CheckCircle size={18} />} tone="green" />
              <Stat label="জরুরি অ্যালার্ট" value={v(metrics.alertsToday)} icon={<AlertTriangle size={18} />} tone="red" />
              <Stat label="আজ AI কল" value={v(metrics.llmCallsToday)} icon={<Sparkles size={18} />} tone="sky" />
              <Stat label="রোগী-প্রতি AI কল" value={v(metrics.avgCallsPerCompletedVisit)} hint="গড়" />
              <Stat label="রোগী-প্রতি টোকেন" value={v(metrics.avgTokensPerCompletedVisit)} hint="গড়" />
              <Stat label="AI লেটেন্সি" value={metrics.avgLatencyMs === null ? "—" : `${numBn(metrics.avgLatencyMs)} ms`} icon={<Clock size={18} />} hint="গড়" />
              <Stat
                label="বাকি কোটা"
                value={`${numBn(metrics.remainingQuota.turn)} / ${numBn(metrics.remainingQuota.final)}`}
                icon={<Activity size={18} />}
                hint="টার্ন / ফাইনাল"
              />
            </div>
          )}
        </section>

        <Card>
          <CardHeader title="আর্কিটেকচার" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mermaidImg(ARCH)} alt="সিস্টেম আর্কিটেকচার ডায়াগ্রাম" className="mx-auto max-h-[420px] w-full object-contain" />
        </Card>

        {graphs && (
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title="Interview Agent" subtitle="LangGraph — লাইভ গ্রাফ" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mermaidImg(graphs.interview)} alt="Interview agent graph" className="mx-auto w-full object-contain" />
            </Card>
            <Card>
              <CardHeader title="Summarizer Agent" subtitle="LangGraph — লাইভ গ্রাফ" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mermaidImg(graphs.summary)} alt="Summarizer agent graph" className="mx-auto w-full object-contain" />
            </Card>
          </div>
        )}

        <Card>
          <CardHeader title="নিরাপত্তা ও গোপনীয়তা" icon={<ShieldCheck size={18} />} />
          <ul className="space-y-2.5 text-slate-700">
            {[
              "প্রত্যেক ডাক্তারের আলাদা লগইন; ড্যাশবোর্ডের তালিকায় শুধু নিজের রোগী।",
              "অন্য ডাক্তারের রোগী শুধু ৬-অঙ্কের কোড দিয়ে সার্চ করে দেখা যায় — ঘণ্টাপ্রতি সীমা ও অডিট-লগসহ।",
              "রোগীর নাম/ফোন নেওয়া হয় না; বললেও মাস্ক করা হয়। ছবি ১৪ দিনে মুছে যায়।",
              "জরুরি লক্ষণ শনাক্তকরণ নির্ধারিত নিয়মে — AI কোটা শেষ হলেও কাজ করে।",
              "প্রতিটি সামারি-তথ্যের উৎস (রোগীর কথা/ছবি) যাচাই করা হয়; AI রোগ নির্ণয় করে না।",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-brand-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
