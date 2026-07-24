import { getAuthHeaders } from "../core/apiClient";
import { triggerSessionExpiry, extractAuthCode } from "../auth/sessionExpiry";
import { API_BASE } from "../core/config";
import type { ServicePlanType } from "./adminSubscriptionPlansService";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

// 🟢 ĐÃ CẬP NHẬT: Thêm các trường Visual và PlanType trực tiếp vào đây để hứng data phẳng từ User DTO
export type SubscriptionAdminResponse = {
  subscriptionId: string | null;
  planName: string | null;
  planType: string | null; // Phục vụ luồng fallback và check Vô hạn
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  badgeColor?: string | null;
  badgeIcon?: string | null;
  animationType?: string | null;
};

export interface AdminUserResponse {
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  timeZone: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentSubscription: SubscriptionAdminResponse | null;
}

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: "ACTIVE" | "DISABLE";
  currentSubscription?: SubscriptionAdminResponse | null;
};

export type AdminUserDetail = AdminUserSummary & {
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  timeZone?: string;
  lastLoginAt?: string | null;
};

export type AdminUserPage = {
  content: AdminUserDetail[];
  totalElements: number;
};

export type AdminUserRole = "LEARNER" | "ADMIN";
export type AdminUserSortField = "createdAt" | "fullName";
export type AdminUserSortDirection = "ASC" | "DESC";

export type AdminUserStats = {
  totalUsers: number;
  activeUsers: number;
  learnerUsers: number;
  adminUsers: number;
};

export type SubscriptionPlanType = "FREE" | "SKILL_BUILDER" | "PREMIUM" | "ADMIN_DEFAULT";

export type UpdateUserSubscriptionRequest = {
  planType: SubscriptionPlanType;
};

export type CurrentSubscriptionPlan = {
  planId: string;
  planName: string;
  description: string | null;
  benefits: string[];
  badgeColor: string | null;
  badgeIcon: string | null;
  animationType: string | null;
  monthlyPrice: number;
  currency: string;
  quotas: {
    maxWorkspaces: number | null;
    maxUploads: number | null;
    aiGenerateLimit: number | null;
    maxFileMb: number | null;
    maxWorkspaceMb: number | null;
  } | null;
};

export type CurrentSubscriptionResponse = {
  subscriptionId: string;
  plan: CurrentSubscriptionPlan;
  startDate: string | null;
  endDate: string | null;
  startAt: string | null;
  endAt: string | null;
  status: string;
  createdAt: string;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers, ...init });
    const text = await res.text().catch(() => null);
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

    if (!res.ok) {
      if (res.status === 401) {
        triggerSessionExpiry({ status: 401, code: extractAuthCode(payload) });
      }
      const message = payload?.message || `Server error ${res.status}`;
      throw new Error(message);
    }

    return payload as ApiResponse<T>;
  } catch (err) {
    console.error('[adminUserService] fetch error', err);
    throw err;
  }
}

export async function getAdminUsers(
  search?: string,
  page = 0,
  size = 10,
  role?: AdminUserRole,
  planType?: ServicePlanType,
  sortBy: AdminUserSortField = "createdAt",
  sortDirection: AdminUserSortDirection = "DESC",
): Promise<AdminUserPage> {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (role) q.set("role", role);
  if (planType) q.set("planType", planType);
  q.set("page", String(page));
  q.set("size", String(size));
  q.set("sortBy", sortBy);
  q.set("sortDirection", sortDirection);
  q.set("_t", String(Date.now())); // Bypass browser/proxy HTTP caches
  const resp = await authFetch<any>(`/api/admin/users?${q.toString()}`);
  if (!resp.data) throw new Error(resp.message || "Empty response");

  return {
    content: (resp.data.items || resp.data.content || []).map((item: any) => ({
      ...item,
      id: item.userId || item.id,
      role: item.roles?.length ? item.roles[0] : undefined,
      currentSubscription: item.currentSubscription ?? null,
    })),
    totalElements: resp.data.totalItems ?? resp.data.totalElements ?? 0,
  };
}

export async function getAdminUserSummary(search?: string): Promise<AdminUserStats> {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  q.set("_t", String(Date.now()));
  const resp = await authFetch<AdminUserStats>(`/api/admin/users/summary?${q.toString()}`);
  if (!resp.data) throw new Error(resp.message || "Empty response");
  return resp.data;
}

export async function getAdminUser(userId: string) {
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}?_t=${Date.now()}`);
  if (!resp.data) throw new Error(resp.message || "Empty response");

  return {
    ...resp.data,
    id: resp.data.userId || resp.data.id,
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined,
    currentSubscription: resp.data.currentSubscription ?? null,
  };
}

export async function updateUserStatus(userId: string, body: { status: "ACTIVE" | "DISABLE" }) {
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!resp.data) throw new Error(resp.message || "Empty response");
  return {
    ...resp.data,
    id: resp.data.userId || resp.data.id,
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined,
  };
}

export async function updateUserRole(userId: string, body: { role?: string; roles?: string[] }) {
  const role = body.role || body.roles?.[0] || "LEARNER";
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  if (!resp.data) throw new Error(resp.message || "Empty response");
  return {
    ...resp.data,
    id: resp.data.userId || resp.data.id,
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined,
  };
}

export async function updateUserSubscription(
  userId: string,
  body: UpdateUserSubscriptionRequest,
): Promise<CurrentSubscriptionResponse> {
  const resp = await authFetch<CurrentSubscriptionResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/subscription`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  if (!resp.data) throw new Error(resp.message || "Empty response");
  return resp.data;
}

export default { getAdminUsers, getAdminUserSummary, getAdminUser, updateUserStatus, updateUserRole, updateUserSubscription };
