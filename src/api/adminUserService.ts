import { getAuthHeaders } from "./apiClient";
import { API_BASE } from "./config";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: string;
};

export type AdminUserDetail = AdminUserSummary & {
  createdAt?: string;
  updatedAt?: string;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  // Debug logging (development): do not remove — helps trace missing API data
  try {
    const safeHeaders = { ...headers } as Record<string,string>;
    if (safeHeaders.Authorization) safeHeaders.Authorization = "REDACTED";
    console.log("[adminUserService] request:", `${API_BASE}${path}`, safeHeaders, init?.method || "GET");

    const res = await fetch(`${API_BASE}${path}`, { headers, ...init });
    const text = await res.text().catch(() => null);
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

    console.log("[adminUserService] response:", res.status, payload);

    if (!res.ok) {
      if (res.status === 401) {
        window.dispatchEvent(new Event("session-kickout-triggered"));
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

export async function getAdminUsers(search?: string, page = 0, size = 10) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("size", String(size));
  const resp = await authFetch<any>(`/api/admin/users?${q.toString()}`);
  if (!resp.data) throw new Error(resp.message || "Empty response");
  // Backend returns PageResponse shape: {items, totalItems, page, size, totalPages}
  // Backend items have: {userId, email, emailVerified, fullName, status, roles, ...}
  // Normalize to expected shape: {content, totalElements} + map userId → id for consistency
  const normalized = {
    content: (resp.data.items || resp.data.content || []).map((item: any) => ({
      ...item,
      id: item.userId || item.id, // Ensure id field is set
      role: item.roles?.length ? item.roles[0] : undefined, // First role for display
    })),
    totalElements: resp.data.totalItems ?? resp.data.totalElements ?? 0,
  };
  console.log("[adminUserService] normalized response:", normalized);
  console.log("[adminUserService] first user item:", normalized.content?.[0]);
  return normalized;
}

export async function getAdminUser(userId: string) {
  console.log("[adminUserService] getAdminUser called with userId:", userId);
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}`);
  if (!resp.data) throw new Error(resp.message || "Empty response");
  // Normalize backend response to match expected shape
  const normalized = {
    ...resp.data,
    id: resp.data.userId || resp.data.id, // Ensure id field is set
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined, // First role for display
  };
  console.log("[adminUserService] normalized detail:", normalized);
  return normalized;
}

export async function updateUserStatus(userId: string, body: { status: string }) {
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!resp.data) throw new Error(resp.message || "Empty response");
  const normalized = {
    ...resp.data,
    id: resp.data.userId || resp.data.id,
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined,
  };
  return normalized;
}

export async function updateUserRole(userId: string, body: { role?: string; roles?: string[] }) {
  // Backend expects single role, convert from array if needed
  const role = body.role || body.roles?.[0] || "LEARNER";
  console.log("[adminUserService] updateUserRole - sending role:", role);
  const resp = await authFetch<any>(`/api/admin/users/${encodeURIComponent(userId)}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  if (!resp.data) throw new Error(resp.message || "Empty response");
  const normalized = {
    ...resp.data,
    id: resp.data.userId || resp.data.id,
    role: resp.data.roles?.length ? resp.data.roles[0] : undefined,
  };
  return normalized;
}

export default { getAdminUsers, getAdminUser, updateUserStatus, updateUserRole };
