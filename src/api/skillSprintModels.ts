export type ReminderType = "GENERAL" | string;

export type CreateReminderRequest = {
  message: string;
  scheduledAt: string;
  reminderType?: ReminderType;
};

export type NotificationResponse = {
  notificationId: string;
  workspaceId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ServicePlanType = "FREE" | "SKILL_BUILDER" | "PREMIUM" | string;

export type ServicePlanResponse = {
  planId: string;
  planName: string;
  planType: ServicePlanType;
  monthlyPrice: number;
  maxWorkspaces: number | null;
  maxUploads: number | null;
  aiGenerateLimit: number | null;
  maxFileMb: number | null;
  maxWorkspaceMb: number | null;
  active: boolean;
};

export type CurrentSubscriptionResponse = {
  subscriptionId: string;
  plan: ServicePlanResponse;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
};

export type QuotaStatusResponse = {
  planType: ServicePlanType;
  planName: string;
  maxWorkspaces: number | null;
  usedWorkspaces: number | null;
  remainingWorkspaces: number | null;
  maxUploads: number | null;
  usedUploads: number | null;
  remainingUploads: number | null;
  aiGenerateLimit: number | null;
  usedAiGenerate: number | null;
  remainingAiGenerate: number | null;
  maxFileMb: number | null;
  maxWorkspaceMb: number | null;
  usedStorageBytes: number | null;
  usedStorageMb: number | null;
  remainingStorageMb: number | null;
};

/* ─── Sepay Payment Types ─── */

/** Request body for POST /api/payments/sepay/create.
 *  The BE accepts EITHER planId (UUID, preferred — resolves any payable plan) OR
 *  planType (legacy enum). Provide one of them. */
export type CreateSepayPaymentRequest = {
  planId?: string;
  planType?: ServicePlanType;
};

/** Bank account details returned inside the payment creation response */
export type SepayBankInfo = {
  bankCode: string;
  accountNumber: string;
  accountName: string;
};

/** Response from POST /api/payments/sepay/create */
export type SepayPaymentCreateResponse = {
  paymentId: string;
  status: string;
  plan: ServicePlanType;
  amount: number;
  currency: string;
  paymentCode: string;
  qrUrl: string;
  bank: SepayBankInfo;
  expiredAt: string;
};

/** Response from GET /api/payments/{paymentId} */
export type SepayPaymentDetailResponse = {
  paymentId: string;
  status: string;
  plan: ServicePlanType;
  amount: number;
  currency: string;
  paymentCode: string;
  qrUrl: string;
  providerTransactionId: string | null;
  providerReferenceCode: string | null;
  expiredAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

/** Transaction item inside GET /api/payments/me */
export type SepayTransactionItem = {
  paymentId: string;
  planType: ServicePlanType;
  amount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

/** Response from GET /api/payments/me */
export type SepayTransactionHistoryResponse = {
  transactions: SepayTransactionItem[];
  total: number;
  page: number;
  size: number;
};

/* ─── Points / Leaderboard / Scoring ─── */

/** Leaderboard scope. Maps to the BE endpoints /api/leaderboard/{weekly|monthly|all-time}. */
export type LeaderboardPeriod = "weekly" | "monthly" | "all-time";

/** GET /api/leaderboard/me — the logged-in user's own points + per-scope ranks. */
export type UserPointSummary = {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  streakDays: number;
  lastPointDate: string | null;
  /** null when the user has no points in that scope yet (i.e. unranked). */
  weeklyRank: number | null;
  monthlyRank: number | null;
  allTimeRank: number | null;
};

/** A single row of any leaderboard scope. `avatarObjectKey` is an S3 key, not a URL. */
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string | null;
  avatarObjectKey: string | null;
  points: number;
};

/** GET /api/leaderboard/{weekly|monthly|all-time}. */
export type LeaderboardResponse = {
  period: string;
  periodStart: string | null;
  periodEnd: string | null;
  entries: LeaderboardEntry[];
};

/**
 * One admin manual-adjustment audit entry (GET /api/admin/users/{id}/point-history).
 * Denormalized: `adminFullName` ("Performed By") is rendered directly — never resolve
 * it via a second relational fetch on the client (avoids client-side N+1).
 */
export type PointHistoryLog = {
  logId: string;
  targetUserId: string;
  targetFullName: string | null;
  adminUserId: string | null;
  adminFullName: string | null;
  scoreDelta: number;
  reason: string;
  balanceAfter: number | null;
  createdAt: string;
};

/** PATCH /api/admin/users/{id}/adjust-score body. `scoreDelta` may be negative. */
export type AdjustUserPointsRequest = {
  scoreDelta: number;
  reason: string;
};