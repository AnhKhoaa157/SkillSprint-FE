const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

import { getStoredAuthSession } from "./authService";

export type MeResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string;
  timeZone: string;
  status: string;
  roles: string[];
};

export type UpdateMeRequest = {
  fullName: string;
};

async function requestJson<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const error: any = new Error(payload?.message || `Server error: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (!payload) {
    throw new Error("Invalid response from server");
  }

  return payload;
}

export async function getMe(): Promise<MeResponse> {
  const res = await requestJson<MeResponse>("/api/me", { method: "GET" });
  if (!res.data) throw new Error(res.message || "Fetch profile failed");
  return res.data;
}

export async function updateMe(req: UpdateMeRequest): Promise<MeResponse> {
  const res = await requestJson<MeResponse>("/api/me", {
    method: "PATCH",
    body: JSON.stringify(req),
  });
  if (!res.data) throw new Error(res.message || "Update profile failed");
  return res.data;
}

export default { getMe, updateMe };
