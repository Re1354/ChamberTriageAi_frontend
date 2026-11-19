import { enToBnDigits, formatPatientCode, type Sex } from "@chamberai/shared";

export function timeBn(iso: string): string {
  return new Date(iso).toLocaleTimeString("bn-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" });
}

export function dateTimeBn(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" });
}

export function sexBn(sex: Sex | null): string {
  return sex === "male" ? "পুরুষ" : sex === "female" ? "মহিলা" : sex === "other" ? "অন্যান্য" : "—";
}

export function ageBn(age: number | null): string {
  return age === null ? "—" : `${enToBnDigits(String(age))} বছর`;
}

/** "482731" → "482 731 (৪৮২ ৭৩১)" */
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
