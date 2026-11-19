"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  COMORBIDITIES,
  CONSENT_POINTS_BN,
  CONSENT_VERSION,
  DEMO_DATA_NOTICE_BN,
  bnToEnDigits,
  todayInDhaka,
  type DoctorPublic,
  type Question,
  type RedFlagNotice,
  type RespondBody,
  type RespondResponse,
  type Sex,
  type StartVisitResponse,
  type Step,
  type VisitStateResponse,
} from "@chamberai/shared";
import { LogoMark } from "@/components/brand";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  CheckCircle,
  GraduationCap,
  Lock,
  MapPin,
  MessageSquare,
  Mic,
  Phone,
  RefreshCw,
  Stethoscope,
  User,
  Volume,
} from "@/components/icons";
import { Avatar, Button, Card, FullPageSpinner, Notice, Skeleton, Spinner } from "@/components/ui";
import { api, ApiError, wakeApi } from "@/lib/api";
import { codeBoth, cx, numBn } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { AnswerInput, type AnswerSubmit } from "./AnswerInput";
import { PhotoUploader } from "./PhotoUploader";

type Phase = "loading" | "notfound" | "intro" | "consent" | "declined" | "demographics" | "interview";
interface Saved {
  visitId: string;
  secret: string;
  code: string;
  date: string;
}
interface HistoryItem {
  role: "assistant" | "patient";
  text: string;
}

const key = (slug: string) => `chamberai:visit:${slug}`;

function readSaved(slug: string): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(key(slug)) ?? "null") as Saved | null;
    return s && s.date === todayInDhaka() ? s : null;
  } catch {
    return null;
  }
}
function clearSaved(slug: string) {
  try {
    localStorage.removeItem(key(slug));
  } catch {
    /* ignore */
  }
}

async function loadDoctor(slug: string): Promise<DoctorPublic | null> {
  // Supabase RPC — Render সার্ভার ঘুমিয়ে থাকলেও সাথে সাথে ডাক্তারের নাম দেখায়
  try {
    const { data, error } = await supabase().rpc("get_doctor_public", { p_slug: slug });
    if (!error && Array.isArray(data)) {
      const r = data[0] as
        | {
            full_name: string;
            specialty: string | null;
            qualifications?: string | null;
            chamber_name: string | null;
            chamber_address: string | null;
            is_open: boolean;
          }
        | undefined;
      if (!r) return null;
      return {
        fullName: r.full_name,
        specialty: r.specialty,
        qualifications: r.qualifications ?? null,
        chamberName: r.chamber_name,
        chamberAddress: r.chamber_address,
        isOpen: r.is_open,
      };
    }
  } catch {
    /* fall back to API */
  }
  try {
    return await api<DoctorPublic>(`/api/public/doctors/${encodeURIComponent(slug)}`, { timeoutMs: 100_000 });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");

const STEPS = ["সম্মতি", "আপনার তথ্য", "প্রশ্নোত্তর", "আগের রোগ", "ছবি (ঐচ্ছিক)"] as const;

function stepIndex(phase: Phase, step: Step | null): number | null {
  if (phase === "consent") return 0;
  if (phase === "demographics") return 1;
  if (phase !== "interview" || !step) return null;
  if (step.type === "question") return 2;
  if (step.type === "comorbidities") return 3;
  if (step.type === "photos") return 4;
  return 5;
}

/* ---------------------------------------------------------------- pieces */
function Progress({ index }: { index: number }) {
  const done = index >= STEPS.length;
  return (
    <div aria-label="অগ্রগতি" className="animate-fade-in">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{done ? "সম্পন্ন" : STEPS[index]}</span>
        <span className="tabular-nums text-slate-500">
          {done ? "✓" : `ধাপ ${numBn(index + 1)} / ${numBn(STEPS.length)}`}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cx(
              "h-1.5 rounded-full transition-colors duration-300",
              i < index || done ? "bg-brand-600" : i === index ? "bg-brand-400" : "bg-slate-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, compact }: { doctor: DoctorPublic | null; compact: boolean }) {
  if (!doctor) {
    return (
      <Card className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }
  return (
    <Card className={cx("animate-fade-in", compact && "py-3 sm:py-3")}>
      <div className="flex items-center gap-3.5">
        <Avatar name={doctor.fullName} size={compact ? "md" : "lg"} />
        <div className="min-w-0 flex-1">
          <p className={cx("font-bold leading-snug text-slate-900", compact ? "text-base" : "text-lg sm:text-xl")}>
            {doctor.fullName}
          </p>
          {doctor.specialty && <p className="text-sm font-medium text-brand-700">{doctor.specialty}</p>}
        </div>
      </div>
      {!compact && (doctor.qualifications || doctor.chamberName || doctor.chamberAddress) && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          {doctor.qualifications && (
            <li className="flex gap-2.5">
              <GraduationCap size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{doctor.qualifications}</span>
            </li>
          )}
          {doctor.chamberName && (
            <li className="flex gap-2.5">
              <Building size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{doctor.chamberName}</span>
            </li>
          )}
          {doctor.chamberAddress && (
            <li className="flex gap-2.5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{doctor.chamberAddress}</span>
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{body}</p>
      </div>
    </li>
  );
}

function Bubble({ role, children, strong }: { role: "assistant" | "patient"; children: ReactNode; strong?: boolean }) {
  if (role === "patient") {
    return (
      <div className="flex justify-end animate-slide-up">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {children}
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 animate-slide-up">
      <LogoMark size={28} className="shrink-0" />
      <div
        className={cx(
          "max-w-[88%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 leading-relaxed text-slate-800",
          strong ? "text-lg font-semibold text-slate-900 sm:text-xl" : "text-[15px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- main */
export function PatientFlow({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [doctor, setDoctor] = useState<DoctorPublic | null>(null);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [redFlag, setRedFlag] = useState<RedFlagNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [comorbid, setComorbid] = useState<string[]>([]);
  const [bnVoice, setBnVoice] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void wakeApi().then((ok) => !cancelled && setApiReady(ok));
    (async () => {
      try {
        const d = await loadDoctor(slug);
        if (cancelled) return;
        if (!d) return setPhase("notfound");
        setDoctor(d);
        const s = readSaved(slug);
        if (s) {
          try {
            const st = await api<VisitStateResponse>(`/api/visits/${s.visitId}/state`, { secret: s.secret, timeoutMs: 100_000 });
            if (cancelled) return;
            setSaved(s);
            setStep(st.step);
            setRedFlag(st.redFlag);
            if (st.step.type === "question") setHistory([{ role: "assistant", text: st.step.question.textBn }]);
            setPhase("interview");
            return;
          } catch {
            clearSaved(slug);
          }
        }
        setPhase("intro");
      } catch (e) {
        if (!cancelled) {
          setError(errMsg(e));
          setPhase("intro");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setBnVoice(window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("bn")));
    check();
    window.speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, []);

  // নতুন প্রশ্ন এলে কথোপকথনের শেষে স্ক্রল
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [history.length]);

  function go(p: Phase) {
    setError(null);
    setPhase(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retryWake() {
    setApiReady(null);
    void wakeApi().then(setApiReady);
  }

  function speak(q: Question) {
    if (q.audioUrl) {
      void new Audio(q.audioUrl).play().catch(() => undefined);
      return;
    }
    const u = new SpeechSynthesisUtterance(q.textBn);
    u.lang = "bn-BD";
    const v = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith("bn"));
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function startInterview() {
    const ageNum = Number(bnToEnDigits(age.trim()));
    if (!age.trim() || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) return setError("সঠিক বয়স লিখুন (০–১২০)।");
    if (!sex) return setError("লিঙ্গ বেছে নিন।");
    setBusy(true);
    setError(null);
    try {
      if (apiReady !== true) {
        // সার্ভার তখনো জাগছে — রোগীকে এরর না দেখিয়ে অপেক্ষা করি
        const ok = await wakeApi();
        setApiReady(ok);
        if (!ok) throw new ApiError(0, "network", "সার্ভারে সংযোগ হচ্ছে না — এক মিনিট পর আবার \"প্রশ্ন শুরু করুন\" চাপুন।");
      }
      const res = await api<StartVisitResponse>("/api/visits/start", {
        body: { slug, consentVersion: CONSENT_VERSION, ageYears: ageNum, sex },
        timeoutMs: 100_000,
      });
      const s: Saved = { visitId: res.visitId, secret: res.sessionSecret, code: res.patientCode, date: todayInDhaka() };
      try {
        localStorage.setItem(key(slug), JSON.stringify(s));
      } catch {
        /* প্রাইভেট মোডে স্টোরেজ না থাকলেও চলবে */
      }
      setSaved(s);
      setStep(res.step);
      setHistory(res.step.type === "question" ? [{ role: "assistant", text: res.step.question.textBn }] : []);
      setPhase("interview");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function respond(body: RespondBody, echo?: string) {
    if (!saved) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<RespondResponse>(`/api/visits/${saved.visitId}/respond`, {
        body,
        secret: saved.secret,
        timeoutMs: 90_000,
      });
      if (res.redFlag) setRedFlag(res.redFlag);
      setHistory((h) => [
        ...h,
        ...(echo ? [{ role: "patient" as const, text: echo }] : []),
        ...(res.transcriptBn ? [{ role: "patient" as const, text: `(যা বুঝেছি) ${res.transcriptBn}` }] : []),
        ...(res.step.type === "question" ? [{ role: "assistant" as const, text: res.step.question.textBn }] : []),
      ]);
      setStep(res.step);
      if (res.step.type !== "question") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof ApiError && e.code === "step_mismatch" && e.data?.step) setStep(e.data.step as Step);
      if (e instanceof ApiError && (e.status === 401 || e.status === 410)) {
        clearSaved(slug);
        setSaved(null);
        setPhase("intro");
      }
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  function onAnswer(a: AnswerSubmit) {
    if (step?.type !== "question") return;
    void respond({ type: "answer", questionId: step.question.id, ...a }, a.text ?? "ভয়েস উত্তর পাঠানো হয়েছে");
  }

  function newPatient() {
    clearSaved(slug);
    setSaved(null);
    setStep(null);
    setHistory([]);
    setRedFlag(null);
    setAge("");
    setSex(null);
    setComorbid([]);
    go("intro");
  }

  // ------------------------------------------------------------------ render
  if (phase === "loading") return <FullPageSpinner label="লোড হচ্ছে…" />;

  const code = saved ? codeBoth(saved.code) : null;
  const sIdx = stepIndex(phase, step);
  const inInterview = phase === "interview";
  const done = inInterview && step?.type === "done";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 via-slate-50 to-slate-50">
      {/* অ্যাপ-বার */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 pt-safe backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2.5 px-4">
          <LogoMark size={30} />
          <p className="min-w-0 flex-1 truncate font-bold text-slate-900">
            ChamberTriage <span className="text-brand-600">AI</span>
          </p>
          {code && !done && (
            <span className="rounded-full bg-brand-700 px-3 py-1 font-mono text-sm font-bold tracking-wider text-white" aria-label={`রোগী-কোড ${code.en}`}>
              {code.en}
            </span>
          )}
        </div>
      </header>

      <main ref={topRef} className="mx-auto max-w-xl scroll-mt-20 space-y-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        {phase === "notfound" ? (
          <Card className="space-y-3 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle size={28} />
            </span>
            <h1 className="text-xl font-bold">এই লিংকের কোনো ডাক্তার পাওয়া যায়নি</h1>
            <p className="text-slate-600">চেম্বারের দরজায় লাগানো QR কোডটি আবার স্ক্যান করুন, অথবা চেম্বারের সহকারীকে জিজ্ঞেস করুন।</p>
          </Card>
        ) : (
          <>
            <DoctorCard doctor={doctor} compact={inInterview} />

            {sIdx !== null && <Progress index={sIdx} />}

            {code && inInterview && !done && (
              <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">আপনার রোগী-কোড</span>
                <span className="font-mono text-xl font-bold tracking-widest text-brand-800">{code.en}</span>
                <span className="ml-auto text-xs text-slate-500">ডাক্তারকে বলবেন</span>
              </div>
            )}

            {redFlag && (
              <Notice
                tone={redFlag.level === "emergency" ? "danger" : "warn"}
                title={redFlag.messageBn.replace(/^\s*⚠️?\s*/, "")}
                action={
                  redFlag.level === "emergency" ? (
                    <a
                      href="tel:999"
                      className="flex shrink-0 items-center gap-1.5 self-center rounded-xl bg-white px-3 py-2 text-sm font-bold text-red-700"
                    >
                      <Phone size={16} /> ৯৯৯
                    </a>
                  ) : undefined
                }
              />
            )}

            {error && <Notice tone="error">{error}</Notice>}

            {/* ---------- শুরু ---------- */}
            {phase === "intro" && (
              <Card className="space-y-6 animate-slide-up">
                {!doctor?.isOpen ? (
                  <Notice tone="warn" title="এই মুহূর্তে AI সহকারী চালু নেই">
                    চেম্বারের সহকারীর সাথে কথা বলুন — স্বাভাবিক নিয়মেই ডাক্তার দেখাতে পারবেন।
                  </Notice>
                ) : (
                  <>
                    <div>
                      <h1 className="text-[22px] font-bold leading-snug text-slate-900 sm:text-2xl">
                        ডাক্তার দেখানোর আগে আপনার সমস্যা জানিয়ে দিন
                      </h1>
                      <p className="mt-2 leading-relaxed text-slate-600">
                        AI সহকারী কয়েকটি ছোট প্রশ্ন করবে। আপনার উত্তর গুছিয়ে ডাক্তারের কাছে পৌঁছে যাবে — ডাক্তার আপনাকে আরও ভালোভাবে
                        সময় দিতে পারবেন। সময় লাগবে মাত্র ২–৩ মিনিট।
                      </p>
                    </div>
                    <ul className="space-y-4">
                      <Feature icon={<Mic size={20} />} title="বলে বা লিখে উত্তর দিন" body="নিজের ভাষায়, আঞ্চলিক টানেও চলবে" />
                      <Feature icon={<Lock size={20} />} title="নাম বা ফোন নম্বর লাগবে না" body="শুধু একটি ৬ অঙ্কের রোগী-কোড পাবেন" />
                      <Feature icon={<Stethoscope size={20} />} title="ডাক্তার আগেই দেখবেন" body="জরুরি লক্ষণ থাকলে সাথে সাথে জানানো হয়" />
                    </ul>
                    <div className="space-y-3">
                      <Button size="xl" block onClick={() => go("consent")}>
                        AI সহকারী চালু করুন <ArrowRight />
                      </Button>
                      {apiReady === null && (
                        <p className="flex items-center justify-center gap-2 text-center text-sm text-slate-500" role="status">
                          <Spinner small /> সিস্টেম প্রস্তুত হচ্ছে — আপনি এগিয়ে যেতে পারেন
                        </p>
                      )}
                      {apiReady === true && (
                        <p className="flex items-center justify-center gap-2 text-sm text-emerald-700" role="status">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> সিস্টেম প্রস্তুত
                        </p>
                      )}
                      {apiReady === false && (
                        <Notice
                          tone="warn"
                          action={
                            <Button size="sm" variant="secondary" onClick={retryWake}>
                              <RefreshCw size={16} /> আবার চেষ্টা
                            </Button>
                          }
                        >
                          সার্ভারে সংযোগ হচ্ছে না। ইন্টারনেট ঠিক আছে কিনা দেখে আবার চেষ্টা করুন।
                        </Notice>
                      )}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* ---------- সম্মতি ---------- */}
            {phase === "consent" && (
              <Card className="space-y-5 animate-slide-up">
                <div>
                  <h2 className="text-xl font-bold">শুরু করার আগে জেনে নিন</h2>
                  <p className="mt-1 text-sm text-slate-500">অনুগ্রহ করে পড়ে সম্মতি দিন</p>
                </div>
                <ul className="space-y-3">
                  {CONSENT_POINTS_BN.map((p) => (
                    <li key={p} className="flex gap-3 leading-relaxed text-slate-700">
                      <CheckCircle size={20} className="mt-0.5 shrink-0 text-brand-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button size="xl" block onClick={() => go("demographics")}>
                    <Check /> রাজি আছি, শুরু করুন
                  </Button>
                  <Button size="lg" variant="ghost" block onClick={() => go("declined")}>
                    রাজি নই
                  </Button>
                </div>
              </Card>
            )}

            {phase === "declined" && (
              <Card className="space-y-4 text-center animate-slide-up">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <User size={26} />
                </span>
                <p className="text-lg font-semibold">ঠিক আছে, কোনো অসুবিধা নেই</p>
                <p className="text-slate-600">আপনি স্বাভাবিক নিয়মেই ডাক্তার দেখাতে পারবেন।</p>
                <Button variant="secondary" onClick={() => go("intro")}>
                  <ArrowLeft size={18} /> ফিরে যান
                </Button>
              </Card>
            )}

            {/* ---------- বয়স ও লিঙ্গ ---------- */}
            {phase === "demographics" && (
              <Card className="space-y-6 animate-slide-up">
                <div>
                  <label htmlFor="age" className="mb-2 block text-lg font-semibold">
                    রোগীর বয়স
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="age"
                      inputMode="numeric"
                      autoComplete="off"
                      value={age}
                      onChange={(e) => setAge(e.target.value.replace(/[^0-9০-৯]/g, ""))}
                      maxLength={3}
                      placeholder="৫২"
                      className="h-16 w-32 rounded-2xl border border-slate-300 bg-white text-center text-3xl font-bold tabular-nums focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                    <span className="text-lg text-slate-600">বছর</span>
                  </div>
                </div>
                <fieldset>
                  <legend className="mb-2 block text-lg font-semibold">লিঙ্গ</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        ["male", "পুরুষ"],
                        ["female", "মহিলা"],
                        ["other", "অন্যান্য"],
                      ] as [Sex, string][]
                    ).map(([v, label]) => {
                      const on = sex === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setSex(v)}
                          className={cx(
                            "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-lg font-semibold transition-colors",
                            on ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                          )}
                        >
                          {on && <Check size={18} />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Lock size={16} /> নাম বা ফোন নম্বর লাগবে না।
                </p>
                <Button size="xl" block onClick={startInterview} loading={busy}>
                  প্রশ্ন শুরু করুন <ArrowRight />
                </Button>
              </Card>
            )}

            {/* ---------- প্রশ্নোত্তর ---------- */}
            {inInterview && step && saved && (
              <>
                {step.type === "question" && (
                  <Card className="overflow-hidden animate-fade-in" padded={false}>
                    <div className="space-y-3 p-4 sm:p-5" aria-live="polite">
                      {history.slice(-7, -1).map((h, i) => (
                        <Bubble key={i} role={h.role}>
                          {h.text}
                        </Bubble>
                      ))}
                      <Bubble role="assistant" strong>
                        <span>{step.question.textBn}</span>
                        {(step.question.audioUrl || bnVoice) && (
                          <button
                            type="button"
                            onClick={() => speak(step.question)}
                            className="ml-2 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm"
                            aria-label="প্রশ্নটি শুনুন"
                          >
                            <Volume size={18} />
                          </button>
                        )}
                      </Bubble>
                      {step.question.hintBn && <p className="pl-9 text-sm text-slate-500">{step.question.hintBn}</p>}
                      <div ref={threadEnd} />
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                      <AnswerInput
                        key={step.question.id}
                        audioAllowed={step.question.audioAllowed ?? false}
                        busy={busy}
                        onSubmit={onAnswer}
                      />
                    </div>
                  </Card>
                )}

                {step.type === "comorbidities" && (
                  <Card className="space-y-5 animate-slide-up">
                    <div>
                      <h2 className="text-xl font-bold">আগে থেকে কোনো রোগ আছে কি?</h2>
                      <p className="mt-1 text-sm text-slate-500">যেগুলো আছে সেগুলোতে চাপুন — একাধিক বাছতে পারেন</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {COMORBIDITIES.filter((c) => !c.femaleOnly || sex === "female" || sex === null).map((c) => {
                        const on = comorbid.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setComorbid((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                            className={cx(
                              "flex min-h-14 items-center gap-2.5 rounded-2xl border-2 px-3 text-left text-[15px] font-semibold leading-snug transition-colors",
                              on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                            )}
                          >
                            <span
                              className={cx(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                                on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white",
                              )}
                            >
                              {on && <Check size={16} strokeWidth={3} />}
                            </span>
                            {c.bn}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      size="xl"
                      block
                      loading={busy}
                      onClick={() =>
                        void respond(
                          { type: "comorbidities", items: comorbid },
                          comorbid.length ? `আগের রোগ: ${numBn(comorbid.length)}টি` : "আগের কোনো রোগ নেই",
                        )
                      }
                    >
                      {comorbid.length ? `পরের ধাপ (${numBn(comorbid.length)}টি বাছাই)` : "এর কোনোটিই নেই"} <ArrowRight />
                    </Button>
                  </Card>
                )}

                {step.type === "photos" && (
                  <Card className="animate-slide-up">
                    <PhotoUploader
                      visitId={saved.visitId}
                      secret={saved.secret}
                      busy={busy}
                      onDone={(ids) =>
                        void respond({ type: "photos", uploadIds: ids }, ids.length ? `${numBn(ids.length)}টি ছবি দেওয়া হয়েছে` : undefined)
                      }
                    />
                  </Card>
                )}

                {step.type === "done" && code && (
                  <Card className="space-y-6 text-center animate-slide-up">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle size={36} />
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold">ধন্যবাদ!</h2>
                      <p className="mt-1 text-slate-600">আপনার তথ্য ডাক্তারের কাছে পৌঁছে গেছে।</p>
                    </div>
                    <div className="relative mx-auto max-w-sm rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-5">
                      <p className="text-sm font-semibold text-brand-800">আপনার রোগী-কোড</p>
                      <p className="mt-1 font-mono text-[40px] font-bold leading-none tracking-[0.15em] text-brand-900">{code.en}</p>
                      <p className="mt-2 text-xl font-semibold text-brand-800">{code.bn}</p>
                    </div>
                    <ul className="mx-auto max-w-sm space-y-2 text-left text-[15px] text-slate-700">
                      <li className="flex gap-2.5">
                        <MessageSquare size={18} className="mt-0.5 shrink-0 text-brand-600" />
                        ডাক্তার ডাকলে এই কোডটি বলবেন।
                      </li>
                      <li className="flex gap-2.5">
                        <Phone size={18} className="mt-0.5 shrink-0 text-brand-600" />
                        কোডটি মনে না থাকলে এই পেজের স্ক্রিনশট নিয়ে রাখুন।
                      </li>
                    </ul>
                    <Button variant="secondary" size="lg" block onClick={newPatient}>
                      এই ফোনে আরেকজন রোগী শুরু করুন
                    </Button>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        <footer className="space-y-2 pt-2 text-center text-xs leading-relaxed text-slate-500">
          <p>{DEMO_DATA_NOTICE_BN}</p>
          <p>
            এই AI সহকারী ডাক্তার নয়। জরুরি প্রয়োজনে{" "}
            <a href="tel:999" className="font-semibold text-red-600 underline underline-offset-2">
              ৯৯৯
            </a>{" "}
            নম্বরে কল করুন। ·{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              গোপনীয়তা
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
