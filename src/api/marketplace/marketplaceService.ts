import { skillSprintApiClient, type ApiResponse } from "../core/skillSprintApiClient";
import type {
  ChallengeResult, ChallengeSession, CreateMarketplaceItemRequest,
  CreatorMarketplaceItem, CreatorValidationPackResponse, CreatorValidationRequest, CreatorValidationResult, MarketplaceItemDetail, MarketplaceItemSummary,
  CoinTopUpPackage, CoinTopUpPayment, MarketplaceLeaderboardEntry, MarketplaceReview, MarketplaceTransaction, MarketplaceWallet,
  MarketplaceChapter, MarketplaceOption, MarketplaceQuestion, PurchasedMarketplacePack, PurchasedPackApiResponse, PurchasedPackDetail,
} from "./marketplaceTypes";

function unwrap<T>(payload: ApiResponse<T>): T {
  if (!payload || payload.data == null) throw new Error(payload?.message || "Không nhận được dữ liệu từ máy chủ.");
  return payload.data;
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
};

export default marketplaceService;
