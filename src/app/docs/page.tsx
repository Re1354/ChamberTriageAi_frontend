"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MetricsResponse } from "@chamberai/shared";
import { Card, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

function mermaidImg(src: string): string {
  const b64 = btoa(unescape(encodeURIComponent(src)));
  return `https://mermaid.ink/svg/${b64}`;
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-teal-900">{value ?? "—"}</p>
    </div>
  );
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
    api<MetricsResponse>("/api/metrics", { timeoutMs: 100_000 }).then(setMetrics).catch(() => setError("লাইভ মেট্রিক্স লোড হয়নি (সার্ভার চালু হচ্ছে?)"));
    api<{ interview: string; summary: string }>("/api/graphs", { timeoutMs: 100_000 }).then(setGraphs).catch(() => undefined);
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 pb-16">
      <header>
        <Link href="/" className="text-sm text-teal-700 underline">
          ← হোম
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-teal-900">ChamberTriage AI — লাইভ /docs</h1>
        <p className="text-slate-600">আর্কিটেকচার, এজেন্ট-গ্রাফ ও আসল মাপা মেট্রিক্স (কোনো রোগীর ব্যক্তিগত তথ্য নয়)।</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">আজকের লাইভ মেট্রিক্স</h2>
        {error && <Notice tone="warn">{error}</Notice>}
        {!metrics && !error && <Spinner />}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="আজকের ইন্টারভিউ" value={metrics.visitsToday} />
            <Stat label="সম্পূর্ণ" value={metrics.completedToday} />
            <Stat label="Red-flag অ্যালার্ট" value={metrics.alertsToday} />
            <Stat label="আজ AI কল" value={metrics.llmCallsToday} />
            <Stat label="রোগী-প্রতি AI কল (গড়)" value={metrics.avgCallsPerCompletedVisit} />
            <Stat label="রোগী-প্রতি টোকেন (গড়)" value={metrics.avgTokensPerCompletedVisit} />
            <Stat label="AI লেটেন্সি (ms, গড়)" value={metrics.avgLatencyMs} />
            <Stat label="বাকি কোটা (টার্ন / ফাইনাল)" value={`${metrics.remainingQuota.turn} / ${metrics.remainingQuota.final}`} />
          </div>
        )}
      </section>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">আর্কিটেকচার</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mermaidImg(ARCH)} alt="Architecture diagram" className="mx-auto max-h-[420px]" />
      </Card>

      {graphs && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2">
            <h2 className="text-lg font-bold">Interview Agent (LangGraph, লাইভ)</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mermaidImg(graphs.interview)} alt="Interview graph" className="mx-auto" />
          </Card>
          <Card className="space-y-2">
            <h2 className="text-lg font-bold">Summarizer Agent (LangGraph, লাইভ)</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mermaidImg(graphs.summary)} alt="Summary graph" className="mx-auto" />
          </Card>
        </div>
      )}

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">নিরাপত্তা ও গোপনীয়তা</h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li>প্রত্যেক ডাক্তারের আলাদা লগইন; ড্যাশবোর্ডের তালিকায় শুধু নিজের রোগী।</li>
          <li>অন্য ডাক্তারের রোগী শুধু ৬-অঙ্কের কোড দিয়ে সার্চ করে দেখা যায় — ঘণ্টাপ্রতি সীমা ও অডিট-লগসহ।</li>
          <li>রোগীর নাম/ফোন নেওয়া হয় না; বললেও মাস্ক করা হয়। ছবি ১৪ দিনে মুছে যায়।</li>
          <li>Red-flag শনাক্তকরণ নির্ধারিত নিয়মে — AI কোটা শেষ হলেও কাজ করে।</li>
          <li>প্রতিটি সামারি-তথ্যের উৎস (রোগীর কথা/ছবি) যাচাই করা হয়; AI রোগ-নির্ণয় করে না।</li>
        </ul>
      </Card>
    </main>
  );
}
