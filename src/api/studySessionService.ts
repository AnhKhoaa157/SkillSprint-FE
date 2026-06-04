import { getStoredAuthSession } from "./authService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type StudySessionStatus = "IN_PROGRESS" | "COMPLETED" | string;
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | string;
export type RoadmapStepStatus = "UPCOMING" | "CURRENT" | "COMPLETED" | "SKIPPED" | string;

export type CalendarTaskResponse = {
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
  overdue: boolean;
  studySessionEndpoint: string | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RoadmapStepStudyResponse = {
  stepId: string;
  chapterId: string | null;
  topicId: string | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  whatToLearn: string[];
  keyConcepts: string[];
  learningOutcomes: string[];
  recommendedFocus: string[];
  difficulty: DifficultyLevel | null;
  estimatedMinutes: number | null;
  sequenceNo: number | null;
  status: RoadmapStepStatus | null;
};

export type PracticePromptResponse = {
  prompt: string;
  expectedOutput: string;
};

export type RoadmapResourceResponse = {
  resourceId?: string;
  title?: string | null;
  platform?: string | null;
  resourceType?: string | null;
  searchQuery?: string | null;
  content?: string | null;
  url?: string | null;
  reason?: string | null;
  aiRecommended?: boolean;
  sequenceNo?: number | null;
  createdAt?: string | null;
};

export type StudySessionActionsResponse = {
  canStart: boolean;
  canFinish: boolean;
  canCompleteTask: boolean;
  startEndpoint: string;
  finishEndpointTemplate: string;
  completeTaskEndpoint: string;
};

export type StudySessionDetailResponse = {
  task: CalendarTaskResponse;
  roadmapStep: RoadmapStepStudyResponse;
  practice: PracticePromptResponse;
  resources: RoadmapResourceResponse[];
  actions: StudySessionActionsResponse;
};

export type StudySessionResponse = {
  sessionId: string;
  workspaceId: string;
  calendarTaskId: string;
  roadmapStepId: string;
  status: StudySessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  focusScore: number | null;
};

export type FinishStudySessionRequest = {
  notes?: string;
  focusScore?: number;
};

function buildAuthHeaders(token: string | null, includeJsonContentType = true) {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const session = getStoredAuthSession();
  if (session?.sessionId) {
    headers["X-Session-Id"] = session.sessionId;
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

  if (session?.sessionId) {
    headers["X-Session-Id"] = session.sessionId;
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

export async function getStudySessionDetail(taskId: string): Promise<StudySessionDetailResponse> {
  const res = await requestJson<StudySessionDetailResponse>(`/api/calendar/tasks/${taskId}/study-session`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to load study session detail");
  }

  return res.data;
}

export async function startStudySession(taskId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/calendar/tasks/${taskId}/sessions/start`, {
    method: "POST",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to start study session");
  }

  return res.data;
}

export async function finishStudySession(
  sessionId: string,
  request?: FinishStudySessionRequest,
): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/finish`, {
    method: "POST",
    body: request ? JSON.stringify(request) : JSON.stringify({}),
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to finish study session");
  }

  return res.data;
}

export default {
  getStudySessionDetail,
  startStudySession,
  finishStudySession,
};