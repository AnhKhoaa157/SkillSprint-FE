import type {
  MarketplaceDisputeReason,
  MarketplaceDisputeStatus,
} from "../marketplace/marketplaceTypes";

export type { MarketplaceDisputeReason, MarketplaceDisputeStatus };

/** Admin view of a refund dispute — includes buyer identity and the server-driven action list. */
export interface AdminMarketplaceDispute {
  disputeId: string;
  saleId: string;
  packVersionId: string;
  packId: string;
  versionNo: number | null;
  versionTitle: string | null;
  saleCoinAmount: number | null;
  reason: MarketplaceDisputeReason;
  description: string | null;
  status: MarketplaceDisputeStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  refundedAt: string | null;
  refundCoinAmount: number | null;
  refundWalletTransactionId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  allowedActions: string[];
  buyerId: string | null;
  buyerName: string | null;
  adminActorName: string | null;
}

export interface AdminMarketplaceDisputePage {
  items: AdminMarketplaceDispute[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminMarketplaceDisputeListParams {
  status?: MarketplaceDisputeStatus;
  page?: number;
  size?: number;
}

export interface DecideMarketplaceDisputeRequest {
  status: MarketplaceDisputeStatus;
  decisionNote?: string;
}

export interface MarketplaceVersionMetrics {
  versionId: string;
  packId: string;
  versionNo: number | null;
  versionTitle: string | null;
  learnerCount: number;
  completedLearnerCount: number;
  completionRate: number;
  averageRating: number;
  reviewCount: number;
  reportCount: number;
  openReportCount: number;
  openReportRate: number;
  rankedAttemptCount: number;
  suspiciousRankedAttemptCount: number;
  suspiciousRankedAttemptRate: number;
  disputeCount: number;
  refundedDisputeCount: number;
  refundRate: number;
  refundedCoinAmount: number;
  recognizedPlatformRevenue: number;
}
