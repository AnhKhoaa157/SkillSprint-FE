import { requestJson } from "./apiClient";

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type WeekDayShort =
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

export type GenerateCalendarRequest = {
  startDate?: string | null;
  start_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
  
  studyDays?: WeekDay[] | null;
  study_days?: WeekDay[] | null;
  
  studyDaysShort?: WeekDayShort[] | null;
  study_days_short?: WeekDayShort[] | null;
  studyDayNumbers?: number[] | null;
  study_day_numbers?: number[] | null;

  dailyStartTime?: string | null;
  daily_start_time?: string | null;
  sessionMinutes?: number | null;
  session_minutes?: number | null;
  sessionsPerDay?: number | null;
  sessions_per_day?: number | null;
  includeReviewSessions?: boolean | null;
  include_review_sessions?: boolean | null;

  // Khai báo động cho cấu trúc bọc lồng phòng thủ
  [key: string]: any;
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

// Hàm tạo lịch học nâng cấp cơ chế gửi song song URL Params + JSON Body
export async function generateCalendarSchedule(workspaceId: string, body: GenerateCalendarRequest): Promise<CalendarScheduleRunResponse> {
  const queryParams = new URLSearchParams();
  
  if (body.start_date) queryParams.append("start_date", body.start_date);
  if (body.end_date) queryParams.append("end_date", body.end_date);
  if (body.daily_start_time) queryParams.append("daily_start_time", body.daily_start_time);
  if (body.session_minutes) queryParams.append("session_minutes", String(body.session_minutes));
  if (body.sessions_per_day) queryParams.append("sessions_per_day", String(body.sessions_per_day));
  
  // Đẩy mảng ngày học lên URL dưới dạng multi-value params đề phòng trường hợp Backend nhận qua @RequestParam/@ModelAttribute
  if (body.study_days && body.study_days.length > 0) {
    body.study_days.forEach(day => queryParams.append("study_days", day));
    body.study_days.forEach(day => queryParams.append("studyDays", day));
  }
  if (body.study_day_numbers && body.study_day_numbers.length > 0) {
    body.study_day_numbers.forEach(num => queryParams.append("study_day_numbers", String(num)));
  }

  const urlWithParams = `/api/workspaces/${workspaceId}/calendar/generate?${queryParams.toString()}`;

  const res = await requestJson<CalendarScheduleRunResponse>(urlWithParams, {
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