import {
  getAdminDashboardAnalytics,
  getAdminMonthlyFinancials,
  getAdminPayments,
  type AdminDashboardResponse,
  type MonthlyFinancialDataPoint,
  type PaymentTransactionResponse,
} from "./adminDashboardService";
import {
  getAdminUsers,
  type AdminUserDetail,
} from "./adminUserService";
import {
  getAdminLeaderboard,
  type AdminLeaderboardEntry,
} from "./adminPointService";
import {
  getSubscriptionPlanAuditLogs,
  getSubscriptionPlans,
  type AdminAuditLogResponse,
  type ServicePlanResponse,
} from "./adminSubscriptionPlansService";
import {
  getAdminWallet,
  type AdminWallet,
} from "./adminWalletService";
import {
  getAdminCommunityBlacklist,
  getAdminCommunityComments,
  getAdminCommunityPosts,
  getAdminCommunityReports,
  getAdminCommunityRooms,
} from "./adminCommunityService";
import type {
  BlacklistKeywordResponse,
  CommunityPostResponse,
  CommunityRoomResponse,
  ContentReportResponse,
  PostCommentResponse,
} from "./adminCommunityTypes";
import { getMarketplaceItems } from "./marketplaceAdminService";
import type {
  AdminMarketplaceListItem,
  AdminMarketplaceStatus,
} from "./marketplaceAdminTypes";
import { getAdminMarketplaceReports } from "./marketplaceReportAdminService";
import type { AdminMarketplaceReport } from "./marketplaceReportAdminTypes";
import { getAdminDisputes } from "./marketplaceOpsAdminService";
import type { AdminMarketplaceDispute } from "./marketplaceOpsAdminTypes";
import {
  getAdminMarketplacePayouts,
} from "./marketplacePayoutService";
import {
  getPlatformTreasuryEntries,
  getPlatformTreasuryMonthlySummaries,
  getPlatformTreasurySummary,
  type PlatformTreasuryEntry,
  type PlatformTreasuryMonthlySummary,
  type PlatformTreasurySummary,
} from "./marketplaceTreasuryService";
import type { CreatorPayout } from "../marketplace/marketplaceTypes";
import {
  getAdminFeedbacks,
  type FeedbackAdminResponse,
} from "../utilities/feedbackService";
import {
  getAdminAnnouncement,
  type AnnouncementResponse,
} from "../system/systemAnnouncementService";
import {
  getMaintenanceConfig,
  type MaintenanceResponse,
} from "../system/systemMaintenanceService";

const EXPORT_PAGE_SIZE = 200;
const EXPORT_SECTION_CONCURRENCY = 6;
const WALLET_REQUEST_CONCURRENCY = 6;

export interface AdminExportSectionError {
  section: string;
  message: string;
}

export interface AdminWalletExportRecord {
  user: AdminUserDetail;
  wallet: AdminWallet | null;
  error: string | null;
}

export interface AdminExportData {
  generatedAt: string;
  dashboard: AdminDashboardResponse | null;
  monthlyFinancials: MonthlyFinancialDataPoint[];
  payments: PaymentTransactionResponse[];
  treasurySummary: PlatformTreasurySummary | null;
  treasuryMonthly: PlatformTreasuryMonthlySummary[];
  treasuryEntries: PlatformTreasuryEntry[];
  users: AdminUserDetail[];
  wallets: AdminWalletExportRecord[];
  plans: ServicePlanResponse[];
  planAuditLogs: AdminAuditLogResponse[];
  leaderboard: AdminLeaderboardEntry[];
  feedback: FeedbackAdminResponse[];
  communityPosts: CommunityPostResponse[];
  communityComments: PostCommentResponse[];
  communityReports: ContentReportResponse[];
  communityRooms: CommunityRoomResponse[];
  blacklistKeywords: BlacklistKeywordResponse[];
  marketplaceItems: AdminMarketplaceListItem[];
  marketplaceReports: AdminMarketplaceReport[];
  marketplaceDisputes: AdminMarketplaceDispute[];
  payouts: CreatorPayout[];
  maintenance: MaintenanceResponse | null;
  announcement: AnnouncementResponse | null;
  errors: AdminExportSectionError[];
}

interface ExportPage<T> {
  items: T[];
  totalItems: number;
  totalPages?: number;
  last?: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Không thể tải dữ liệu.";
}

async function collectAllPages<T>(
  loadPage: (page: number, size: number) => Promise<ExportPage<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 0;

  while (true) {
    const result = await loadPage(page, EXPORT_PAGE_SIZE);
    items.push(...result.items);

    const reachedLastPage = result.last === true ||
      (result.totalPages !== undefined && page + 1 >= result.totalPages) ||
      items.length >= result.totalItems ||
      result.items.length === 0;

    if (reachedLastPage) return items;
    page += 1;
  }
}

async function mapWithConcurrency<T, TResult>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function createTaskLimiter(concurrency: number) {
  let activeTaskCount = 0;
  const pendingTasks: Array<() => void> = [];

  return async function runLimited<T>(task: () => Promise<T>): Promise<T> {
    if (activeTaskCount >= concurrency) {
      await new Promise<void>((resolve) => pendingTasks.push(resolve));
    }

    activeTaskCount += 1;
    try {
      return await task();
    } finally {
      activeTaskCount -= 1;
      pendingTasks.shift()?.();
    }
  };
}

async function loadAllUsers(): Promise<AdminUserDetail[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminUsers(undefined, page, size);
    return {
      items: result.content,
      totalItems: result.totalElements,
    };
  });
}

async function loadAllPayments(): Promise<PaymentTransactionResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminPayments(page, size);
    const items = result.items ?? result.content ?? [];
    const totalItems = result.totalItems ?? result.totalElements ?? items.length;
    return { items, totalItems, totalPages: result.totalPages };
  });
}

async function loadAllLeaderboardEntries(): Promise<AdminLeaderboardEntry[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminLeaderboard({ period: "ALL_TIME", page, size });
    return {
      items: result.entries.items,
      totalItems: result.entries.totalItems,
      totalPages: result.entries.totalPages,
      last: result.entries.last,
    };
  });
}

async function loadAllFeedback(): Promise<FeedbackAdminResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminFeedbacks(page, size);
    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      last: result.last,
    };
  });
}

async function loadAllTreasuryEntries(): Promise<PlatformTreasuryEntry[]> {
  return collectAllPages(async (page, size) => {
    const result = await getPlatformTreasuryEntries({ page, size });
    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      last: result.last,
    };
  });
}

async function loadAllCommunityPosts(): Promise<CommunityPostResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminCommunityPosts({ page, size });
    return result;
  });
}

async function loadAllCommunityComments(): Promise<PostCommentResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminCommunityComments({ page, size });
    return result;
  });
}

async function loadAllCommunityReports(): Promise<ContentReportResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminCommunityReports({ page, size });
    return result;
  });
}

async function loadAllCommunityRooms(): Promise<CommunityRoomResponse[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminCommunityRooms({ page, size });
    return result;
  });
}

async function loadAllMarketplaceReports(): Promise<AdminMarketplaceReport[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminMarketplaceReports({ page, size });
    return result;
  });
}

async function loadAllMarketplaceDisputes(): Promise<AdminMarketplaceDispute[]> {
  return collectAllPages(async (page, size) => {
    const result = await getAdminDisputes({ page, size });
    return result;
  });
}

async function loadAllMarketplaceItems(): Promise<AdminMarketplaceListItem[]> {
  const statuses: AdminMarketplaceStatus[] = [
    "DRAFT",
    "PENDING_REVIEW",
    "PUBLISHED",
    "REJECTED",
    "SUSPENDED",
  ];
  const groups = await mapWithConcurrency(statuses, 3, (status) => getMarketplaceItems(status));
  return Array.from(
    new Map(groups.flat().map((item) => [item.itemId, item])).values(),
  );
}

async function loadWallets(users: AdminUserDetail[]): Promise<AdminWalletExportRecord[]> {
  return mapWithConcurrency(users, WALLET_REQUEST_CONCURRENCY, async (user) => {
    try {
      return { user, wallet: await getAdminWallet(user.id), error: null };
    } catch (error) {
      return { user, wallet: null, error: errorMessage(error) };
    }
  });
}

export async function getAdminExportData(): Promise<AdminExportData> {
  const errors: AdminExportSectionError[] = [];
  const runLimited = createTaskLimiter(EXPORT_SECTION_CONCURRENCY);
  const capture = async <T>(section: string, fallback: T, task: () => Promise<T>): Promise<T> => {
    try {
      return await runLimited(task);
    } catch (error) {
      errors.push({ section, message: errorMessage(error) });
      return fallback;
    }
  };

  const [
    dashboard,
    monthlyFinancials,
    payments,
    treasurySummary,
    treasuryMonthly,
    treasuryEntries,
    users,
    plans,
    planAuditLogs,
    leaderboard,
    feedback,
    communityPosts,
    communityComments,
    communityReports,
    communityRooms,
    blacklistKeywords,
    marketplaceItems,
    marketplaceReports,
    marketplaceDisputes,
    payouts,
    maintenance,
    announcement,
  ] = await Promise.all([
    capture("Tổng quan", null, () => getAdminDashboardAnalytics()),
    capture("Tài chính tháng", [], () => getAdminMonthlyFinancials(12)),
    capture("Thanh toán", [], loadAllPayments),
    capture("Tổng quan sổ quỹ", null, () => getPlatformTreasurySummary()),
    capture("Sổ quỹ theo tháng", [], () => getPlatformTreasuryMonthlySummaries(12)),
    capture("Sổ quỹ", [], loadAllTreasuryEntries),
    capture("Người dùng", [], loadAllUsers),
    capture("Gói dịch vụ", [], () => getSubscriptionPlans()),
    capture("Nhật ký gói", [], () => getSubscriptionPlanAuditLogs()),
    capture("Bảng điểm", [], loadAllLeaderboardEntries),
    capture("Feedback", [], loadAllFeedback),
    capture("Bài viết cộng đồng", [], loadAllCommunityPosts),
    capture("Bình luận cộng đồng", [], loadAllCommunityComments),
    capture("Báo cáo cộng đồng", [], loadAllCommunityReports),
    capture("Phòng cộng đồng", [], loadAllCommunityRooms),
    capture("Từ khóa chặn", [], () => getAdminCommunityBlacklist()),
    capture("Quiz Pack", [], loadAllMarketplaceItems),
    capture("Báo cáo Marketplace", [], loadAllMarketplaceReports),
    capture("Tranh chấp Marketplace", [], loadAllMarketplaceDisputes),
    capture("Rút tiền Creator", [], () => getAdminMarketplacePayouts()),
    capture("Bảo trì hệ thống", null, () => getMaintenanceConfig()),
    capture("Thông báo hệ thống", null, () => getAdminAnnouncement()),
  ]);

  const wallets = await loadWallets(users);
  const failedWalletCount = wallets.filter((record) => record.error !== null).length;
  if (failedWalletCount > 0) {
    errors.push({
      section: "Ví Coin",
      message: `Không tải được ${failedWalletCount}/${users.length} ví người dùng.`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    dashboard,
    monthlyFinancials,
    payments,
    treasurySummary,
    treasuryMonthly,
    treasuryEntries,
    users,
    wallets,
    plans,
    planAuditLogs,
    leaderboard,
    feedback,
    communityPosts,
    communityComments,
    communityReports,
    communityRooms,
    blacklistKeywords,
    marketplaceItems,
    marketplaceReports,
    marketplaceDisputes,
    payouts,
    maintenance,
    announcement,
    errors: errors.sort((left, right) => left.section.localeCompare(right.section, "vi")),
  };
}
