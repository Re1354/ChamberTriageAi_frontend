import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const SexSchema = z.enum(["male", "female", "other"]);
export type Sex = z.infer<typeof SexSchema>;

export const CategorySchema = z.enum(["cardio", "gastro", "neuro", "resp", "fever", "msk", "general"]);
export type Category = z.infer<typeof CategorySchema>;

export const RedFlagLevelSchema = z.enum(["none", "urgent", "emergency"]);
export type RedFlagLevel = z.infer<typeof RedFlagLevelSchema>;

export const AiModeSchema = z.enum(["standard", "lean", "economy", "no_ai"]);
export type AiMode = z.infer<typeof AiModeSchema>;

export const VisitStatusSchema = z.enum(["started", "interviewing", "finishing", "completed", "seen", "abandoned"]);
export type VisitStatus = z.infer<typeof VisitStatusSchema>;

export const UploadKindSchema = z.enum(["medicine", "lab_report", "prescription", "other"]);
export type UploadKind = z.infer<typeof UploadKindSchema>;

export const SttSourceSchema = z.enum(["web_speech", "typed", "audio"]);
export type SttSource = z.infer<typeof SttSourceSchema>;

// ---------------------------------------------------------------------------
// Patient flow (public API)
// ---------------------------------------------------------------------------
export const StartVisitBodySchema = z.object({
  slug: z.string().min(3).max(40),
  consentVersion: z.string().min(1).max(30),
  ageYears: z.number().int().min(0).max(120),
  sex: SexSchema,
});
export type StartVisitBody = z.infer<typeof StartVisitBodySchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  textBn: z.string(),
  hintBn: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  audioAllowed: z.boolean().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const StepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("question"), question: QuestionSchema }),
  z.object({ type: z.literal("comorbidities") }),
  z.object({ type: z.literal("photos") }),
  z.object({ type: z.literal("done") }),
]);
export type Step = z.infer<typeof StepSchema>;

export const RedFlagNoticeSchema = z.object({
  level: z.enum(["urgent", "emergency"]),
  messageBn: z.string(),
});
export type RedFlagNotice = z.infer<typeof RedFlagNoticeSchema>;

export const RespondBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("answer"),
    questionId: z.string().max(60),
    text: z.string().max(3000).optional(),
    audioB64: z.string().max(8_000_000).optional(),
    mimeType: z.string().max(80).optional(),
    sttSource: SttSourceSchema,
  }),
  z.object({
    type: z.literal("comorbidities"),
    items: z.array(z.string().max(40)).max(20),
  }),
  z.object({
    type: z.literal("photos"),
    uploadIds: z.array(z.string().uuid()).max(10),
  }),
]);
export type RespondBody = z.infer<typeof RespondBodySchema>;

export const UploadUrlBodySchema = z.object({
  kind: UploadKindSchema,
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
export type UploadUrlBody = z.infer<typeof UploadUrlBodySchema>;

// ---------------------------------------------------------------------------
// Doctor / admin API bodies
// ---------------------------------------------------------------------------
export const ChamberToggleBodySchema = z.object({ isOpen: z.boolean() });

export const SlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও - ব্যবহার করুন");

export const CreateDoctorBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(120),
  specialty: z.string().max(120).optional().default(""),
  qualifications: z.string().max(240).optional().default(""),
  chamberName: z.string().max(160).optional().default(""),
  chamberAddress: z.string().max(240).optional().default(""),
  slug: SlugSchema,
  dailyAiLimit: z.number().int().min(0).max(100000).optional(),
});
export type CreateDoctorBody = z.infer<typeof CreateDoctorBodySchema>;

export const ResetPasswordBodySchema = z.object({ password: z.string().min(8).max(72) });

export const UpdateDoctorBodySchema = z.object({
  isActive: z.boolean().optional(),
  dailyAiLimit: z.number().int().min(0).max(100000).optional(),
  fullName: z.string().min(2).max(120).optional(),
  specialty: z.string().max(120).optional(),
  qualifications: z.string().max(240).optional(),
  chamberName: z.string().max(160).optional(),
  chamberAddress: z.string().max(240).optional(),
});

/** ডাক্তার নিজের প্রোফাইল (নাম/লিংক বাদে) বদলাতে পারেন */
export const UpdateOwnProfileBodySchema = z.object({
  specialty: z.string().max(120),
  qualifications: z.string().max(240),
  chamberName: z.string().max(160),
  chamberAddress: z.string().max(240),
});
export type UpdateOwnProfileBody = z.infer<typeof UpdateOwnProfileBodySchema>;

// ---------------------------------------------------------------------------
// LLM output schemas (lenient: defaults so that small omissions do not fail)
// ---------------------------------------------------------------------------
export const SlotFillSchema = z.object({
  name: z.string(),
  value: z.string().nullable().default(null),
  evidence: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type SlotFill = z.infer<typeof SlotFillSchema>;

export const TurnResultSchema = z.object({
  transcriptBn: z.string().nullable().default(null),
  chiefComplaintBn: z.string().nullable().default(null),
  chiefComplaintEn: z.string().nullable().default(null),
  category: CategorySchema.nullable().default(null),
  durationDays: z.number().nullable().default(null),
  slots: z.array(SlotFillSchema).default([]),
  flags: z.array(z.string()).default([]),
  medicationsMentioned: z.array(z.string()).default([]),
  suggestedNextQuestionId: z.string().nullable().default(null),
  needsClarification: z.boolean().default(false),
  clarificationQuestionBn: z.string().nullable().default(null),
});
export type TurnResult = z.infer<typeof TurnResultSchema>;

export const EvidenceSchema = z.object({
  source: z.enum(["message", "upload", "checkbox"]),
  refId: z.string(),
  quote: z.string().nullable().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const SummaryItemSchema = z.object({
  text: z.string(),
  evidence: z.array(EvidenceSchema).default([]),
});
export type SummaryItem = z.infer<typeof SummaryItemSchema>;

export const MedicineSchema = z.object({
  brand: z.string().nullable().default(null),
  generic: z.string().nullable().default(null),
  strength: z.string().nullable().default(null),
  dosageForm: z.string().nullable().default(null),
  uploadId: z.string().nullable().default(null),
  genericSource: z.enum(["label", "kb", "patient", "unknown"]).default("unknown"),
});
export type Medicine = z.infer<typeof MedicineSchema>;

export const LabValueSchema = z.object({
  name: z.string(),
  value: z.number().nullable().default(null),
  valueText: z.string().nullable().default(null),
  unit: z.string().nullable().default(null),
  refLow: z.number().nullable().default(null),
  refHigh: z.number().nullable().default(null),
  reportDate: z.string().nullable().default(null),
  uploadId: z.string().nullable().default(null),
  flag: z.enum(["high", "low", "normal", "unknown"]).default("unknown"),
});
export type LabValue = z.infer<typeof LabValueSchema>;

export const SummaryLlmSchema = z.object({
  chiefComplaint: SummaryItemSchema,
  duration: z.string().nullable().default(null),
  hpi: z.array(SummaryItemSchema).default([]),
  redFlags: z.array(SummaryItemSchema).default([]),
  comorbidities: z.array(SummaryItemSchema).default([]),
  medications: z.array(MedicineSchema).default([]),
  labs: z.array(LabValueSchema).default([]),
  consider: z.array(SummaryItemSchema).default([]),
  patientQuotes: z.array(z.string()).default([]),
  dataGaps: z.array(z.string()).default([]),
});
export type SummaryLlm = z.infer<typeof SummaryLlmSchema>;

export const SummaryCardSchema = SummaryLlmSchema.extend({
  generatedBy: z.enum(["ai", "rules"]),
  verifyOk: z.boolean(),
  verifyIssues: z.array(z.string()).default([]),
});
export type SummaryCard = z.infer<typeof SummaryCardSchema>;
