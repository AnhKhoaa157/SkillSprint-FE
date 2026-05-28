import { getStoredAuthSession } from "./authService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type RoadmapResource = {
  title?: string;
  url?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
};

export type RoadmapStep = {
  title?: string;
  description?: string;
  summary?: string;
  difficulty?: string;
  complexity?: string;
  durationMinutes?: number | string;
  duration?: number | string;
  minutes?: number | string;
  resources?: RoadmapResource[];
  [key: string]: unknown;
};

export type RoadmapResponse = {
  id?: string;
  workspaceId?: string;
  status?: string;
  title?: string;
  description?: string;
  steps?: RoadmapStep[];
  resources?: RoadmapResource[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

function buildAuthHeaders(token: string | null, includeJsonContentType = true) {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

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
    const message = payload?.message || `Server error: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error("Invalid response from server");
  }

  return payload;
}

export async function getRoadmap(workspaceId: string): Promise<RoadmapResponse | null> {
  if (!workspaceId) {
    return null;
  }

  const res = await requestJson<RoadmapResponse>(`/api/workspaces/${workspaceId}/roadmaps/current`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  return res.data || null;
}

export async function generateRoadmap(workspaceId: string): Promise<RoadmapResponse> {
  const res = await requestJson<RoadmapResponse>(`/api/workspaces/${workspaceId}/roadmaps/generate`, {
    method: "POST",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to generate roadmap");
  }

  return res.data;
}

export default {
  getRoadmap,
  generateRoadmap,
};