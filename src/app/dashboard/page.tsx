"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
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
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  Power,
  QrCode,
  RefreshCw,
  Search,
  Users,
} from "@/components/icons";
import { Badge, Button, Card, EmptyState, IconButton, Notice, Segmented, Skeleton, Stat, Switch, type Tone } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { ageBn, codeBoth, cx, dateLongBn, drName, greetingBn, isoDateBn, numBn, sexBn, timeBn } from "@/lib/format";

const SOUND_PREF = "chamberai:sound";
type Filter = "all" | "ready" | "active" | "seen";

function statusTone(v: VisitListItem): Tone {
  return v.status === "completed" ? "green" : v.status === "seen" ? "slate" : v.status === "abandoned" ? "amber" : "sky";
}

function VisitRow({ v, extra }: { v: VisitListItem; extra?: ReactNode }) {
  const code = codeBoth(v.patientCode);
  const flagged = v.redFlagLevel !== "none";
  return (
    <Link
      href={`/dashboard/visit/${v.id}`}
      className={cx(
        "group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-white p-3 shadow-[var(--shadow-card)] transition-colors hover:border-brand-300 sm:gap-4 sm:p-4",
        v.redFlagLevel === "emergency" ? "border-red-300" : v.redFlagLevel === "urgent" ? "border-amber-300" : "border-slate-200/80",
        v.status === "seen" && "opacity-70",
      )}
    >
      {flagged && (
        <span
          aria-hidden
          className={cx("absolute inset-y-0 left-0 w-1.5", v.redFlagLevel === "emergency" ? "bg-red-500" : "bg-amber-400")}
        />
      )}
      <div className="flex w-[92px] shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 py-2 ring-1 ring-inset ring-slate-200">
        <span className="font-mono text-[17px] font-bold tracking-wider text-slate-900">{code.en}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          <Clock size={11} /> {timeBn(v.createdAt)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-800">
            {sexBn(v.sex)}, {ageBn(v.ageYears)}
          </span>
          {flagged && (
            <Badge tone="red" icon={<AlertTriangle size={12} />}>
              {v.redFlagLevel === "emergency" ? "অতি জরুরি" : "জরুরি"}
            </Badge>
          )}
          {v.category && <Badge tone="violet">{CATEGORY_LABELS[v.category].bn}</Badge>}
          <Badge tone={statusTone(v)} dot>
            {STATUS_LABELS_BN[v.status]}
          </Badge>
          {extra}
        </div>
        <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-slate-600">{v.chiefComplaintShort ?? "রোগী এখনো উত্তর দিচ্ছেন…"}</p>
      </div>
      <ChevronRight size={20} className="shrink-0 text-slate-300 transition-colors group-hover:text-brand-600" />
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <Skeleton className="h-14 w-[92px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { me, refresh } = useAuth();
  const doctor = me!.doctor!;
  const router = useRouter();

  const [date, setDate] = useState(todayInDhaka());
  const [showDate, setShowDate] = useState(false);
  const [visits, setVisits] = useState<VisitListItem[] | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const knownAlerts = useRef<Set<string> | null>(null);
  const isToday = date === todayInDhaka();

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
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "তালিকা লোড হয়নি।");
    }
  }, [date]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  // আগে শব্দ চালু করা থাকলে প্রথম ট্যাপেই আবার চালু (ব্রাউজারের নিয়মে একটি ট্যাপ লাগে)
  useEffect(() => {
    let pref = false;
    try {
      pref = localStorage.getItem(SOUND_PREF) === "1";
    } catch {
      /* ignore */
    }
    if (!pref) return;
    const unlock = () => {
      unlockAlertSound();
      setSoundOn(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEvent = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void load(), 700);
  }, [load]);
  useDoctorEvents(doctor.id, onEvent);

  function setSound(on: boolean) {
    if (on) unlockAlertSound();
    setSoundOn(on);
    try {
      localStorage.setItem(SOUND_PREF, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  async function toggleChamber(next: boolean) {
    setToggling(true);
    try {
      await authedApi("/api/doctor/me/chamber", { body: { isOpen: next } });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "পরিবর্তন হয়নি।");
    } finally {
      setToggling(false);
    }
  }

  async function manualRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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

  const counts = useMemo(() => {
    const list = visits ?? [];
    return {
      total: list.length,
      ready: list.filter((v) => v.status === "completed").length,
      active: list.filter((v) => v.status === "interviewing" || v.status === "finishing" || v.status === "started").length,
      seen: list.filter((v) => v.status === "seen").length,
      flagged: list.filter((v) => v.redFlagLevel !== "none").length,
    };
  }, [visits]);

  const shown = useMemo(() => {
    const list = visits ?? [];
    if (filter === "ready") return list.filter((v) => v.status === "completed");
    if (filter === "active") return list.filter((v) => v.status === "interviewing" || v.status === "finishing" || v.status === "started");
    if (filter === "seen") return list.filter((v) => v.status === "seen");
    return list;
  }, [visits, filter]);

  return (
    <div className="space-y-6">
      {/* ---------- শিরোনাম ---------- */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{dateLongBn()}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            {greetingBn()}, {drName(doctor.fullName)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && <span className="hidden text-xs text-slate-400 sm:inline">আপডেট: {timeBn(updatedAt.toISOString())}</span>}
          <IconButton label="রিফ্রেশ" tone="secondary" onClick={() => void manualRefresh()} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "animate-spin" : undefined} />
          </IconButton>
        </div>
      </div>

      {/* ---------- চেম্বার ও শব্দ ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="divide-y divide-slate-100" padded={false}>
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <span
              className={cx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                doctor.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
              )}
            >
              <Power size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{doctor.isOpen ? "চেম্বার চালু আছে" : "চেম্বার বন্ধ"}</p>
              <p className="text-sm text-slate-500">
                {doctor.isOpen ? "রোগীরা QR স্ক্যান করে AI সহকারী শুরু করতে পারছেন" : "চালু করলে রোগীরা QR থেকে শুরু করতে পারবেন"}
              </p>
            </div>
            <Switch checked={doctor.isOpen} onChange={(v) => void toggleChamber(v)} disabled={toggling} label="চেম্বার চালু/বন্ধ" />
          </div>
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <span
              className={cx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                soundOn ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500",
              )}
            >
              <Bell size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">জরুরি অ্যালার্টে শব্দ</p>
              <p className="text-sm text-slate-500">জরুরি লক্ষণের রোগী এলে বিপ শব্দ হবে</p>
            </div>
            <Switch checked={soundOn} onChange={setSound} label="অ্যালার্ট-শব্দ" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <QrCode size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">আপনার রোগী-লিংক</p>
              <p className="truncate font-mono text-sm text-slate-500">/d/{doctor.slug}</p>
            </div>
          </div>
          <Link
            href="/dashboard/qr"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 text-[15px] font-semibold text-brand-800 hover:bg-brand-100"
          >
            QR পোস্টার দেখুন ও প্রিন্ট করুন <ChevronRight size={18} />
          </Link>
        </Card>
      </div>

      {/* ---------- সংখ্যা ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={isToday ? "আজ মোট রোগী" : "মোট রোগী"} value={visits ? numBn(counts.total) : "—"} icon={<Users size={18} />} tone="brand" />
        <Stat label="সামারি প্রস্তুত" value={visits ? numBn(counts.ready) : "—"} icon={<CheckCircle size={18} />} tone="green" />
        <Stat label="উত্তর দিচ্ছেন" value={visits ? numBn(counts.active) : "—"} icon={<Clock size={18} />} tone="sky" />
        <Stat label="জরুরি লক্ষণ" value={visits ? numBn(counts.flagged) : "—"} icon={<AlertTriangle size={18} />} tone="red" />
      </div>

      {/* ---------- অ্যালার্ট ---------- */}
      {alerts.length > 0 && (
        <section aria-label="জরুরি অ্যালার্ট" className="space-y-2.5">
          {alerts.map((a) => (
            <div
              key={a.id}
              role="alert"
              className={cx(
                "flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 animate-slide-up",
                a.level === "emergency" ? "bg-red-600 text-white" : "border border-amber-300 bg-amber-50 text-amber-950",
              )}
            >
              <AlertTriangle size={22} className="shrink-0" />
              <span className="font-mono text-lg font-bold tracking-wider">{codeBoth(a.patientCode).en}</span>
              <span className="min-w-0 flex-1 basis-48 font-medium">{a.reasonBn ?? "জরুরি লক্ষণ"}</span>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/visit/${a.visitId}`}
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold",
                    a.level === "emergency" ? "bg-white text-red-700" : "bg-amber-600 text-white",
                  )}
                >
                  দেখুন
                </Link>
                <button
                  type="button"
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold",
                    a.level === "emergency" ? "bg-red-700 text-white hover:bg-red-800" : "bg-white text-amber-900 ring-1 ring-inset ring-amber-300",
                  )}
                  onClick={async () => {
                    await authedApi(`/api/doctor/alerts/${a.id}/ack`, { body: {} }).catch(() => undefined);
                    void load();
                  }}
                >
                  দেখেছি
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ---------- কোড-সার্চ ---------- */}
      <Card>
        <form onSubmit={onSearch} className="space-y-3">
          <label htmlFor="code" className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Search size={20} className="text-brand-700" /> রোগী-কোড দিয়ে খুঁজুন
          </label>
          <div className="flex gap-2">
            <input
              id="code"
              inputMode="numeric"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="482 731"
              className="min-h-14 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-center font-mono text-2xl font-bold tracking-[0.2em] placeholder:font-normal placeholder:text-slate-300 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <Button type="submit" size="xl" loading={searching} aria-label="খুঁজুন">
              <Search size={20} />
              <span className="hidden sm:inline">খুঁজুন</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => setShowDate((s) => !s)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-medium text-brand-700 hover:bg-brand-50"
              aria-expanded={showDate}
            >
              <Calendar size={16} /> {isToday ? "আজকের রোগী" : isoDateBn(date)} — তারিখ বদলান
            </button>
            {showDate && (
              <input
                type="date"
                value={date}
                max={todayInDhaka()}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="min-h-10 rounded-xl border border-slate-300 bg-white px-3"
                aria-label="তারিখ"
              />
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            অন্য ডাক্তারের রোগীও কোড দিয়ে দেখা যায় — প্রতিটি এমন দেখা অডিট-লগে রেকর্ড হয়।
          </p>
        </form>
        {searchError && (
          <div className="mt-3">
            <Notice tone="error">{searchError}</Notice>
          </div>
        )}
        {results && results.length === 0 && (
          <div className="mt-3">
            <Notice tone="warn">এই কোডে {isToday ? "আজ" : "এই তারিখে"} কোনো রোগী পাওয়া যায়নি।</Notice>
          </div>
        )}
        {results && results.length > 1 && (
          <div className="mt-4 space-y-2.5">
            {results.map((r) => (
              <VisitRow key={r.id} v={r} extra={!r.isOwn ? <Badge tone="sky">{drName(r.doctorName)}</Badge> : null} />
            ))}
          </div>
        )}
      </Card>

      {/* ---------- নিজের তালিকা ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">আমার রোগী {isToday ? "(আজ)" : `(${isoDateBn(date)})`}</h2>
          {!isToday && (
            <button type="button" className="text-sm font-semibold text-brand-700 underline underline-offset-2" onClick={() => setDate(todayInDhaka())}>
              আজকে ফিরুন
            </button>
          )}
        </div>
        <Segmented<Filter>
          label="রোগী ছাঁকুন"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "সব", count: counts.total },
            { value: "ready", label: "প্রস্তুত", count: counts.ready },
            { value: "active", label: "চলছে", count: counts.active },
            { value: "seen", label: "দেখা হয়েছে", count: counts.seen },
          ]}
        />
        {error && <Notice tone="error">{error}</Notice>}
        {visits === null ? (
          <ListSkeleton />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={26} />}
            title={visits.length === 0 ? "এখনো কোনো রোগী আসেনি" : "এই তালিকায় কেউ নেই"}
            body={
              visits.length === 0
                ? doctor.isOpen
                  ? "রোগীরা QR স্ক্যান করে শুরু করলেই এখানে সাথে সাথে দেখাবে।"
                  : "উপরের সুইচ দিয়ে চেম্বার চালু করুন, তারপর রোগীরা QR থেকে শুরু করতে পারবেন।"
                : undefined
            }
            action={
              visits.length === 0 && !doctor.isOpen ? (
                <Button onClick={() => void toggleChamber(true)} loading={toggling}>
                  <Power size={18} /> চেম্বার চালু করুন
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2.5">
            {shown.map((v) => (
              <VisitRow
                key={v.id}
                v={v}
                extra={<span className="hidden text-xs text-slate-400 md:inline">{AI_MODE_LABELS_BN[v.aiMode]}</span>}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
