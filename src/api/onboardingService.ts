const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

import { getStoredAuthSession } from "./authService";

export type UpsertOnboardingProfileRequest = {
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null; // YYYY-MM-DD
  confidence: "HIGH" | "MEDIUM" | "LOW";
  preferredLanguage?: string | null;
  preferredDays?: string[] | null;
  preferredTimeSlots?: string[] | null;
};

export type OnboardingProfileResponse = {
  profileId: string;
  workspaceId: string;
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null;
  confidence: string;
  preferredLanguage?: string | null;
  preferredDays: string[];
  preferredTimeSlots: string[];
  createdAt: string;
  updatedAt?: string | null;
};

async function request<T>(path: string, opts: RequestInit = {}) {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any || {}) };
  if (session?.accessToken) headers["Authorization"] = `Bearer ${session.accessToken}`;
  if (session?.sessionId) headers["X-Session-Id"] = session.sessionId;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const payload = await res.json().catch(() => null) as ApiResponse<T> | null;
  if (!res.ok) {
    const err: any = new Error(payload?.message || `Server error ${res.status}`);
    (err as any).status = res.status;
    (err as any).payload = payload;
    throw err;
  }
  return payload as ApiResponse<T>;
}

export async function fetchOnboardingProfile(workspaceId: string) {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) headers["Authorization"] = `Bearer ${session.accessToken}`;
  if (session?.sessionId) headers["X-Session-Id"] = session.sessionId;

  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/onboarding`, { method: "GET", headers });
  const payload = await res.json().catch(() => null) as ApiResponse<OnboardingProfileResponse> | null;
  if (res.status === 404) {
    return { success: false, code: 404, message: "Not found", data: null } as ApiResponse<OnboardingProfileResponse>;
  }
  if (!res.ok) {
    const err: any = new Error(payload?.message || `Server error ${res.status}`);
    (err as any).status = res.status;
    (err as any).payload = payload;
    throw err;
  }
  return payload as ApiResponse<OnboardingProfileResponse>;
}

export async function upsertOnboardingProfile(workspaceId: string, body: UpsertOnboardingProfileRequest) {
  return request<OnboardingProfileResponse>(`/api/workspaces/${workspaceId}/onboarding`, { method: "PUT", body: JSON.stringify(body) });
}

export default { fetchOnboardingProfile, upsertOnboardingProfile };
