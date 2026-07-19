import type { MarketplaceQualityJob, MarketplaceQualityJobStatus } from "../marketplace";

export type AdminMarketplaceStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | string;

export interface AdminMarketplaceListItem {
  itemId: string;
  packId?: string | null;
  versionId?: string | null;
  versionNo?: number | null;
  title: string;
  creatorName?: string | null;
  sourceWorkspaceName?: string | null;
  subject: string;
  priceCoins: number;
  chapterCount: number;
  quizCount: number;
  questionCount: number;
  creatorValidationScore?: number | null;
  validationScore?: number | null;
  qualityStatus?: MarketplaceQualityJobStatus | null;
  qualityScore?: number | null;
  qualityCurrent?: boolean;
  reviewNote?: string | null;
  createdAt: string;
  status: AdminMarketplaceStatus;
}

export interface AdminMarketplaceEvidence {
  sourceStepId?: string | null;
  sourceChunkIds: string[];
  explanation?: string | null;
}

export interface AdminMarketplaceOption {
  optionId: string;
  label?: string | null;
  text: string;
  correct?: boolean | null;
}

export interface AdminMarketplaceQuestion {
  questionId: string;
  question: string;
  type?: string | null;
  explanation?: string | null;
  evidence?: AdminMarketplaceEvidence | null;
  options: AdminMarketplaceOption[];
}

export interface AdminMarketplaceQuiz {
  quizId: string;
  title: string;
  questions: AdminMarketplaceQuestion[];
}

export interface AdminMarketplaceChapter {
  chapterId: string;
  sequenceNo?: number | null;
  title: string;
  summary?: string | null;
  quizzes?: AdminMarketplaceQuiz[];
  questions?: AdminMarketplaceQuestion[];
}

export interface AdminMarketplaceDetail extends AdminMarketplaceListItem {
  description?: string | null;
  creatorId?: string | null;
  qualityJob?: MarketplaceQualityJob | null;
  qualityJobHistory: MarketplaceQualityJob[];
  chapters: AdminMarketplaceChapter[];
}

interface RawAdminMarketplaceOption {
  optionId?: string;
  label?: string | null;
  text?: string;
  correct?: boolean | null;
}

interface RawAdminMarketplaceEvidence {
  sourceStepId?: string | null;
  sourceChunkIds?: string[] | null;
  explanation?: string | null;
}

export interface RawAdminMarketplaceQuestion {
  questionId?: string;
  question?: string;
  text?: string;
  type?: string | null;
  explanation?: string | null;
  evidence?: RawAdminMarketplaceEvidence | null;
  options?: RawAdminMarketplaceOption[];
}

interface RawAdminMarketplaceQuiz {
  quizId?: string;
  title?: string;
  questions?: RawAdminMarketplaceQuestion[];
}

interface RawAdminMarketplaceChapter {
  chapterId?: string;
  sequenceNo?: number | null;
  title?: string;
  summary?: string | null;
  quiz?: RawAdminMarketplaceQuiz | null;
  quizzes?: RawAdminMarketplaceQuiz[];
  questions?: RawAdminMarketplaceQuestion[];
}

/** Raw moderation payload. Newer APIs expose immutable content under
 * `content.chapters`; the legacy shapes remain accepted during rollout. */
export interface AdminMarketplaceDetailPayload extends Omit<AdminMarketplaceDetail, "chapters" | "qualityJobHistory"> {
  chapters?: RawAdminMarketplaceChapter[];
  snapshot?: RawAdminMarketplaceChapter[];
  content?: { chapters?: RawAdminMarketplaceChapter[] } | null;
  qualityJobHistory?: MarketplaceQualityJob[] | null;
  correctAnswers?: Array<{ questionId: string; correctOptionId: string }>;
}

export interface UpdateAdminMarketplaceStatusRequest {
  status: "PUBLISHED" | "REJECTED" | "SUSPENDED";
  reviewNote?: string;
}
