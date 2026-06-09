import { requestJson } from "./apiClient";

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
  
  preferredDays: WeekDay[];

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

// Sends a single JSON DTO; do not append duplicated query-string aliases.
export async function generateCalendarSchedule(workspaceId: string, body: GenerateCalendarRequest): Promise<CalendarScheduleRunResponse> {
  const payload: GenerateCalendarRequest = {
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
    preferredDays: Array.from(new Set(body.preferredDays.map(day => day.trim().toUpperCase() as WeekDay).filter(Boolean))),
    dailyStartTime: body.dailyStartTime ?? null,
    sessionMinutes: body.sessionMinutes ?? null,
    sessionsPerDay: body.sessionsPerDay ?? null,
    includeReviewSessions: body.includeReviewSessions ?? null,
  };

  const res = await requestJson<CalendarScheduleRunResponse>(`/api/workspaces/${workspaceId}/calendar/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to generate calendar schedule");
  }

  return res.data;
}

export async function getCalendarTasks(workspaceId: string): Promise<CalendarTaskResponse[]> {
  const res = await requestJson<CalendarTaskResponse[]>(`/api/workspaces/${workspaceId}/calendar/tasks`, {
    method: "GET",
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
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to complete calendar task");
  }
  return res.data;
}

// ─── Eisenhower Matrix ────────────────────────────────────────────────────────

export type EisenhowerQuadrant = "DO_NOW" | "SCHEDULE" | "DELAY_OR_DELEGATE" | "ELIMINATE";

export type EisenhowerTask = {
  taskId: string;
  title: string;
  description?: string | null;
  quadrant: EisenhowerQuadrant;
  status?: string | null;
  priority?: string | null;
  taskDate?: string | null;
  durationMinutes?: number | null;
  source?: string | null;
};

export type EisenhowerBoardResponse = Record<EisenhowerQuadrant, EisenhowerTask[]>;

export type CreateEisenhowerTaskRequest = {
  title: string;
  quadrant: EisenhowerQuadrant;
  status: string;
};

export type UpdateTaskStatusRequest = {
  status: string;
};

type EisenhowerRawQuadrantItem = {
  quadrant: string;
  tasks: EisenhowerTask[];
};

type EisenhowerRawApiData = {
  workspaceId: string;
  date: string;
  quadrants: EisenhowerRawQuadrantItem[];
};

export async function getEisenhowerTasks(workspaceId: string): Promise<EisenhowerBoardResponse> {
  const res = await requestJson<EisenhowerRawApiData>(
    `/api/workspaces/${workspaceId}/eisenhower-tasks`,
    { method: "GET" },
  );

  const board: EisenhowerBoardResponse = { DO_NOW: [], SCHEDULE: [], DELAY_OR_DELEGATE: [], ELIMINATE: [] };

  for (const item of res.data?.quadrants ?? []) {
    const key = item.quadrant as EisenhowerQuadrant;
    if (key in board) {
      board[key] = item.tasks ?? [];
    }
  }

  return board;
}

export async function createCalendarTask(workspaceId: string, body: CreateEisenhowerTaskRequest): Promise<CalendarTaskResponse> {
  const res = await requestJson<CalendarTaskResponse>(
    `/api/workspaces/${workspaceId}/calendar/tasks`,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (!res.data) throw new Error(res.message || "Failed to create task");
  return res.data;
}

export async function updateCalendarTaskStatus(workspaceId: string, taskId: string, body: UpdateTaskStatusRequest): Promise<CalendarTaskResponse> {
  const res = await requestJson<CalendarTaskResponse>(
    `/api/workspaces/${workspaceId}/calendar/tasks/${taskId}/status`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  if (!res.data) throw new Error(res.message || "Failed to update task status");
  return res.data;
}

const calendarService = {
  generateCalendarSchedule,
  getCalendarTasks,
  updateCalendarTask,
  completeCalendarTask,
  getEisenhowerTasks,
  createCalendarTask,
  updateCalendarTaskStatus,
};

export default calendarService;
