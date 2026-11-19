"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AI_MODE_LABELS_BN,
  CATEGORY_LABELS,
  STATUS_LABELS_BN,
  normalizePatientCode,
  todayInDhaka,
  type AlertItem,
  type SearchResultItem,
  type VisitListItem,
} from "@chamberai/shared";
import { useAuth } from "@/components/AuthProvider";
import { playAlertSound, unlockAlertSound, useDoctorEvents } from "@/components/doctor/hooks";
import { Badge, Button, Card, Notice, Spinner } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { ageBn, codeBoth, cx, drName, sexBn, timeBn } from "@/lib/format";

function StatusBadge({ v }: { v: VisitListItem }) {
  const tone =
    v.status === "completed" ? "green" : v.status === "seen" ? "slate" : v.status === "abandoned" ? "amber" : "blue";
  return <Badge tone={tone}>{STATUS_LABELS_BN[v.status]}</Badge>;
}

function VisitRow({ v, extra }: { v: VisitListItem; extra?: ReactNode }) {
  const code = codeBoth(v.patientCode);
  return (
    <Link
      href={`/dashboard/visit/${v.id}`}
      className={cx(
        "flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3 hover:border-teal-400",
        v.redFlagLevel === "emergency" && "border-red-500 bg-red-50",
        v.redFlagLevel === "urgent" && "border-amber-400 bg-amber-50",
        v.status === "seen" && "opacity-60",
      )}
    >
      <span className="font-mono text-xl font-bold tracking-wider">{code.en}</span>
      {v.redFlagLevel !== "none" && <Badge tone="red">🔴 {v.redFlagLevel === "emergency" ? "অতি জরুরি" : "জরুরি"}</Badge>}
      <span className="text-sm text-slate-500">{timeBn(v.createdAt)}</span>
      <span className="text-sm">
        {sexBn(v.sex)}, {ageBn(v.ageYears)}
      </span>
      {v.category && <span className="text-sm text-slate-500">{CATEGORY_LABELS[v.category].bn}</span>}
      <span className="min-w-0 flex-1 truncate text-slate-800">{v.chiefComplaintShort ?? "…"}</span>
      {extra}
      <StatusBadge v={v} />
    </Link>
  );
}

export default function DashboardPage() {
  const { me, refresh } = useAuth();
  const doctor = me!.doctor!;
  const router = useRouter();

  const [date, setDate] = useState(todayInDhaka());
  const [visits, setVisits] = useState<VisitListItem[] | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const knownAlerts = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const [v, a] = await Promise.all([
        authedApi<VisitListItem[]>(`/api/doctor/visits?date=${date}`),
        authedApi<AlertItem[]>("/api/doctor/alerts"),
      ]);
      setVisits(v);
      setAlerts(a);
      const ids = new Set(a.map((x) => x.id));
      if (knownAlerts.current && a.some((x) => !knownAlerts.current!.has(x.id))) playAlertSound();
      knownAlerts.current = ids;
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "তালিকা লোড হয়নি।");
    }
  }, [date]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEvent = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void load(), 700);
  }, [load]);
  useDoctorEvents(doctor.id, onEvent);

  async function toggleChamber() {
    setToggling(true);
    try {
      await authedApi("/api/doctor/me/chamber", { body: { isOpen: !doctor.isOpen } });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "পরিবর্তন হয়নি।");
    } finally {
      setToggling(false);
    }
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const c = normalizePatientCode(code);
    if (c.length !== 6) return setSearchError("৬ অঙ্কের রোগী-কোড লিখুন।");
    setSearching(true);
    setSearchError(null);
    try {
      const r = await authedApi<SearchResultItem[]>(`/api/doctor/search?code=${c}&date=${date}`);
      setResults(r);
      if (r.length === 1) router.push(`/dashboard/visit/${r[0]!.id}`);
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "সার্চ হয়নি।");
    } finally {
      setSearching(false);
    }
  }

  const counts = {
    total: visits?.length ?? 0,
    ready: visits?.filter((v) => v.status === "completed").length ?? 0,
    active: visits?.filter((v) => v.status === "interviewing" || v.status === "finishing").length ?? 0,
  };

  return (
    <div className="space-y-5">
      {/* চেম্বার চালু/বন্ধ + শব্দ */}
      <Card className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-500">আপনার QR লিংক</p>
          <p className="font-mono text-sm">/d/{doctor.slug}</p>
        </div>
        {!soundOn && (
          <Button
            variant="secondary"
            onClick={() => {
              unlockAlertSound();
              setSoundOn(true);
            }}
          >
            🔔 অ্যালার্ট-শব্দ চালু করুন
          </Button>
        )}
        <Button variant={doctor.isOpen ? "danger" : "primary"} onClick={toggleChamber} loading={toggling}>
          {doctor.isOpen ? "⏹ চেম্বার বন্ধ করুন" : "▶ আজ চেম্বার চালু করুন"}
        </Button>
        <Badge tone={doctor.isOpen ? "green" : "slate"}>{doctor.isOpen ? "● চালু — রোগীরা শুরু করতে পারবেন" : "বন্ধ"}</Badge>
      </Card>

      {/* অ্যালার্ট */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Notice key={a.id} tone={a.level === "emergency" ? "danger" : "warn"}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-lg font-bold">{codeBoth(a.patientCode).en}</span>
                <span className="flex-1">🔴 {a.reasonBn}</span>
                <Link href={`/dashboard/visit/${a.visitId}`} className="underline">
                  দেখুন
                </Link>
                <button
                  className="rounded bg-white/80 px-2 py-1 text-sm text-slate-800"
                  onClick={async () => {
                    await authedApi(`/api/doctor/alerts/${a.id}/ack`, { body: {} }).catch(() => undefined);
                    void load();
                  }}
                >
                  দেখেছি ✓
                </button>
              </div>
            </Notice>
          ))}
        </div>
      )}

      {/* কোড-সার্চ (সব ডাক্তারের রোগী) */}
      <Card>
        <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">🔍 রোগী-কোড দিয়ে খুঁজুন</span>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="যেমন: 482 731"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-2xl tracking-widest focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100"
              autoFocus
            />
          </label>
          <label>
            <span className="mb-1 block text-sm text-slate-600">তারিখ</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-3"
            />
          </label>
          <Button type="submit" size="lg" loading={searching}>
            খুঁজুন
          </Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          অন্য ডাক্তারের রোগীও কোড দিয়ে দেখা যায় — প্রতিটি এমন দেখা অডিট-লগে রেকর্ড হয়।
        </p>
        {searchError && <div className="mt-3"><Notice tone="error">{searchError}</Notice></div>}
        {results && results.length === 0 && <div className="mt-3"><Notice tone="warn">এই কোডে এই তারিখে কোনো রোগী পাওয়া যায়নি।</Notice></div>}
        {results && results.length > 1 && (
          <div className="mt-3 space-y-2">
            {results.map((r) => (
              <VisitRow key={r.id} v={r} extra={!r.isOwn ? <Badge tone="blue">{drName(r.doctorName)}</Badge> : null} />
            ))}
          </div>
        )}
      </Card>

      {/* নিজের তালিকা */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">আমার রোগী {date === todayInDhaka() ? "(আজ)" : `(${date})`}</h2>
          <Badge tone="teal">মোট {counts.total}</Badge>
          <Badge tone="green">প্রস্তুত {counts.ready}</Badge>
          <Badge tone="blue">চলছে {counts.active}</Badge>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {visits === null ? (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        ) : visits.length === 0 ? (
          <Card className="text-center text-slate-500">
            এখনো কোনো রোগী আসেনি। {doctor.isOpen ? "রোগীরা QR স্ক্যান করলে এখানে সাথে সাথে দেখাবে।" : "আগে “চেম্বার চালু” করুন।"}
          </Card>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <VisitRow key={v.id} v={v} extra={<span className="text-xs text-slate-400">{AI_MODE_LABELS_BN[v.aiMode]}</span>} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
