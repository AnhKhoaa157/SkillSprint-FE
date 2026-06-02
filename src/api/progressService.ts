import { requestJson, type ApiResponse } from "./apiClient";

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

export async function getProgressDashboard(workspaceId: string): Promise<ProgressDashboardResponse | null> {
  if (!workspaceId) {
    return null;
  }

  const res = await requestJson<ProgressDashboardResponse>(`/api/workspaces/${workspaceId}/progress`, {
    method: "GET",
  });

  return res.data || null;
}

export default {
  getProgressDashboard,
};