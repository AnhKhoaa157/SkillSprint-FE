import { requestJson } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ServicePlanType = "FREE" | "SKILL_BUILDER" | "PREMIUM";

export type BusinessActionType =
  | "SERVICE_PLAN_CREATED"
  | "SERVICE_PLAN_UPDATED"
  | "SERVICE_PLAN_STATUS_UPDATED"
  | "SERVICE_PLAN_FEATURES_UPDATED";

export type BusinessEntityType = "SERVICE_PLAN";

export type ServicePlanQuota = {
  maxWorkspaces: number | null;
  maxUploads: number | null;
  aiGenerateLimit: number | null;
  maxFileMb: number | null;
  maxWorkspaceMb: number | null;
};

export type ServicePlanFeature = {
  featureId: string;
  featureKey: string;
  featureName: string;
  description: string | null;
  active: boolean;
  enabled: boolean;
};

export type ServicePlanResponse = {
  planId: string;
  planName: string;
  description: string | null;
  planType: ServicePlanType | null;
  monthlyPrice: number;
  currency: string;
  quotas: ServicePlanQuota | null;
  active: boolean;
  publicVisible: boolean | null;
  sortOrder: number | null;
  features: ServicePlanFeature[];
};

export type FeatureCatalogResponse = {
  featureId: string;
  featureKey: string;
  featureName: string;
  description: string | null;
  active: boolean;
};

export type AdminAuditLogResponse = {
  logId: string;
  adminUserId: string;
  adminEmail: string;
  entityType: BusinessEntityType;
  entityId: string;
  actionType: BusinessActionType;
  title: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: string;
};

// ─── Request Types ────────────────────────────────────────────────────────────

export type FeatureToggle = {
  featureKey: string;
  enabled: boolean;
};

export type CreateServicePlanRequest = {
  planName: string;
  description?: string;
  monthlyPrice: number;
  currency?: string;
  maxWorkspaces?: number;
  maxUploads?: number;
  aiGenerateLimit?: number;
  maxFileMb?: number;
  maxWorkspaceMb?: number;
  active?: boolean;
  publicVisible?: boolean;
  sortOrder?: number;
  features?: FeatureToggle[];
};

export type UpdateServicePlanRequest = {
  planName?: string;
  description?: string;
  monthlyPrice?: number;
  currency?: string;
  maxWorkspaces?: number;
  maxUploads?: number;
  aiGenerateLimit?: number;
  maxFileMb?: number;
  maxWorkspaceMb?: number;
  publicVisible?: boolean;
  sortOrder?: number;
};

export type UpdateServicePlanStatusRequest = {
  active?: boolean;
  publicVisible?: boolean;
};

export type UpdatePlanFeaturesRequest = {
  features: FeatureToggle[];
};

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getSubscriptionPlans(): Promise<ServicePlanResponse[]> {
  const res = await requestJson<ServicePlanResponse[]>("/api/admin/subscription-plans");
  if (!res.data) throw new Error(res.message || "Không tải được danh sách gói dịch vụ");
  return res.data;
}

export async function getSubscriptionPlanDetail(planId: string): Promise<ServicePlanResponse> {
  const res = await requestJson<ServicePlanResponse>(`/api/admin/subscription-plans/${planId}`);
  if (!res.data) throw new Error(res.message || "Không tải được chi tiết gói dịch vụ");
  return res.data;
}

export async function createSubscriptionPlan(request: CreateServicePlanRequest): Promise<ServicePlanResponse> {
  const res = await requestJson<ServicePlanResponse>("/api/admin/subscription-plans", {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không tạo được gói dịch vụ");
  return res.data;
}

export async function updateSubscriptionPlan(
  planId: string,
  request: UpdateServicePlanRequest,
): Promise<ServicePlanResponse> {
  const res = await requestJson<ServicePlanResponse>(`/api/admin/subscription-plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không cập nhật được gói dịch vụ");
  return res.data;
}

export async function updateSubscriptionPlanStatus(
  planId: string,
  request: UpdateServicePlanStatusRequest,
): Promise<ServicePlanResponse> {
  const res = await requestJson<ServicePlanResponse>(`/api/admin/subscription-plans/${planId}/status`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không cập nhật được trạng thái gói dịch vụ");
  return res.data;
}

export async function getPlanFeaturesCatalog(): Promise<FeatureCatalogResponse[]> {
  const res = await requestJson<FeatureCatalogResponse[]>("/api/admin/subscription-plans/features");
  if (!res.data) throw new Error(res.message || "Không tải được danh sách tính năng");
  return res.data;
}

export async function updatePlanFeatures(
  planId: string,
  request: UpdatePlanFeaturesRequest,
): Promise<ServicePlanResponse> {
  const res = await requestJson<ServicePlanResponse>(`/api/admin/subscription-plans/${planId}/features`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không cập nhật được tính năng gói dịch vụ");
  return res.data;
}

export async function getSubscriptionPlanAuditLogs(): Promise<AdminAuditLogResponse[]> {
  const res = await requestJson<AdminAuditLogResponse[]>("/api/admin/subscription-plans/audit-logs");
  if (!res.data) throw new Error(res.message || "Không tải được nhật ký thay đổi");
  return res.data;
}

// ─── Public / User-Facing Plan List ─────────────────────────────────────────
// GET /api/subscriptions/plans — returns active, publicVisible plans with only
// enabled features. Requires user auth (token sent automatically if present).

export type PublicPlanFeature = {
  featureKey: string;
  featureName: string;
  // The public endpoint returns only enabled features, so this is usually omitted/true.
  // Optional + forward-compatible: if the BE ever sends disabled rows, they render dimmed.
  enabled?: boolean;
};

export type PublicPlanResponse = {
  planId: string;
  planName: string;
  description: string | null;
  monthlyPrice: number;
  currency: string;
  quotas: ServicePlanQuota | null;
  features: PublicPlanFeature[];
};

export async function listSubscriptionPlans(): Promise<PublicPlanResponse[]> {
  const res = await requestJson<PublicPlanResponse[]>("/api/subscriptions/plans");
  if (!res.data) throw new Error(res.message || "Không tải được danh sách gói");
  return res.data;
}

/** True unless the feature is explicitly disabled (the public list only sends enabled ones). */
export function isFeatureEnabled(feature: PublicPlanFeature): boolean {
  return feature.enabled !== false;
}

/**
 * Localized price label. `<= 0` → "Miễn phí". Paid tiers are grouped with dots and
 * suffixed with the currency unit (VND → "đ"), e.g. 89000 → "89.000 đ", 199000 → "199.000 đ".
 * Robust to non-round amounts (unlike a hardcoded ".000" suffix).
 */
export function formatPlanPrice(monthlyPrice: number, currency: string = "VND"): string {
  if (!monthlyPrice || monthlyPrice <= 0) return "Miễn phí";
  const amount = new Intl.NumberFormat("vi-VN").format(monthlyPrice);
  const unit = !currency || currency.toUpperCase() === "VND" ? "đ" : currency;
  return `${amount} ${unit}`;
}

/**
 * Marketing fallback used when `listSubscriptionPlans()` is unavailable — e.g.
 * a logged-out guest on the public PricingPage (the endpoint requires auth), or a
 * transient network error. Lets public visitors still see tiers/features/layout.
 * Synthetic plans use "__"-prefixed planIds (pay via planType, not planId).
 */
export const STATIC_FALLBACK_PLANS: PublicPlanResponse[] = [
  {
    planId: "__free",
    planName: "Starter",
    description: "Công cụ cơ bản để tổ chức việc học.",
    monthlyPrice: 0,
    currency: "VND",
    quotas: { maxWorkspaces: 3, maxUploads: 5, aiGenerateLimit: 5, maxFileMb: 20, maxWorkspaceMb: 100 },
    features: [
      { featureKey: "task_management", featureName: "Quản lý công việc học tập" },
      { featureKey: "template_roadmap", featureName: "Lộ trình mẫu" },
      { featureKey: "community", featureName: "Tham gia cộng đồng" },
    ],
  },
  {
    planId: "__builder",
    planName: "Skill Builder",
    description: "Mở khóa lộ trình AI cá nhân hóa.",
    monthlyPrice: 89000,
    currency: "VND",
    quotas: { maxWorkspaces: 10, maxUploads: 50, aiGenerateLimit: 50, maxFileMb: 50, maxWorkspaceMb: 500 },
    features: [
      { featureKey: "ai_roadmap", featureName: "Lộ trình AI cá nhân hóa" },
      { featureKey: "skill_gap", featureName: "Phát hiện lỗ hổng kỹ năng" },
      { featureKey: "ai_resource", featureName: "Gợi ý tài nguyên học bằng AI" },
    ],
  },
  {
    planId: "__premium",
    planName: "Gói Premium",
    description: "Bộ công cụ tăng tốc học tập với Gia sư AI và Quiz nhỏ theo chương.",
    monthlyPrice: 199000,
    currency: "VND",
    quotas: { maxWorkspaces: null, maxUploads: null, aiGenerateLimit: null, maxFileMb: 100, maxWorkspaceMb: null },
    features: [
      { featureKey: "ai_tutor", featureName: "Gia sư AI 24/7 cá nhân hóa" },
      { featureKey: "ai_auto_resource", featureName: "AI tự động tìm tài nguyên" },
      { featureKey: "quiz", featureName: "Quiz nhỏ và thống kê tiến độ" },
      { featureKey: "priority_ai", featureName: "Ưu tiên xử lý AI không giới hạn" },
    ],
  },
];
