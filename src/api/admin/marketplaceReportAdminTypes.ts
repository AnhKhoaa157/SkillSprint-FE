import type {
  MarketplaceReportCategory,
  MarketplaceReportStatus,
  MarketplaceReportTargetType,
} from "../marketplace/marketplaceTypes";

export type {
  MarketplaceReportCategory,
  MarketplaceReportStatus,
  MarketplaceReportTargetType,
};

/** Admin view of a marketplace content report — includes reporter identity and evidence URL. */
export interface AdminMarketplaceReport {
  reportId: string;
  packVersionId: string;
  packId: string;
  versionNo: number | null;
  versionTitle: string | null;
  targetType: MarketplaceReportTargetType;
  targetRef: string | null;
  category: MarketplaceReportCategory;
  description: string | null;
  status: MarketplaceReportStatus;
  resolutionNote: string | null;
  evidenceUrl: string | null;
  hasEvidence: boolean;
  reviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reviewedByName: string | null;
}

export interface AdminMarketplaceReportPage {
  items: AdminMarketplaceReport[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminMarketplaceReportListParams {
  status?: MarketplaceReportStatus;
  targetType?: MarketplaceReportTargetType;
  category?: MarketplaceReportCategory;
  page?: number;
  size?: number;
}

export interface UpdateMarketplaceReportStatusRequest {
  status: MarketplaceReportStatus;
  resolutionNote?: string;
}
