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