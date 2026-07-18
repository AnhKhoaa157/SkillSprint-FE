import { skillSprintApiClient, type ApiResponse } from "../core/skillSprintApiClient";
import type {
  ChallengeResult, ChallengeSession, CreateMarketplaceItemRequest,
  CreatorMarketplaceItem, CreatorValidationPackResponse, CreatorValidationRequest, CreatorValidationResult, MarketplaceItemDetail, MarketplaceItemSummary,
  CoinTopUpPackage, CoinTopUpPayment, MarketplaceLeaderboardEntry, MarketplaceReview, MarketplaceTransaction, MarketplaceWallet,
  MarketplaceChapter, MarketplaceOption, MarketplaceQuestion, PurchasedMarketplacePack, PurchasedPackApiResponse, PurchasedPackDetail,
  CreatorEarnings, CreatorPayout, CreatorPayoutDestination, CreatorPayoutQrUploadUrl, MarketplaceVersionPurchaseReceipt,
  MarketplaceRankedAttempt, MarketplaceRankedAttemptHistory, MarketplaceRankedAttemptResult,
  MarketplacePracticeAttempt, MarketplacePracticeAttemptHistory, MarketplacePracticeAttemptResult, MarketplaceVersionProgress,
} from "./marketplaceTypes";

const CREATOR_PAYOUT_QR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CREATOR_PAYOUT_QR_MAX_BYTES = 5 * 1024 * 1024;

function unwrap<T>(payload: ApiResponse<T>): T {
  if (!payload || payload.data == null) throw new Error(payload?.message || "Không nhận được dữ liệu từ máy chủ.");
  return payload.data;
}

function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if (!("response" in error)) return undefined;
  const response = error.response;
  if (typeof response !== "object" || response === null || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
}

function isMissingCreatorPayoutDestination(error: unknown): boolean {
  if (statusOf(error) === 404) return true;
  return statusOf(error) === 400 && error instanceof Error && error.message === "Chưa có thông tin nhận tiền Creator";
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asRecords(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord).filter((item): item is UnknownRecord => item !== null) : [];
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeOption(option: UnknownRecord, index: number): MarketplaceOption {
  return {
    optionId: asText(option.optionId, `option-${index + 1}`),
    text: asText(option.text),
  };
}

function normalizeQuestion(question: UnknownRecord, chapterIndex: number, questionIndex: number): MarketplaceQuestion {
  return {
    questionId: asText(question.questionId, `question-${chapterIndex + 1}-${questionIndex + 1}`),
    question: asText(question.text, asText(question.question)),
    options: asRecords(question.options).map(normalizeOption),
  };
}

function normalizePurchasedPack(response: PurchasedPackApiResponse): PurchasedPackDetail {
  const content = asRecord(response.content);
  const chapters = asRecords(content?.chapters).map((chapter, chapterIndex): MarketplaceChapter => {
    const quiz = asRecord(chapter.quiz);
    const questions = asRecords(quiz?.questions).map((question, questionIndex) =>
      normalizeQuestion(question, chapterIndex, questionIndex),
    );

    return {
      chapterId: asText(chapter.chapterId, `chapter-${chapterIndex + 1}`),
      title: asText(chapter.title),
      summary: asText(chapter.summary) || null,
      questions,
    };
  });

  return {
    itemId: response.itemId,
    title: response.title,
    subject: response.subject,
    questionCount: response.questionCount,
    description: "",
    chapters,
    questions: chapters.flatMap(chapter => chapter.questions ?? []),
  };
}

const marketplaceService = {
  async listItems(subject?: string) {
    const response = await skillSprintApiClient.get<ApiResponse<MarketplaceItemSummary[]>>("/api/marketplace/items", { params: subject ? { subject } : undefined });
    return unwrap(response.data);
  },
  async getItem(itemId: string) {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceItemDetail>>(`/api/marketplace/items/${itemId}`)).data);
  },
  async getLeaderboard(itemId: string) {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceLeaderboardEntry[]>>(`/api/marketplace/items/${itemId}/leaderboard`)).data);
  },
  async getReviews(itemId: string) {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceReview[]>>(`/api/marketplace/items/${itemId}/reviews`)).data);
  },
  async getWallet() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceWallet>>("/api/marketplace/wallet")).data);
  },
  async purchase(itemId: string) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplaceWallet>>(`/api/marketplace/items/${itemId}/purchase/coins`)).data);
  },
  async purchaseVersion(versionId: string, idempotencyKey: string): Promise<MarketplaceVersionPurchaseReceipt> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplaceVersionPurchaseReceipt>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/purchase/coins`, { idempotencyKey },
    )).data);
  },
  async getMyPacks() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<PurchasedMarketplacePack[]>>("/api/marketplace/my-packs")).data);
  },
  async getMyPack(itemId: string) {
    const response = await skillSprintApiClient.get<ApiResponse<PurchasedPackApiResponse>>(`/api/marketplace/my-packs/${itemId}`);
    return normalizePurchasedPack(unwrap(response.data));
  },
  async startChallenge(itemId: string) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<ChallengeSession>>(`/api/marketplace/items/${itemId}/challenge/start`)).data);
  },
  async submitChallenge(itemId: string, request: { sessionId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<ChallengeResult>>(`/api/marketplace/items/${itemId}/challenge/submit`, request)).data);
  },
  async startOrResumeRankedAttempt(versionId: string): Promise<MarketplaceRankedAttempt> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplaceRankedAttempt>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/ranked-attempts`,
    )).data);
  },
  async submitRankedAttempt(
    versionId: string,
    attemptId: string,
    request: { idempotencyKey: string; answers: Array<{ questionId: string; optionId: string }> },
  ): Promise<MarketplaceRankedAttemptResult> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplaceRankedAttemptResult>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/ranked-attempts/${encodeURIComponent(attemptId)}/submit`,
      request,
    )).data);
  },
  async getRankedLeaderboard(versionId: string): Promise<MarketplaceLeaderboardEntry[]> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceLeaderboardEntry[]>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/leaderboard`,
    )).data);
  },
  async getRankedAttemptHistory(versionId: string): Promise<MarketplaceRankedAttemptHistory[]> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceRankedAttemptHistory[]>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/ranked-attempts/me`,
    )).data);
  },
  async startOrResumePracticeAttempt(versionId: string, chapterSequenceNo: number): Promise<MarketplacePracticeAttempt> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplacePracticeAttempt>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/practice-attempts`,
      { chapterSequenceNo },
    )).data);
  },
  async getInProgressPracticeAttempt(versionId: string, chapterSequenceNo: number): Promise<MarketplacePracticeAttempt> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplacePracticeAttempt>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/practice-attempts/me/in-progress`,
      { params: { chapterSequenceNo } },
    )).data);
  },
  async submitPracticeAttempt(
    versionId: string,
    attemptId: string,
    request: { idempotencyKey: string; answers: Array<{ questionId: string; optionId: string }> },
  ): Promise<MarketplacePracticeAttemptResult> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplacePracticeAttemptResult>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/practice-attempts/${encodeURIComponent(attemptId)}/submit`,
      request,
    )).data);
  },
  async getPracticeAttemptHistory(versionId: string): Promise<MarketplacePracticeAttemptHistory[]> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplacePracticeAttemptHistory[]>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/practice-attempts/me`,
    )).data);
  },
  async getVersionProgress(versionId: string): Promise<MarketplaceVersionProgress> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceVersionProgress>>(
      `/api/marketplace/versions/${encodeURIComponent(versionId)}/progress/me`,
    )).data);
  },
  async review(itemId: string, request: { rating: number; comment?: string }) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<MarketplaceReview>>(`/api/marketplace/items/${itemId}/review`, request)).data);
  },
  async getTransactions() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<MarketplaceTransaction[]>>("/api/marketplace/wallet/transactions")).data);
  },
  async getTopUpPackages() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CoinTopUpPackage[]>>("/api/marketplace/wallet/top-ups/packages")).data);
  },
  async createSepayTopUp(packageKey: string) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CoinTopUpPayment>>("/api/marketplace/wallet/top-ups/sepay", { packageKey })).data);
  },
  async cancelSepayTopUp(paymentId: string) {
    return unwrap((await skillSprintApiClient.patch<ApiResponse<CoinTopUpPayment>>(`/api/marketplace/wallet/top-ups/${paymentId}/cancel`)).data);
  },
  async getMine() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorMarketplaceItem[]>>("/api/marketplace/items/mine")).data);
  },
  async createItem(request: CreateMarketplaceItemRequest) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorMarketplaceItem>>("/api/marketplace/items", request)).data);
  },
  async getCreatorValidationSnapshot(itemId: string) {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorValidationPackResponse>>(`/api/marketplace/items/${itemId}/creator-validation`)).data);
  },
  async refreshCreatorSnapshot(itemId: string) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorMarketplaceItem>>(`/api/marketplace/items/${itemId}/refresh-snapshot`)).data);
  },
  async validateCreator(itemId: string, request: CreatorValidationRequest) {
    if (request.answers.length === 0) {
      throw new Error("Trả lời tất cả câu hỏi xác thực trước khi gửi.");
    }
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorValidationResult>>(`/api/marketplace/items/${itemId}/creator-validation`, request)).data);
  },
  async submitForReview(itemId: string) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorMarketplaceItem>>(`/api/marketplace/items/${itemId}/submit-review`)).data);
  },
  async getCreatorEarnings(): Promise<CreatorEarnings> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorEarnings>>("/api/marketplace/creator/earnings")).data);
  },
  async getCreatorPayoutDestination(): Promise<CreatorPayoutDestination | null> {
    try {
      return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorPayoutDestination>>("/api/marketplace/creator/payout-destination")).data);
    } catch (error) {
      if (isMissingCreatorPayoutDestination(error)) return null;
      throw error;
    }
  },
  async createCreatorPayoutQrUploadUrl(fileName: string, contentType: string): Promise<CreatorPayoutQrUploadUrl> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorPayoutQrUploadUrl>>(
      "/api/marketplace/creator/payout-destination/qr-upload-url", { fileName, contentType },
    )).data);
  },
  async uploadCreatorPayoutQr(file: File): Promise<string> {
    if (!CREATOR_PAYOUT_QR_ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Ảnh QR phải ở định dạng JPEG, PNG hoặc WebP.");
    }
    if (file.size > CREATOR_PAYOUT_QR_MAX_BYTES) {
      throw new Error("Ảnh QR không được vượt quá 5 MB.");
    }

    const { uploadUrl, objectKey } = await this.createCreatorPayoutQrUploadUrl(file.name, file.type);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error("Không thể tải ảnh QR lên. Vui lòng thử lại.");
    }
    return objectKey;
  },
  async saveCreatorPayoutDestination(request: { bankName: string; bankCode?: string; accountHolder: string; qrObjectKey: string }): Promise<CreatorPayoutDestination> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorPayoutDestination>>(
      "/api/marketplace/creator/payout-destination", request,
    )).data);
  },
  async createCreatorPayout(amount: number): Promise<CreatorPayout> {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorPayout>>(
      "/api/marketplace/creator/payouts", { amount },
    )).data);
  },
  async getCreatorPayouts(): Promise<CreatorPayout[]> {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorPayout[]>>("/api/marketplace/creator/payouts")).data);
  },
};

export default marketplaceService;
