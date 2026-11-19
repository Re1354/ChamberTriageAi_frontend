import type {
  AiMode,
  Category,
  RedFlagLevel,
  RedFlagNotice,
  Sex,
  Step,
  SummaryCard,
  UploadKind,
  VisitStatus,
} from "./schemas";

// ---------------------------------------------------------------------------
// Public (patient) API responses
// ---------------------------------------------------------------------------
export interface DoctorPublic {
  fullName: string;
  specialty: string | null;
  qualifications: string | null;
  chamberName: string | null;
  chamberAddress: string | null;
  isOpen: boolean;
}

export interface StartVisitResponse {
  visitId: string;
  patientCode: string;
  sessionSecret: string;
  step: Step;
}

export interface RespondResponse {
  step: Step;
  transcriptBn: string | null;
  redFlag: RedFlagNotice | null;
}

export interface VisitStateResponse {
  visitId: string;
  patientCode: string;
  status: VisitStatus;
  step: Step;
  redFlag: RedFlagNotice | null;
}

export interface UploadUrlResponse {
  uploadId: string;
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
}

// ---------------------------------------------------------------------------
// Auth / doctor
// ---------------------------------------------------------------------------
export interface DoctorProfile {
  id: string;
  email: string;
  fullName: string;
  specialty: string | null;
  qualifications: string | null;
  chamberName: string | null;
  chamberAddress: string | null;
  slug: string;
  isOpen: boolean;
  isActive: boolean;
  dailyAiLimit: number;
  mustChangePassword: boolean;
}

export interface MeResponse {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  doctor: DoctorProfile | null;
}

export interface VisitListItem {
  id: string;
  doctorId: string;
  patientCode: string;
  visitDate: string;
  createdAt: string;
  ageYears: number | null;
  sex: Sex | null;
  status: VisitStatus;
  aiMode: AiMode;
  redFlagLevel: RedFlagLevel;
  category: Category | null;
  chiefComplaintShort: string | null;
  hasSummary: boolean;
}

export interface SearchResultItem extends VisitListItem {
  doctorName: string;
  isOwn: boolean;
}

export interface VisitMessage {
  id: string;
  role: "assistant" | "patient";
  questionId: string | null;
  textBn: string | null;
  sttSource: string | null;
  createdAt: string;
}

export interface VisitUpload {
  id: string;
  kind: UploadKind;
  url: string | null;
  deleted: boolean;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  visitId: string;
  patientCode: string;
  level: "urgent" | "emergency";
  ruleId: string;
  reasonBn: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface VisitDetail {
  visit: VisitListItem;
  doctor: { id: string; fullName: string; chamberName: string | null };
  isOwn: boolean;
  summary: SummaryCard | null;
  summaryMeta: { generatedBy: "ai" | "rules"; model: string | null; createdAt: string } | null;
  messages: VisitMessage[];
  uploads: VisitUpload[];
  alerts: AlertItem[];
  comorbidities: string[];
}

export interface AdminDoctorRow extends DoctorProfile {
  createdAt: string;
  visitsToday: number;
}

export interface UsageResponse {
  quotaDay: string;
  models: { model: string; purpose: string; calls: number; failed: number; tokensIn: number; tokensOut: number }[];
  dailyLimits: { turn: number; final: number };
  remaining: { turn: number; final: number };
  visitsToday: { mode: AiMode; count: number }[];
}

export interface MetricsResponse {
  generatedAt: string;
  visitsToday: number;
  completedToday: number;
  alertsToday: number;
  modeBreakdown: { mode: string; count: number }[];
  llmCallsToday: number;
  avgCallsPerCompletedVisit: number | null;
  avgTokensPerCompletedVisit: number | null;
  avgLatencyMs: number | null;
  remainingQuota: { turn: number; final: number };
}
