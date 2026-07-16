export type MarketplaceStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | string;

export interface MarketplaceOption {
  optionId: string;
  text: string;
  /** Returned by the quiz API only for the dedicated ADMIN test account. */
  correct?: boolean | null;
}

export interface MarketplaceQuestion {
  questionId: string;
  question: string;
  options: MarketplaceOption[];
}

export interface MarketplaceChapter {
  chapterId: string;
  title: string;
  summary?: string | null;
  questions?: MarketplaceQuestion[];
}

export interface MarketplaceItemSummary {
  itemId: string;
  title: string;
  description: string;
  subject: string;
  creatorName: string;
  priceCoins: number;
  chapterCount: number;
  quizCount: number;
  questionCount: number;
  averageRating: number;
  reviewCount: number;
  publishedAt?: string | null;
}

export interface MarketplaceItemDetail extends MarketplaceItemSummary {
  chapters: MarketplaceChapter[];
  previewQuestions: MarketplaceQuestion[];
}

export interface MarketplaceLeaderboardEntry {
  rank: number;
  userName: string;
  score: number;
  durationSeconds: number;
  completedAt: string;
}

export interface MarketplaceReview {
  reviewId?: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  mine?: boolean;
}

export interface MarketplaceWallet {
  /** `balance` is the current API field; `balanceCoins` keeps old deployments compatible. */
  balance?: number;
  balanceCoins?: number;
}

export interface MarketplaceTransaction {
  transactionId: string;
  direction: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter: number;
  referenceType: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface CoinTopUpPackage {
  packageKey: string;
  coinAmount: number;
  vndAmount: number;
  currency: string;
}

export interface CoinTopUpBankAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface CoinTopUpPayment {
  paymentId: string;
  purpose: "COIN_TOP_UP";
  status: "PENDING" | string;
  packageKey: string;
  coinAmount: number;
  amount: number;
  currency: string;
  paymentCode: string;
  qrUrl: string;
  bank: CoinTopUpBankAccount;
  expiredAt: string;
}

export interface PurchasedMarketplacePack extends MarketplaceItemSummary {
  purchasedAt?: string | null;
}

export interface PurchasedPackDetail extends MarketplaceItemSummary {
  chapters: MarketplaceChapter[];
  questions: MarketplaceQuestion[];
}

export interface ChallengeSession {
  sessionId: string;
  startedAt: string;
  expiresAt: string;
  questions: MarketplaceQuestion[];
}

export interface ChallengeResult {
  score: number;
  correctCount: number;
  questionCount: number;
  durationSeconds: number;
  completedAt: string;
}

export interface CreateMarketplaceItemRequest {
  workspaceId: string;
  title: string;
  description: string | null;
  subject: string;
  priceCoins: number;
}

export interface CreatorMarketplaceItem extends MarketplaceItemSummary {
  status: MarketplaceStatus;
  creatorValidationScore?: number | null;
  validationScore?: number | null;
  reviewNote?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  validationQuestions?: MarketplaceQuestion[];
}

export interface CreatorValidationRequest {
  answers: Array<{ questionId: string; selectedOptionId: string }>;
  durationSeconds: number;
}

/**
 * Immutable snapshot returned to the Creator for pack validation.
 * Correct answers are included only for the ADMIN_DEFAULT validation tool.
 */
export interface CreatorValidationOption {
  optionId: string;
  label: string;
  text: string;
  sequenceNo: number;
  correct?: boolean | null;
}

export interface CreatorValidationQuestion {
  questionId: string;
  type: string;
  text: string;
  sequenceNo: number;
  options: CreatorValidationOption[];
}

export interface CreatorValidationChapter {
  sequenceNo: number;
  title: string;
  summary: string | null;
  quizTitle: string;
  questions: CreatorValidationQuestion[];
}

export interface CreatorValidationPackResponse {
  itemId: string;
  sourceWorkspaceId: string;
  title: string;
  chapterCount: number;
  quizCount: number;
  questionCount: number;
  chapters: CreatorValidationChapter[];
}

export interface CreatorValidationResult extends CreatorMarketplaceItem {
  score: number;
  correctCount: number;
  questionCount: number;
  durationSeconds: number;
  completedAt: string;
}
