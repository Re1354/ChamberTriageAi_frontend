"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DEGREE_SUGGESTIONS } from "@chamberai/shared";
import { useAuth } from "@/components/AuthProvider";
import { Eye, EyeOff, KeyRound, LogOut, User } from "@/components/icons";
import { Avatar, Button, Card, CardHeader, IconButton, Input, Notice, PageHeader } from "@/components/ui";
import { ApiError, authedApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SPECIALTIES = [
  "মেডিসিন বিশেষজ্ঞ",
  "হৃদরোগ বিশেষজ্ঞ",
  "শিশু বিশেষজ্ঞ",
  "গাইনি ও প্রসূতি বিশেষজ্ঞ",
  "নিউরোলজি বিশেষজ্ঞ",
  "গ্যাস্ট্রোএন্টারোলজি বিশেষজ্ঞ",
  "বক্ষব্যাধি বিশেষজ্ঞ",
  "অর্থোপেডিক্স বিশেষজ্ঞ",
  "ডায়াবেটিস ও হরমোন বিশেষজ্ঞ",
  "সাধারণ চিকিৎসক (জিপি)",
];

export default function SettingsPage() {
  const { me, refresh, signOut } = useAuth();
  const doctor = me!.doctor!;
  const router = useRouter();

  const [profile, setProfile] = useState({
    specialty: doctor.specialty ?? "",
    qualifications: doctor.qualifications ?? "",
    chamberName: doctor.chamberName ?? "",
    chamberAddress: doctor.chamberAddress ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setProfile({
      specialty: doctor.specialty ?? "",
      qualifications: doctor.qualifications ?? "",
      chamberName: doctor.chamberName ?? "",
      chamberAddress: doctor.chamberAddress ?? "",
    });
  }, [doctor.specialty, doctor.qualifications, doctor.chamberName, doctor.chamberAddress]);

  const setP = (k: keyof typeof profile) => (e: { target: { value: string } }) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await authedApi("/api/doctor/me/profile", { method: "PATCH", body: profile });
      await refresh();
      setProfileMsg({ tone: "success", text: "প্রোফাইল সেভ হয়েছে — রোগীর পেজ ও QR পোস্টারে নতুন তথ্য দেখাবে।" });
    } catch (err) {
      setProfileMsg({ tone: "error", text: err instanceof ApiError ? err.message : "সেভ হয়নি।" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ tone: "error", text: "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।" });
    if (pw !== pw2) return setMsg({ tone: "error", text: "দুটো পাসওয়ার্ড মেলেনি।" });
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase().auth.updateUser({ password: pw });
      if (error) throw new Error(error.message);
      await authedApi("/api/doctor/me/password-changed", { body: {} });
      await refresh();
      setPw("");
      setPw2("");
      setMsg({ tone: "success", text: "পাসওয়ার্ড বদলানো হয়েছে।" });
      if (doctor.mustChangePassword) router.replace("/dashboard");
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message || "পাসওয়ার্ড বদলানো যায়নি।" });
    } finally {
      setBusy(false);
    }
  }

  const eye = (
    <IconButton label={showPw ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"} onClick={() => setShowPw((s) => !s)}>
      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
    </IconButton>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="প্রোফাইল ও সেটিংস" subtitle="রোগীরা আপনার পেজ ও QR পোস্টারে এই তথ্য দেখবেন" />

      {doctor.mustChangePassword && (
        <Notice tone="warn" title="প্রথমবার লগইন করেছেন">
          নিরাপত্তার জন্য আগে নিজের নতুন পাসওয়ার্ড সেট করুন — নিচে “পাসওয়ার্ড বদলান”।
        </Notice>
      )}

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={doctor.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-slate-900">{doctor.fullName}</p>
            <p className="truncate text-sm text-slate-500">{doctor.email}</p>
            <p className="truncate font-mono text-xs text-slate-400">/d/{doctor.slug}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">নাম, ইমেইল বা লিংক বদলাতে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      </Card>

      <Card as="section">
        <CardHeader title="চেম্বার প্রোফাইল" icon={<User size={18} />} />
        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <Input label="বিশেষজ্ঞতা" value={profile.specialty} onChange={setP("specialty")} list="specialties" maxLength={120} placeholder="মেডিসিন বিশেষজ্ঞ" />
          <Input
            label="ডিগ্রি ও প্রতিষ্ঠান"
            value={profile.qualifications}
            onChange={setP("qualifications")}
            list="degrees"
            maxLength={240}
            placeholder="MBBS (ঢাকা মেডিকেল কলেজ), FCPS (মেডিসিন)"
            hint="কমা দিয়ে একাধিক ডিগ্রি লিখুন"
          />
          <Input label="চেম্বারের নাম" value={profile.chamberName} onChange={setP("chamberName")} maxLength={160} />
          <Input label="চেম্বারের ঠিকানা" value={profile.chamberAddress} onChange={setP("chamberAddress")} maxLength={240} />
          <datalist id="specialties">
            {SPECIALTIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <datalist id="degrees">
            {DEGREE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {profileMsg && (
            <div className="md:col-span-2">
              <Notice tone={profileMsg.tone}>{profileMsg.text}</Notice>
            </div>
          )}
          <div className="md:col-span-2">
            <Button type="submit" size="lg" loading={savingProfile}>
              প্রোফাইল সেভ করুন
            </Button>
          </div>
        </form>
      </Card>

      <Card as="section">
        <CardHeader title="পাসওয়ার্ড বদলান" icon={<KeyRound size={18} />} subtitle="অন্তত ৮ অক্ষর; অন্য কোথাও ব্যবহার করা পাসওয়ার্ড দেবেন না" />
        <form onSubmit={changePassword} className="max-w-md space-y-4">
          <Input
            label="নতুন পাসওয়ার্ড"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            trailing={eye}
          />
          <Input
            label="আবার লিখুন"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <Button type="submit" size="lg" loading={busy}>
            পাসওয়ার্ড সেভ করুন
          </Button>
        </form>
      </Card>

      <Card className="lg:hidden">
        <Button block size="lg" variant="secondary" onClick={() => void signOut()} className="text-red-700">
          <LogOut size={18} /> লগআউট
        </Button>
      </Card>
    </div>
  );
}
