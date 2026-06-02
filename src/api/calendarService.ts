import { requestJson, type ApiResponse } from "./apiClient";

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

export default {
  generateCalendarSchedule,
  getCalendarTasks,
  updateCalendarTask,
  completeCalendarTask,
};