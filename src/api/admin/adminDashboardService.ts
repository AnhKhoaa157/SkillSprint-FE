import { requestJson } from "../core/apiClient";

export type DateRange = {
  from: string | null;
  to: string | null;
};

export type OverviewStats = {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  todayRevenue: number;
};

export type UserStats = {
  total: number;
  active: number;
  disabled: number;
  newToday: number;
  newInRange: number;
  emailVerified: number;
  unverified: number;
};

export type WorkspaceStats = {
  total: number;
  active: number;
  archived: number;
};

export type SubscriptionStats = {
  trial: number;
  active: number;
  expired: number;
  canceled: number;
  pastDue: number;
  free: number;
  skillBuilder: number;
  premium: number;
};

export type PaymentStats = {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  canceled: number;
  expired: number;
  revenueTotal: number;
  revenueToday: number;
  revenueThisMonth: number;
};

export type ChartDataPoint = {
  date: string;
  revenue?: number;
  count?: number;
};

export type ChartStats = {
  revenueByDay: ChartDataPoint[];
  newUsersByDay: ChartDataPoint[];
};

export type AlertStats = {
  pendingPaymentsOverdue: number;
  failedPayments: number;
  failedMaterialProcessing: number;
  unverifiedUsers: number;
};

export type RecentUser = {
  userId: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export type PaymentTransactionResponse = {
  paymentId: string;
  status: string;
  plan: string;
  amount: number;
  currency: string;
  paymentCode: string | null;
  qrUrl: string | null;
  providerTransactionId: string | null;
  providerReferenceCode: string | null;
  expiredAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardResponse = {
  generatedAt: string;
  range: DateRange;
  overview: OverviewStats;
  users: UserStats;
  workspaces: WorkspaceStats;
  subscriptions: SubscriptionStats;
  payments: PaymentStats;
  charts: ChartStats;
  alerts: AlertStats;
  recentUsers: RecentUser[];
  recentPayments: PaymentTransactionResponse[];
};

export type PageResponse<T> = {
  items: T[];
  totalItems: number;
  page: number;
  size: number;
  totalPages: number;
  // fallback keys used by some BE versions
  content?: T[];
  totalElements?: number;
};

export async function getAdminDashboardAnalytics(): Promise<AdminDashboardResponse> {
  const res = await requestJson<AdminDashboardResponse>("/api/admin/dashboard");
  if (!res.data) throw new Error(res.message || "Không tải được dữ liệu dashboard");
  return res.data;
}

export async function getAdminPayments(
  page: number,
  size: number,
): Promise<PageResponse<PaymentTransactionResponse>> {
  const res = await requestJson<PageResponse<PaymentTransactionResponse>>(
    `/api/admin/payments?page=${page}&size=${size}`,
  );
  if (!res.data) throw new Error(res.message || "Không tải được danh sách thanh toán");
  return res.data;
}
