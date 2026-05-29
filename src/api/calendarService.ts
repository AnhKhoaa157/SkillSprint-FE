import { getStoredAuthSession } from "./authService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type GenerateCalendarRequest = {
  startDate?: string | null;
  endDate?: string | null;
  studyDays?: WeekDay[] | null;
  dailyStartTime?: string | null;
  sessionMinutes?: number | null;
  sessionsPerDay?: number | null;
  includeReviewSessions?: boolean | null;
};

export type CalendarTaskResponse = {
  taskId: string;
  workspaceId: string;
  roadmapId?: string | null;
  roadmapStepId?: string | null;
  title: string;
  description?: string | null;
  taskDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  source?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CalendarScheduleRunResponse = {
  runId: string;
  workspaceId: string;
  roadmapId?: string | null;
  scheduleScope?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  availableDays?: WeekDay[] | null;
  preferredSessionMinutes?: number | null;
  maxSessionsPerDay?: number | null;
  includeReviewSessions?: boolean;
  status?: string | null;
  createdAt?: string | null;
  confirmedAt?: string | null;
  tasks?: CalendarTaskResponse[] | null;
};

export type UpdateCalendarTaskRequest = {
  taskDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
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

export async function generateCalendarSchedule(workspaceId: string, body: GenerateCalendarRequest): Promise<CalendarScheduleRunResponse> {
  const res = await requestJson<CalendarScheduleRunResponse>(`/api/workspaces/${workspaceId}/calendar/generate`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to generate calendar schedule");
  }

  return res.data;
}

export async function getCalendarTasks(workspaceId: string): Promise<CalendarTaskResponse[]> {
  const res = await requestJson<CalendarTaskResponse[]>(`/api/workspaces/${workspaceId}/calendar/tasks`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  return res.data || [];
}

export async function updateCalendarTask(taskId: string, body: UpdateCalendarTaskRequest): Promise<CalendarTaskResponse> {
  const res = await requestJson<CalendarTaskResponse>(`/api/calendar/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to update calendar task");
  }

  return res.data;
}

export async function completeCalendarTask(taskId: string): Promise<CalendarTaskResponse> {
  const res = await requestJson<CalendarTaskResponse>(`/api/calendar/tasks/${taskId}/complete`, {
    method: "PATCH",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to complete calendar task");
  }

  return res.data;
}

export default {
  generateCalendarSchedule,
  getCalendarTasks,
  updateCalendarTask,
  completeCalendarTask,
};