import { requestJson, type ApiResponse } from "../core/apiClient";

export type StudySessionStatus = "IN_PROGRESS" | "COMPLETED" | string;
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | string;
export type RoadmapStepStatus = "UPCOMING" | "CURRENT" | "COMPLETED" | "SKIPPED" | string;

// ---- Pomodoro Timer Types ----

export type PomodoroPhase = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK" | string;
export type PomodoroSessionStatus = "IN_PROGRESS" | "PAUSED" | "COMPLETED" | string;

export type PomodoroTimerResponse = {
  pomodoroId: string;
  status: PomodoroSessionStatus;
  currentPhase: PomodoroPhase;
  currentCycle: number;
  totalCycles: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  remainingSeconds: number;
  phaseStartedAt: string | null;
  phaseEndAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  completedFocusMinutes: number;
};

// ---- Existing Types ----

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
  // The authoritative StudySession snapshot (status + latest Pomodoro). Nested by
  // the backend; may be null when the task has no session yet.
  session: StudySessionResponse | null;
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
  taskCompleted: boolean | null;
  minimumRequiredMinutes: number | null;
  pomodoro: PomodoroTimerResponse | null;
};

export type FinishStudySessionRequest = {
  notes?: string;
  focusScore?: number;
};

// ------------------------------------------------------------------
// NEW: Short response type for start/complete operations on the
// workspace-based study session endpoints (Pomodoro from roadmap).
// ------------------------------------------------------------------
export type StartStudySessionResponse = {
  sessionId: string;
  workspaceId?: string;
  roadmapStepId?: string;
  status?: string;
  startedAt?: string | null;
  [key: string]: unknown;
};

// ------------------------------------------------------------------
// Pomodoro config that can be passed when starting a study session.
// ------------------------------------------------------------------
export type StartStudySessionRequest = {
  usePomodoro?: boolean;
  focusMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  totalCycles?: number;
};

// ==================================================================
// Helper: Safely unwrap the unified backend response.
// Uses `res?.data || res` to handle both wrapped and direct payloads.
// ==================================================================
function unwrapData<T>(res: ApiResponse<T> | unknown): T {
  const cleanData = (res as any)?.data || res;
  if (cleanData && typeof cleanData === "object") {
    return cleanData as T;
  }
  throw new Error((res as any)?.message || "Operation failed");
}

// ==================================================================
// EXISTING endpoints (refactored with the safe unwrap pattern)
// ==================================================================

export async function getStudySessionDetail(taskId: string): Promise<StudySessionDetailResponse> {
  const res = await requestJson<StudySessionDetailResponse>(`/api/calendar/tasks/${taskId}/study-session`, {
    method: "GET",
  });

  return unwrapData<StudySessionDetailResponse>(res);
}

export async function startStudySession(
  taskId: string,
  request?: StartStudySessionRequest,
): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/calendar/tasks/${taskId}/sessions/start`, {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });

  const cleanData = unwrapData<StudySessionResponse>(res);
  if (cleanData && typeof cleanData === "object" && cleanData.sessionId) {
    return cleanData;
  }
  throw new Error((res as any)?.message || "Operation failed");
}

export async function getStudySession(sessionId: string): Promise<StudySessionDetailResponse> {
  const res = await requestJson<StudySessionDetailResponse>(`/api/study-sessions/${sessionId}`, {
    method: "GET",
  });

  return unwrapData<StudySessionDetailResponse>(res);
}

/**
 * GET /api/study-sessions/{sessionId}
 * Returns the live session state — including the authoritative `pomodoro`
 * snapshot (remainingSeconds, currentPhase, phaseEndAt, status). Used to
 * re-hydrate the timer after an F5 refresh without resetting the BE session.
 */
export async function getStudySessionState(sessionId: string): Promise<StudySessionResponse | null> {
  const res = await requestJson<StudySessionDetailResponse>(`/api/study-sessions/${sessionId}`, {
    method: "GET",
  });

  // GET /api/study-sessions/{sessionId} returns the session detail envelope; the
  // authoritative timer snapshot lives under `.session`.
  const detail = unwrapData<StudySessionDetailResponse>(res);
  return detail.session ?? null;
}

// ==================================================================
// POMODORO ENDPOINTS (with safe unwrap)
// ==================================================================

/**
 * POST /api/study-sessions/{sessionId}/pomodoro/pause
 */
export async function pausePomodoro(sessionId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/pomodoro/pause`, {
    method: "POST",
  });

  return unwrapData<StudySessionResponse>(res);
}

/**
 * POST /api/study-sessions/{sessionId}/pomodoro/resume
 */
export async function resumePomodoro(sessionId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/pomodoro/resume`, {
    method: "POST",
  });

  return unwrapData<StudySessionResponse>(res);
}

/**
 * POST /api/study-sessions/{sessionId}/pomodoro/next-phase
 */
export async function nextPomodoroPhase(sessionId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/pomodoro/next-phase`, {
    method: "POST",
  });

  return unwrapData<StudySessionResponse>(res);
}

/**
 * POST /api/study-sessions/{sessionId}/pomodoro/skip
 *
 * Manual "Bỏ qua" (skip) of the current phase. Distinct from `nextPomodoroPhase`
 * (natural expiry): the backend credits only the focus minutes actually spent —
 * measured server-side — so skipping a focus phase never awards the full cycle.
 * Always trust the returned session/pomodoro snapshot as the source of truth.
 */
export async function skipPomodoroPhase(sessionId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/pomodoro/skip`, {
    method: "POST",
  });

  return unwrapData<StudySessionResponse>(res);
}

/**
 * POST /api/study-sessions/{sessionId}/pomodoro/finish
 */
export async function finishPomodoro(sessionId: string): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/pomodoro/finish`, {
    method: "POST",
  });

  return unwrapData<StudySessionResponse>(res);
}

/**
 * POST /api/study-sessions/{sessionId}/finish
 */
export async function finishStudySession(
  sessionId: string,
  request?: FinishStudySessionRequest,
): Promise<StudySessionResponse> {
  const res = await requestJson<StudySessionResponse>(`/api/study-sessions/${sessionId}/finish`, {
    method: "POST",
    body: request ? JSON.stringify(request) : JSON.stringify({}),
  });

  const cleanData = unwrapData<StudySessionResponse>(res);
  if (cleanData && typeof cleanData === "object" && cleanData.sessionId) {
    return cleanData;
  }
  throw new Error((res as any)?.message || "Operation failed");
}

export default {
  getStudySessionDetail,
  getStudySession,
  getStudySessionState,
  startStudySession,
  pausePomodoro,
  resumePomodoro,
  nextPomodoroPhase,
  skipPomodoroPhase,
  finishPomodoro,
  finishStudySession,
};