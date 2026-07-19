export type MarketplaceStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | string;

export type MarketplaceQualityJobStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "ERROR";

export interface MarketplaceQualityIssue {
  code: string;
  severity: string;
  chapterSequenceNo: number | null;
  questionId: string | null;
  message: string;
}

export interface MarketplaceQualityReport {
  passingScore: number;
  blockingIssueCount: number;
  chapterCount: number;
  questionCount: number;
  issues: MarketplaceQualityIssue[];
}

export interface MarketplaceQualityJob {
  jobId: string;
  versionId: string;
  status: MarketplaceQualityJobStatus;
  score: number | null;
  currentSnapshot: boolean;
  retryCount: number;
  maxRetries: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  report: MarketplaceQualityReport | null;
}

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
  packId?: string | null;
  versionId?: string | null;
  versionNo?: number | null;
  title: string;
  description: string;
  subject: string;
  creatorName: string;
  /** Short-lived S3 view URL returned for the current marketplace-list request. */
  creatorAvatarUrl?: string | null;
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

/** Raw response returned by GET /api/marketplace/my-packs/{itemId}. */
export interface PurchasedPackApiResponse {
  itemId: string;
  title: string;
  subject: string;
  questionCount: number;
  content: unknown;
}

export interface PurchasedPackDetail {
  itemId: string;
  title: string;
  subject: string;
  questionCount: number;
  description: string;
  chapters: MarketplaceChapter[];
  questions: MarketplaceQuestion[];
}

export interface ChallengeSession {
  sessionId: string;
  packId: string;
  versionId: string;
  versionNo: number;
  startedAt: string;
  expiresAt: string;
}

export interface ChallengeResult {
  score: number;
  correctCount: number;
  questionCount: number;
  durationSeconds: number;
  completedAt: string;
}

export type MarketplaceRankedAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "ABANDONED";

export interface MarketplaceRankedOption {
  optionId: string;
  label: string;
  text: string;
}

/** Buyer-safe question snapshot. Correct-answer data is never part of this contract. */
export interface MarketplaceRankedQuestion {
  questionId: string;
  type: string;
  text: string;
  options: MarketplaceRankedOption[];
}

export interface MarketplaceRankedAttempt {
  attemptId: string;
  versionId: string;
  versionNo: number;
  status: MarketplaceRankedAttemptStatus;
  attemptDate: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  totalQuestionCount: number;
  attemptsRemaining: number;
  questions: MarketplaceRankedQuestion[];
}

export interface MarketplaceRankedAttemptResult {
  attemptId: string;
  versionId: string;
  score: number;
  correctCount: number;
  questionCount: number;
  durationSeconds: number;
  completedAt: string;
  suspicious: boolean;
  leaderboardEligible: boolean;
}

export interface MarketplaceRankedAttemptHistory {
  attemptId: string;
  attemptDate: string;
  attemptNumber: number;
  status: MarketplaceRankedAttemptStatus;
  score: number | null;
  correctCount: number | null;
  questionCount: number;
  durationSeconds: number | null;
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
  leaderboardEligible: boolean;
}

export type MarketplacePracticeAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface MarketplacePracticeAttempt {
  attemptId: string;
  versionId: string;
  versionNo: number;
  chapterSequenceNo: number;
  chapterTitle: string;
  quizTitle: string;
  status: MarketplacePracticeAttemptStatus;
  startedAt: string;
  questionCount: number;
  questions: MarketplaceRankedQuestion[];
}

export interface MarketplacePracticeAttemptResult {
  attemptId: string;
  versionId: string;
  chapterSequenceNo: number;
  score: number;
  correctCount: number;
  questionCount: number;
  completedAt: string;
}

export interface MarketplacePracticeAttemptHistory {
  attemptId: string;
  chapterSequenceNo: number;
  status: MarketplacePracticeAttemptStatus;
  score: number | null;
  correctCount: number | null;
  questionCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface MarketplaceChapterProgress {
  chapterSequenceNo: number;
  chapterTitle: string;
  completed: boolean;
  bestScore: number | null;
  attemptCount: number;
  lastCompletedAt: string | null;
}

export interface MarketplaceVersionProgress {
  versionId: string;
  versionNo: number;
  totalChapterCount: number;
  totalQuizCount: number;
  completedChapterCount: number;
  completedQuizCount: number;
  completionPercent: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  reviewEligible: boolean;
  chapters: MarketplaceChapterProgress[];
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
  qualityStatus?: MarketplaceQualityJobStatus | null;
  qualityScore?: number | null;
  qualityCurrent?: boolean;
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
  packId: string;
  versionId: string;
  versionNo: number;
  sourceWorkspaceId: string;
  title: string;
  chapterCount: number;
  quizCount: number;
  questionCount: number;
  creatorValidationScore: number | null;
  chapters: CreatorValidationChapter[];
}

export interface CreatorValidationResult extends CreatorMarketplaceItem {
  score: number;
  correctCount: number;
  questionCount: number;
  durationSeconds: number;
  completedAt: string;
}

export type CreatorPayoutStatus = "REQUESTED" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "FAILED";

export interface MarketplaceVersionPurchaseReceipt {
  saleId: string;
  entitlementId: string;
  packId: string;
  packVersionId: string;
  versionNo: number;
  upgrade: boolean;
  originalGrossCoinAmount: number;
  discountCoinAmount: number;
  grossCoinAmount: number;
  creatorAmount: number;
  platformAmount: number;
  remainingCoinBalance: number;
  purchasedAt: string | null;
}

export interface CreatorEarning {
  earningEntryId: string;
  settlementId: string;
  saleId: string;
  amount: number;
  availableAmount: number;
  reservedAmount: number;
  paidAmount: number;
  state: string;
  createdAt: string | null;
}

export interface CreatorEarnings {
  pendingAmount: number;
  reservedAmount: number;
  paidAmount: number;
  availableAmount: number;
  earnings: CreatorEarning[];
}

export interface CreatorPayoutDestination {
  destinationId: string;
  bankName: string;
  bankCode: string | null;
  accountHolder: string;
  accountNumberMasked: string | null;
  qrViewUrl: string | null;
  updatedAt: string | null;
}

export interface CreatorPayout {
  payoutId: string;
  creatorUserId: string;
  creatorName: string;
  creatorEmail: string;
  requestedAmount: number;
  status: CreatorPayoutStatus;
  bankName: string;
  bankCode: string | null;
  accountHolder: string;
  accountNumberMasked: string | null;
  qrViewUrl: string | null;
  adminActorUserId: string | null;
  externalTransferReference: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreatorPayoutQrUploadUrl {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}
