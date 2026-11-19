const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** "৪৮২৭৩১" → "482731" */
export function bnToEnDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** "482731" → "৪৮২৭৩১" */
export function enToBnDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export const PATIENT_CODE_LENGTH = 6;
export const PATIENT_CODE_REGEX = /^[0-9]{6}$/;

/** ডাক্তার যেভাবেই লিখুন ("৪৮২ ৭৩১", "482-731") → "482731" */
export function normalizePatientCode(input: string): string {
  return bnToEnDigits(input).replace(/\D/g, "");
}

/** "482731" → "482 731" (পড়তে ও বলতে সহজ) */
export function formatPatientCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

/** বাংলাদেশ সময়ে আজকের তারিখ, YYYY-MM-DD */
export function todayInDhaka(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
