import { skillSprintApiClient, type ApiResponse } from "../core/skillSprintApiClient";
import type {
  ChallengeResult, ChallengeSession, CreateMarketplaceItemRequest,
  CreatorMarketplaceItem, CreatorValidationRequest, CreatorValidationResult, MarketplaceItemDetail, MarketplaceItemSummary,
  MarketplaceLeaderboardEntry, MarketplaceReview, MarketplaceTransaction, MarketplaceWallet,
  PurchasedMarketplacePack, PurchasedPackDetail,
} from "./marketplaceTypes";

function unwrap<T>(payload: ApiResponse<T>): T {
  if (!payload || payload.data == null) throw new Error(payload?.message || "Không nhận được dữ liệu từ máy chủ.");
  return payload.data;
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
    return unwrap((await skillSprintApiClient.get<ApiResponse<PurchasedPackDetail>>(`/api/marketplace/my-packs/${itemId}`)).data);
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
  async getMine() {
    return unwrap((await skillSprintApiClient.get<ApiResponse<CreatorMarketplaceItem[]>>("/api/marketplace/items/mine")).data);
  },
  async createItem(request: CreateMarketplaceItemRequest) {
    return unwrap((await skillSprintApiClient.post<ApiResponse<CreatorMarketplaceItem>>("/api/marketplace/items", request)).data);
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
