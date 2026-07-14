export type AdminMarketplaceStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | string;

export interface AdminMarketplaceListItem {
  itemId: string;
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
  createdAt: string;
  status: AdminMarketplaceStatus;
}

export interface AdminMarketplaceOption {
  optionId: string;
  text: string;
  correct?: boolean | null;
}

export interface AdminMarketplaceQuestion {
  questionId: string;
  question: string;
  type?: string | null;
  explanation?: string | null;
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
  reviewNote?: string | null;
  chapters: AdminMarketplaceChapter[];
}

/** Raw moderation payloads may expose the immutable pack content as `snapshot`.
 * The service normalizes it into `chapters` for the page. */
export interface AdminMarketplaceDetailPayload extends Omit<AdminMarketplaceDetail, "chapters"> {
  chapters?: AdminMarketplaceChapter[];
  snapshot?: AdminMarketplaceChapter[];
  correctAnswers?: Array<{ questionId: string; correctOptionId: string }>;
}

export interface UpdateAdminMarketplaceStatusRequest {
  status: "PUBLISHED" | "REJECTED" | "SUSPENDED";
  reviewNote?: string;
}
