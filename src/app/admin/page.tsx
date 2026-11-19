"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { DEGREE_SUGGESTIONS, type AdminDoctorRow, type UsageResponse } from "@chamberai/shared";
import {
  Activity,
  Building,
  ChevronDown,
  GraduationCap,
  KeyRound,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "@/components/icons";
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Input, Notice, PageHeader, Skeleton, Stat } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { numBn } from "@/lib/format";

const EMPTY = {
  email: "",
  password: "",
  fullName: "",
  specialty: "",
  qualifications: "",
  chamberName: "",
  chamberAddress: "",
  slug: "",
};

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function AdminPage() {
  const [doctors, setDoctors] = useState<AdminDoctorRow[] | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [resetFor, setResetFor] = useState<AdminDoctorRow | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [query, setQuery] = useState("");
  const [showUsage, setShowUsage] = useState(false);

  const load = useCallback(async () => {
    const [d, u] = await Promise.all([
      authedApi<AdminDoctorRow[]>("/api/admin/doctors"),
      authedApi<UsageResponse>("/api/admin/usage"),
    ]);
    setDoctors(d);
    setUsage(u);
  }, []);

  useEffect(() => {
    void load().catch((e) => setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "লোড হয়নি।" }));
  }, [load]);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await authedApi("/api/admin/doctors", { body: { ...form, slug: form.slug.trim().toLowerCase(), email: form.email.trim() } });
      setMsg({
        tone: "success",
        text: `ডাক্তার তৈরি হয়েছে — লগইন: ${form.email.trim()} · অস্থায়ী পাসওয়ার্ড: ${form.password} (প্রথম লগইনে বদলাতে হবে)। পাসওয়ার্ডটি নিরাপদে ডাক্তারকে দিন।`,
      });
      setForm(EMPTY);
      setCreateOpen(false);
      await load();
    } catch (err) {
      const issues =
        err instanceof ApiError && Array.isArray(err.data?.issues)
          ? ` (${(err.data!.issues as { path: string }[]).map((i) => i.path).join(", ")})`
          : "";
      setFormError((err instanceof ApiError ? err.message : "তৈরি হয়নি।") + issues);
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    if (!resetFor) return;
    if (resetPw.length < 8) return setFormError("পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।");
    setBusy(true);
    setFormError(null);
    try {
      await authedApi(`/api/admin/doctors/${resetFor.id}/reset-password`, { body: { password: resetPw } });
      setMsg({ tone: "success", text: `${resetFor.fullName}-এর নতুন অস্থায়ী পাসওয়ার্ড: ${resetPw} — নিরাপদে ডাক্তারকে দিন।` });
      setResetFor(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function patch(d: AdminDoctorRow, body: Record<string, unknown>) {
    try {
      await authedApi(`/api/admin/doctors/${d.id}`, { method: "PATCH", body });
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: err instanceof ApiError ? err.message : "হয়নি।" });
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!doctors || !q) return doctors;
    return doctors.filter((d) =>
      [d.fullName, d.email, d.slug, d.specialty ?? "", d.chamberName ?? ""].some((s) => s.toLowerCase().includes(q)),
    );
  }, [doctors, query]);

  const totals = useMemo(
    () => ({
      doctors: doctors?.length ?? 0,
      active: doctors?.filter((d) => d.isActive).length ?? 0,
      open: doctors?.filter((d) => d.isOpen).length ?? 0,
      today: doctors?.reduce((s, d) => s + d.visitsToday, 0) ?? 0,
    }),
    [doctors],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="ডাক্তার ব্যবস্থাপনা"
        subtitle="ডাক্তারের অ্যাকাউন্ট তৈরি, পাসওয়ার্ড রিসেট ও AI-ব্যবহার"
        actions={
          <>
            <Link
              href="/docs"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <Activity size={18} /> সিস্টেম
            </Link>
            <Button
              onClick={() => {
                setForm({ ...EMPTY, password: randomPassword() });
                setFormError(null);
                setCreateOpen(true);
              }}
            >
              <UserPlus size={18} /> নতুন ডাক্তার
            </Button>
          </>
        }
      />

      {msg && (
        <Notice
          tone={msg.tone}
          action={
            <button type="button" onClick={() => setMsg(null)} className="self-start text-sm font-semibold underline">
              ঠিক আছে
            </button>
          }
        >
          {msg.text}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="মোট ডাক্তার" value={doctors ? numBn(totals.doctors) : "—"} icon={<Users size={18} />} tone="brand" />
        <Stat label="সক্রিয়" value={doctors ? numBn(totals.active) : "—"} icon={<Power size={18} />} tone="green" />
        <Stat label="এখন চেম্বার চালু" value={doctors ? numBn(totals.open) : "—"} icon={<Building size={18} />} tone="sky" />
        <Stat label="আজকের রোগী" value={doctors ? numBn(totals.today) : "—"} icon={<Activity size={18} />} tone="amber" />
      </div>

      {usage && (
        <Card>
          <button
            type="button"
            className="flex w-full items-center gap-3 text-left"
            onClick={() => setShowUsage((s) => !s)}
            aria-expanded={showUsage}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Sparkles size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">আজকের AI কোটা</p>
              <p className="text-sm text-slate-500">
                টার্ন {numBn(usage.remaining.turn)} / {numBn(usage.dailyLimits.turn)} · ফাইনাল {numBn(usage.remaining.final)} /{" "}
                {numBn(usage.dailyLimits.final)} বাকি
              </p>
            </div>
            <ChevronDown size={20} className={showUsage ? "rotate-180 text-slate-400 transition-transform" : "text-slate-400 transition-transform"} />
          </button>
          {showUsage && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">কোটা-দিন: {usage.quotaDay} (প্যাসিফিক সময়ে রিসেট হয়)</p>
              <div className="flex flex-wrap gap-1.5">
                {usage.visitsToday.map((v) => (
                  <Badge key={v.mode}>
                    {v.mode}: {numBn(v.count)}
                  </Badge>
                ))}
              </div>
              {usage.models.length > 0 ? (
                <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-slate-200">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2">মডেল</th>
                        <th className="px-3 py-2">কাজ</th>
                        <th className="px-3 py-2">সফল</th>
                        <th className="px-3 py-2">ব্যর্থ</th>
                        <th className="px-3 py-2">টোকেন (in/out)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.models.map((m) => (
                        <tr key={m.model + m.purpose} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs">{m.model}</td>
                          <td className="px-3 py-2">{m.purpose}</td>
                          <td className="px-3 py-2 tabular-nums">{m.calls}</td>
                          <td className="px-3 py-2 tabular-nums">{m.failed}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {m.tokensIn} / {m.tokensOut}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">আজ এখনো কোনো AI কল হয়নি।</p>
              )}
            </div>
          )}
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex-1 text-xl font-bold text-slate-900">ডাক্তারদের তালিকা</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw size={16} /> রিফ্রেশ
          </button>
        </div>
        {doctors && doctors.length > 3 && (
          <Input
            aria-label="ডাক্তার খুঁজুন"
            placeholder="নাম, ইমেইল বা চেম্বার দিয়ে খুঁজুন"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search size={18} />}
          />
        )}
        {filtered === null ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title={doctors?.length ? "কাউকে পাওয়া যায়নি" : "এখনো কোনো ডাক্তার নেই"}
            body={doctors?.length ? undefined : "“নতুন ডাক্তার” বোতাম দিয়ে প্রথম ডাক্তারের অ্যাকাউন্ট তৈরি করুন।"}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((d) => (
              <Card key={d.id} className={d.isActive ? undefined : "opacity-70"}>
                <div className="flex items-start gap-3">
                  <Avatar name={d.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{d.fullName}</p>
                    {d.specialty && <p className="truncate text-sm font-medium text-brand-700">{d.specialty}</p>}
                    {d.qualifications && (
                      <p className="mt-1 flex gap-1.5 text-xs text-slate-500">
                        <GraduationCap size={14} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{d.qualifications}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={d.isActive ? "green" : "red"} dot>
                    {d.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </Badge>
                  {d.isOpen && <Badge tone="sky">চেম্বার চালু</Badge>}
                  {d.mustChangePassword && <Badge tone="amber">পাসওয়ার্ড বদলাননি</Badge>}
                  <Badge>আজ {numBn(d.visitsToday)} রোগী</Badge>
                </div>
                <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-slate-500">ইমেইল</dt>
                    <dd className="min-w-0 truncate text-slate-800">{d.email}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-slate-500">লিংক</dt>
                    <dd className="min-w-0 truncate font-mono text-slate-800">/d/{d.slug}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="w-16 shrink-0 text-slate-500">AI-সীমা</dt>
                    <dd>
                      <input
                        type="number"
                        inputMode="numeric"
                        defaultValue={d.dailyAiLimit}
                        min={0}
                        aria-label={`${d.fullName}-এর দৈনিক AI-সীমা`}
                        className="h-9 w-24 rounded-lg border border-slate-300 px-2 tabular-nums focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n >= 0 && n !== d.dailyAiLimit) void patch(d, { dailyAiLimit: n });
                        }}
                      />
                      <span className="ml-2 text-xs text-slate-500">রোগী/দিন</span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setResetFor(d);
                      setResetPw(randomPassword());
                      setFormError(null);
                    }}
                  >
                    <KeyRound size={16} /> পাসওয়ার্ড রিসেট
                  </Button>
                  <Button variant={d.isActive ? "ghost" : "soft"} size="sm" className={d.isActive ? "text-red-700" : undefined} onClick={() => void patch(d, { isActive: !d.isActive })}>
                    <Power size={16} /> {d.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---------- নতুন ডাক্তার ---------- */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="নতুন ডাক্তার যোগ করুন"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" form="create-doctor" loading={busy}>
              <UserPlus size={18} /> অ্যাকাউন্ট তৈরি করুন
            </Button>
          </>
        }
      >
        <form id="create-doctor" onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="পূর্ণ নাম *" value={form.fullName} onChange={set("fullName")} placeholder="ডা. আব্দুর রহমান" required />
          </div>
          <Input label="বিশেষজ্ঞতা" value={form.specialty} onChange={set("specialty")} placeholder="মেডিসিন বিশেষজ্ঞ" />
          <Input
            label="ডিগ্রি ও প্রতিষ্ঠান"
            value={form.qualifications}
            onChange={set("qualifications")}
            list="admin-degrees"
            placeholder="MBBS (DMC), FCPS (মেডিসিন)"
          />
          <datalist id="admin-degrees">
            {DEGREE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Input label="চেম্বারের নাম" value={form.chamberName} onChange={set("chamberName")} />
          <Input label="চেম্বারের ঠিকানা" value={form.chamberAddress} onChange={set("chamberAddress")} />
          <Input
            label="লিংক-নাম (slug) *"
            value={form.slug}
            onChange={set("slug")}
            placeholder="dr-rahman"
            autoCapitalize="none"
            spellCheck={false}
            hint="QR লিংক হবে /d/<slug> — ছোট হাতের ইংরেজি, সংখ্যা ও -"
            required
          />
          <Input
            label="ইমেইল (লগইন) *"
            type="email"
            autoCapitalize="none"
            spellCheck={false}
            value={form.email}
            onChange={set("email")}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="অস্থায়ী পাসওয়ার্ড *"
              value={form.password}
              onChange={set("password")}
              hint="অন্তত ৮ অক্ষর; ডাক্তার প্রথম লগইনে বদলাবেন"
              className="font-mono"
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}
                  className="mr-1 inline-flex h-10 items-center rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  নতুন
                </button>
              }
            />
          </div>
          {formError && (
            <div className="sm:col-span-2">
              <Notice tone="error">{formError}</Notice>
            </div>
          )}
        </form>
      </Dialog>

      {/* ---------- পাসওয়ার্ড রিসেট ---------- */}
      <Dialog
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title="পাসওয়ার্ড রিসেট"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetFor(null)}>
              বাতিল
            </Button>
            <Button onClick={() => void doReset()} loading={busy}>
              <KeyRound size={18} /> রিসেট করুন
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          <b className="text-slate-900">{resetFor?.fullName}</b>-এর জন্য নতুন অস্থায়ী পাসওয়ার্ড। ডাক্তার পরে নিজে বদলে নিতে পারবেন।
        </p>
        <Input
          label="নতুন পাসওয়ার্ড"
          value={resetPw}
          onChange={(e) => setResetPw(e.target.value)}
          className="font-mono"
          trailing={
            <button
              type="button"
              onClick={() => setResetPw(randomPassword())}
              className="mr-1 inline-flex h-10 items-center rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              নতুন
            </button>
          }
        />
        {formError && <Notice tone="error">{formError}</Notice>}
      </Dialog>
    </div>
  );
}
