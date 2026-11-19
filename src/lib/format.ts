import { enToBnDigits, formatPatientCode, type Sex } from "@chamberai/shared";

export function timeBn(iso: string): string {
  return new Date(iso).toLocaleTimeString("bn-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" });
}

export function dateTimeBn(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" });
}

/** "বৃহস্পতিবার, ১৯ নভেম্বর ২০২৬" */
export function dateLongBn(d: Date = new Date()): string {
  return d.toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** "YYYY-MM-DD" → "১৯ নভে, ২০২৬" */
export function isoDateBn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1, 6)).toLocaleDateString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** ঢাকার সময় অনুযায়ী সম্ভাষণ */
export function greetingBn(d: Date = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(d));
  if (h < 12) return "শুভ সকাল";
  if (h < 15) return "শুভ দুপুর";
  if (h < 18) return "শুভ বিকেল";
  return "শুভ সন্ধ্যা";
}

export function sexBn(sex: Sex | null): string {
  return sex === "male" ? "পুরুষ" : sex === "female" ? "মহিলা" : sex === "other" ? "অন্যান্য" : "—";
}

export function ageBn(age: number | null): string {
  return age === null ? "—" : `${enToBnDigits(String(age))} বছর`;
}

export function numBn(n: number | string): string {
  return enToBnDigits(String(n));
}

/** "482731" → { en: "482 731", bn: "৪৮২ ৭৩১" } */
export function codeBoth(code: string): { en: string; bn: string } {
  const en = formatPatientCode(code);
  return { en, bn: enToBnDigits(en) };
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** নামের আগে "ডা." — নামে আগে থেকেই থাকলে আবার যোগ হয় না */
export function drName(name: string): string {
  const n = name.trim();
  return /^(ডা\.?|ডাঃ|dr\.?)\s/i.test(n) ? n : `ডা. ${n}`;
}
