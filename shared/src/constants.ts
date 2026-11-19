import type { AiMode, Category, RedFlagLevel, UploadKind, VisitStatus } from "./schemas";

export const CONSENT_VERSION = "2026-11-v1";

/** রোগীকে দেখানো সম্মতির পয়েন্টগুলো */
export const CONSENT_POINTS_BN: readonly string[] = [
  "এই AI সহকারী আপনার সমস্যা নিয়ে কয়েকটি প্রশ্ন করবে — এটি ডাক্তার নয়, কোনো চিকিৎসা-পরামর্শ দেবে না।",
  "আপনার উত্তর, বয়স, লিঙ্গ এবং আপনি যে ছবি দেবেন (ওষুধের পাতা, রিপোর্ট) — শুধু এগুলো নেওয়া হবে। নাম বা ফোন নম্বর লাগবে না।",
  "তথ্যগুলো একটি AI সেবা (Google Gemini) দিয়ে দেশের বাইরের সার্ভারে প্রসেস হয়।",
  "এই চেম্বারের ডাক্তার আপনার তথ্য দেখবেন। আপনার রোগী-কোড দিয়ে সার্চ করলে এই সিস্টেমের অন্য নিবন্ধিত ডাক্তারও দেখতে পারেন।",
  "ছবি ১৪ দিন পর স্বয়ংক্রিয়ভাবে মুছে যায়।",
  "রাজি না হলেও আপনি স্বাভাবিকভাবে ডাক্তার দেখাতে পারবেন।",
];

export const DEMO_DATA_NOTICE_BN =
  "এটি একটি ডেমো সংস্করণ। অনুগ্রহ করে আসল ব্যক্তিগত তথ্য দেবেন না।";

export const COMORBIDITIES: readonly { id: string; bn: string; en: string; femaleOnly?: boolean }[] = [
  { id: "diabetes", bn: "ডায়াবেটিস (সুগার)", en: "Diabetes" },
  { id: "hypertension", bn: "উচ্চ রক্তচাপ (প্রেশার)", en: "Hypertension" },
  { id: "heart", bn: "হৃদরোগ", en: "Heart disease" },
  { id: "kidney", bn: "কিডনির রোগ", en: "Chronic kidney disease" },
  { id: "asthma_copd", bn: "অ্যাজমা / হাঁপানি", en: "Asthma / COPD" },
  { id: "thyroid", bn: "থাইরয়েড", en: "Thyroid disorder" },
  { id: "stroke", bn: "আগে স্ট্রোক হয়েছিল", en: "Previous stroke" },
  { id: "liver", bn: "লিভারের রোগ", en: "Liver disease" },
  { id: "smoker", bn: "ধূমপান করি", en: "Smoker" },
  { id: "pregnant", bn: "গর্ভবতী", en: "Pregnant", femaleOnly: true },
];

export const COMORBIDITY_IDS = COMORBIDITIES.map((c) => c.id);

export const CATEGORY_LABELS: Record<Category, { bn: string; en: string }> = {
  cardio: { bn: "হৃদযন্ত্র/বুক", en: "Cardiovascular" },
  gastro: { bn: "পেট/হজম", en: "Gastrointestinal" },
  neuro: { bn: "মাথা/স্নায়ু", en: "Neurological" },
  resp: { bn: "শ্বাসতন্ত্র", en: "Respiratory" },
  fever: { bn: "জ্বর", en: "Fever" },
  msk: { bn: "হাড়-জোড়া/মাংসপেশি", en: "Musculoskeletal" },
  general: { bn: "সাধারণ", en: "General" },
};

export const STATUS_LABELS_BN: Record<VisitStatus, string> = {
  started: "শুরু হয়েছে",
  interviewing: "চলছে",
  finishing: "সামারি তৈরি হচ্ছে",
  completed: "প্রস্তুত",
  seen: "দেখা হয়েছে",
  abandoned: "অসম্পূর্ণ",
};

export const RED_FLAG_LABELS_BN: Record<RedFlagLevel, string> = {
  none: "",
  urgent: "জরুরি",
  emergency: "অতি জরুরি",
};

export const AI_MODE_LABELS_BN: Record<AiMode, string> = {
  standard: "পূর্ণ AI",
  lean: "সাশ্রয়ী AI",
  economy: "প্রশ্ন-ব্যাংক + AI সামারি",
  no_ai: "AI ছাড়া",
};

export const UPLOAD_KIND_LABELS_BN: Record<UploadKind, string> = {
  medicine: "ওষুধের পাতা/বক্স",
  lab_report: "ল্যাব রিপোর্ট",
  prescription: "আগের প্রেসক্রিপশন",
  other: "অন্যান্য",
};

export const PATIENT_MESSAGES_BN = {
  emergency:
    "⚠️ আপনার বলা কিছু লক্ষণে দ্রুত ডাক্তার দেখানো দরকার হতে পারে। অনুগ্রহ করে এখনই চেম্বারের সহকারীকে জানান।",
  urgent:
    "আপনার তথ্য ডাক্তারকে আগেভাগে জানানো হয়েছে। অনুগ্রহ করে চেম্বারের সহকারীকেও একবার জানিয়ে রাখুন।",
} as const;

export const MAX_UPLOADS_PER_VISIT = 8;
export const MAX_AUDIO_SECONDS = 60;
