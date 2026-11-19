"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminDoctorRow, UsageResponse } from "@chamberai/shared";
import { Badge, Button, Card, Input, Notice, Spinner } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";

const EMPTY = { email: "", password: "", fullName: "", specialty: "", chamberName: "", chamberAddress: "", slug: "" };

export default function AdminPage() {
  const [doctors, setDoctors] = useState<AdminDoctorRow[] | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

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
    setMsg(null);
    try {
      await authedApi("/api/admin/doctors", { body: { ...form, slug: form.slug.trim().toLowerCase(), email: form.email.trim() } });
      setMsg({
        tone: "success",
        text: `ডাক্তার তৈরি হয়েছে। লগইন: ${form.email} / অস্থায়ী পাসওয়ার্ড: ${form.password} — প্রথম লগইনে বদলাতে হবে।`,
      });
      setForm(EMPTY);
      await load();
    } catch (err) {
      const issues = err instanceof ApiError && Array.isArray(err.data?.issues) ? ` (${(err.data!.issues as { path: string }[]).map((i) => i.path).join(", ")})` : "";
      setMsg({ tone: "error", text: (err instanceof ApiError ? err.message : "তৈরি হয়নি।") + issues });
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(d: AdminDoctorRow) {
    const pw = window.prompt(`${d.fullName}-এর নতুন অস্থায়ী পাসওয়ার্ড (অন্তত ৮ অক্ষর):`);
    if (!pw) return;
    try {
      await authedApi(`/api/admin/doctors/${d.id}/reset-password`, { body: { password: pw } });
      setMsg({ tone: "success", text: `${d.fullName}-এর পাসওয়ার্ড বদলানো হয়েছে: ${pw}` });
    } catch (err) {
      setMsg({ tone: "error", text: err instanceof ApiError ? err.message : "হয়নি।" });
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

  return (
    <div className="space-y-5">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {usage && (
        <Card className="space-y-2">
          <h2 className="text-lg font-bold">আজকের AI ব্যবহার (কোটা-দিন: {usage.quotaDay}, প্যাসিফিক সময়)</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="teal">
              টার্ন-কল বাকি: {usage.remaining.turn} / {usage.dailyLimits.turn}
            </Badge>
            <Badge tone="teal">
              ফাইনাল-কল বাকি: {usage.remaining.final} / {usage.dailyLimits.final}
            </Badge>
            {usage.visitsToday.map((v) => (
              <Badge key={v.mode}>
                {v.mode}: {v.count}
              </Badge>
            ))}
          </div>
          {usage.models.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th>মডেল</th>
                  <th>কাজ</th>
                  <th>সফল</th>
                  <th>ব্যর্থ</th>
                  <th>টোকেন (in/out)</th>
                </tr>
              </thead>
              <tbody>
                {usage.models.map((m) => (
                  <tr key={m.model + m.purpose} className="border-t border-slate-100">
                    <td className="font-mono">{m.model}</td>
                    <td>{m.purpose}</td>
                    <td>{m.calls}</td>
                    <td>{m.failed}</td>
                    <td>
                      {m.tokensIn} / {m.tokensOut}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">নতুন ডাক্তার যোগ করুন</h2>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <Input label="পূর্ণ নাম *" value={form.fullName} onChange={set("fullName")} required />
          <Input label="বিশেষজ্ঞতা" value={form.specialty} onChange={set("specialty")} placeholder="মেডিসিন বিশেষজ্ঞ" />
          <Input label="চেম্বারের নাম" value={form.chamberName} onChange={set("chamberName")} />
          <Input label="চেম্বারের ঠিকানা" value={form.chamberAddress} onChange={set("chamberAddress")} />
          <Input
            label="লিংক-নাম (slug) *"
            value={form.slug}
            onChange={set("slug")}
            placeholder="dr-rahim"
            hint="QR লিংক হবে /d/<slug> — ছোট হাতের ইংরেজি, সংখ্যা ও -"
            required
          />
          <Input label="ইমেইল (লগইন) *" type="email" value={form.email} onChange={set("email")} required />
          <Input
            label="অস্থায়ী পাসওয়ার্ড *"
            value={form.password}
            onChange={set("password")}
            hint="অন্তত ৮ অক্ষর; ডাক্তার প্রথম লগইনে বদলাবেন"
            required
          />
          <div className="flex items-end">
            <Button type="submit" loading={busy} className="w-full">
              ডাক্তার তৈরি করুন
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">ডাক্তারদের তালিকা</h2>
        {doctors === null ? (
          <Spinner />
        ) : doctors.length === 0 ? (
          <p className="text-slate-500">এখনো কোনো ডাক্তার নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1">নাম</th>
                  <th>ইমেইল</th>
                  <th>লিংক</th>
                  <th>আজ</th>
                  <th>অবস্থা</th>
                  <th>দৈনিক AI-সীমা</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{d.fullName}</td>
                    <td>{d.email}</td>
                    <td className="font-mono">/d/{d.slug}</td>
                    <td>{d.visitsToday}</td>
                    <td className="space-x-1">
                      <Badge tone={d.isActive ? "green" : "red"}>{d.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                      {d.isOpen && <Badge tone="teal">চেম্বার চালু</Badge>}
                      {d.mustChangePassword && <Badge tone="amber">পাসওয়ার্ড বদলাননি</Badge>}
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={d.dailyAiLimit}
                        min={0}
                        className="w-20 rounded border border-slate-300 px-2 py-1"
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n !== d.dailyAiLimit) void patch(d, { dailyAiLimit: n });
                        }}
                      />
                    </td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button className="text-teal-700 underline" onClick={() => void resetPassword(d)}>
                        পাসওয়ার্ড রিসেট
                      </button>
                      <button
                        className={d.isActive ? "text-red-700 underline" : "text-green-700 underline"}
                        onClick={() => void patch(d, { isActive: !d.isActive })}
                      >
                        {d.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
