"use client";

import { useEffect, useState } from "react";
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
import { Button, Card, FullPageSpinner, Notice, Spinner } from "@/components/ui";
import { api, ApiError, wakeApi } from "@/lib/api";
import { codeBoth, cx } from "@/lib/format";
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
        | { full_name: string; specialty: string | null; chamber_name: string | null; chamber_address: string | null; is_open: boolean }
        | undefined;
      if (!r) return null;
      return {
        fullName: r.full_name,
        specialty: r.specialty,
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
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) return setError("সঠিক বয়স লিখুন (০–১২০)।");
    if (!sex) return setError("লিঙ্গ বেছে নিন।");
    setBusy(true);
    setError(null);
    try {
      const res = await api<StartVisitResponse>("/api/visits/start", {
        body: { slug, consentVersion: CONSENT_VERSION, ageYears: ageNum, sex },
        timeoutMs: 100_000,
      });
      const s: Saved = { visitId: res.visitId, secret: res.sessionSecret, code: res.patientCode, date: todayInDhaka() };
      localStorage.setItem(key(slug), JSON.stringify(s));
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
    void respond({ type: "answer", questionId: step.question.id, ...a }, a.text ?? "🎙️ (ভয়েস উত্তর)");
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
    setError(null);
    setPhase("intro");
  }

  // ------------------------------------------------------------------ render
  if (phase === "loading") return <FullPageSpinner label="লোড হচ্ছে…" />;
  if (phase === "notfound")
    return (
      <main className="mx-auto max-w-lg p-4">
        <Notice tone="error">এই লিংকের কোনো ডাক্তার পাওয়া যায়নি। চেম্বারের QR আবার স্ক্যান করুন।</Notice>
      </main>
    );

  const code = saved ? codeBoth(saved.code) : null;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4 pb-16">
      <header className="pt-2">
        <p className="text-sm text-slate-500">ChamberTriage AI</p>
        <h1 className="text-2xl font-bold text-teal-900">{doctor?.fullName}</h1>
        {(doctor?.specialty || doctor?.chamberName) && (
          <p className="text-slate-600">{[doctor?.specialty, doctor?.chamberName].filter(Boolean).join(" · ")}</p>
        )}
      </header>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{DEMO_DATA_NOTICE_BN}</p>

      {code && (
        <Card className="border-teal-300 bg-teal-50 text-center">
          <p className="text-sm text-teal-900">আপনার রোগী-কোড — ডাক্তারকে এটি বলবেন</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-teal-900">{code.en}</p>
          <p className="text-xl font-semibold text-teal-800">{code.bn}</p>
          <p className="mt-1 text-xs text-teal-700">স্ক্রিনশট নিয়ে রাখুন</p>
        </Card>
      )}

      {redFlag && (
        <Notice tone={redFlag.level === "emergency" ? "danger" : "warn"}>
          <p className="text-lg font-semibold">{redFlag.messageBn}</p>
        </Notice>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {phase === "intro" && (
        <Card className="space-y-4">
          {!doctor?.isOpen ? (
            <Notice tone="warn">এই মুহূর্তে ডাক্তারের AI সহকারী চালু নেই। চেম্বারের সহকারীর সাথে কথা বলুন।</Notice>
          ) : (
            <>
              <p className="text-lg">
                ডাক্তার দেখানোর আগে আমাদের AI সহকারী আপনার সমস্যা নিয়ে কয়েকটি ছোট প্রশ্ন করবে। এতে ডাক্তার আপনাকে আরও ভালোভাবে
                সময় দিতে পারবেন।
              </p>
              <Button size="lg" className="w-full" onClick={() => setPhase("consent")} disabled={apiReady === null}>
                🤖 AI সহকারী চালু করুন
              </Button>
              {apiReady === null && (
                <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Spinner small /> সিস্টেম চালু হচ্ছে… (প্রথমবার ৩০–৬০ সেকেন্ড লাগতে পারে)
                </p>
              )}
              {apiReady === false && (
                <Notice tone="warn">
                  সার্ভারে সংযোগ হচ্ছে না। একটু পরে পেজটি রিফ্রেশ করুন।
                </Notice>
              )}
            </>
          )}
        </Card>
      )}

      {phase === "consent" && (
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">শুরু করার আগে</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            {CONSENT_POINTS_BN.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={() => setPhase("demographics")}>
              ✅ রাজি আছি
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => setPhase("declined")}>
              রাজি নই
            </Button>
          </div>
        </Card>
      )}

      {phase === "declined" && (
        <Card className="space-y-3">
          <p className="text-lg">ঠিক আছে। আপনি স্বাভাবিক নিয়মেই ডাক্তার দেখাতে পারবেন — কোনো অসুবিধা নেই।</p>
          <Button variant="secondary" onClick={() => setPhase("intro")}>
            ফিরে যান
          </Button>
        </Card>
      )}

      {phase === "demographics" && (
        <Card className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-lg font-semibold">রোগীর বয়স (বছর)</span>
            <input
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              maxLength={3}
              placeholder="যেমন: ৫২"
              className="w-40 rounded-xl border border-slate-300 p-3 text-2xl focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100"
            />
          </label>
          <div>
            <span className="mb-2 block text-lg font-semibold">লিঙ্গ</span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["male", "পুরুষ"],
                  ["female", "মহিলা"],
                  ["other", "অন্যান্য"],
                ] as [Sex, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSex(v)}
                  className={cx(
                    "tap rounded-xl border text-lg font-semibold",
                    sex === v ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500">নাম বা ফোন নম্বর লাগবে না।</p>
          <Button size="lg" className="w-full" onClick={startInterview} loading={busy}>
            শুরু করুন ➜
          </Button>
        </Card>
      )}

      {phase === "interview" && step && saved && (
        <>
          {step.type === "question" && (
            <>
              {history.length > 1 && (
                <div className="space-y-2">
                  {history.slice(-5, -1).map((h, i) => (
                    <div
                      key={i}
                      className={cx(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        h.role === "assistant" ? "bg-white text-slate-700" : "ml-auto bg-teal-100 text-teal-900",
                      )}
                    >
                      {h.text}
                    </div>
                  ))}
                </div>
              )}
              <Card className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-semibold leading-relaxed">{step.question.textBn}</p>
                  {(step.question.audioUrl || bnVoice) && (
                    <button
                      type="button"
                      onClick={() => speak(step.question)}
                      className="rounded-full bg-slate-100 px-3 py-2 text-lg"
                      aria-label="প্রশ্নটি শুনুন"
                    >
                      🔊
                    </button>
                  )}
                </div>
                {step.question.hintBn && <p className="text-sm text-slate-500">{step.question.hintBn}</p>}
                <AnswerInput
                  key={step.question.id}
                  audioAllowed={step.question.audioAllowed ?? false}
                  busy={busy}
                  onSubmit={onAnswer}
                />
              </Card>
            </>
          )}

          {step.type === "comorbidities" && (
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold">নিচের কোনো সমস্যা আগে থেকে আছে কি? (যেগুলো আছে সেগুলোতে চাপুন)</h2>
              <div className="grid grid-cols-2 gap-2">
                {COMORBIDITIES.filter((c) => !c.femaleOnly || sex === "female" || sex === null).map((c) => {
                  const on = comorbid.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setComorbid((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                      className={cx(
                        "tap rounded-xl border px-3 text-left text-base font-medium",
                        on ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white",
                      )}
                    >
                      {on ? "✓ " : ""}
                      {c.bn}
                    </button>
                  );
                })}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={busy}
                onClick={() =>
                  void respond(
                    { type: "comorbidities", items: comorbid },
                    comorbid.length ? `আগের রোগ: ${comorbid.length}টি` : "আগের কোনো রোগ নেই",
                  )
                }
              >
                {comorbid.length ? "পরের ধাপ ➜" : "এর কোনোটিই নেই ➜"}
              </Button>
            </Card>
          )}

          {step.type === "photos" && (
            <Card>
              <PhotoUploader
                visitId={saved.visitId}
                secret={saved.secret}
                busy={busy}
                onDone={(ids) => void respond({ type: "photos", uploadIds: ids }, ids.length ? `${ids.length}টি ছবি দেওয়া হয়েছে` : undefined)}
              />
            </Card>
          )}

          {step.type === "done" && (
            <Card className="space-y-4 text-center">
              <p className="text-4xl">✅</p>
              <h2 className="text-2xl font-bold">ধন্যবাদ!</h2>
              <p className="text-lg">
                আপনার তথ্য ডাক্তারের কাছে পাঠানো হয়েছে। ডাক্তার ডাকলে উপরের <b>রোগী-কোডটি</b> বলবেন।
              </p>
              <Button variant="secondary" onClick={newPatient}>
                এই ফোনে আরেকজন রোগী শুরু করুন
              </Button>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
