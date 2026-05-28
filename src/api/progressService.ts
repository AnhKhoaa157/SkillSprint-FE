import { getStoredAuthSession } from "./authService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type RoadmapStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export type RoadmapStepStatus = "UPCOMING" | "CURRENT" | "COMPLETED";

export type ProgressCurrentStepResponse = {
  stepId: string;
  title: string;
  sequenceNo: number;
  status: RoadmapStepStatus;
};

export type ProgressCalendarTaskResponse = {
  taskId: string;
  workspaceId: string;
  roadmapId: string | null;
  roadmapStepId: string | null;
  title: string;
  description: string | null;
  taskDate: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  source: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProgressDashboardResponse = {
  workspaceId: string;
  roadmapId: string;
  roadmapStatus: RoadmapStatus;
  progressPercent: number;
  totalSteps: number;
  completedSteps: number;
  totalTasks: number;
  completedTasks: number;
  todayTaskCount: number;
  overdueTaskCount: number;
  today: string;
  currentStep: ProgressCurrentStepResponse | null;
  todayTasks: ProgressCalendarTaskResponse[];
  overdueTasks: ProgressCalendarTaskResponse[];
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

export async function getProgressDashboard(workspaceId: string): Promise<ProgressDashboardResponse | null> {
  if (!workspaceId) {
    return null;
  }

  const res = await requestJson<ProgressDashboardResponse>(`/api/workspaces/${workspaceId}/progress`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  return res.data || null;
}

export default {
  getProgressDashboard,
};