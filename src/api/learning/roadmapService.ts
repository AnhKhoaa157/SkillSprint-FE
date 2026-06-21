import { requestJson } from "../core/apiClient";

export type GenerateRoadmapRequest = {
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null;  // YYYY-MM-DD
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

/**
 * A learning resource attached to a roadmap or step. The backend shape is not
 * yet fully contractually pinned, so the UI reads these fields defensively —
 * every field is optional and parsed through toText()/toNumber() guards.
 */
export type RoadmapResource = {
  type?: string | null;
  url?: string | null;
  title?: string | null;
  description?: string | null;
};

export type RoadmapStepResponse = {
  stepId: string;
  roadmapId: string;
  title: string;
  description?: string | null;
  sequenceNo: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields the UI reads defensively (backend may or may not send them).
  id?: string | null;
  _id?: string | null;
  summary?: string | null;
  difficulty?: string | null;
  complexity?: string | null;
  durationMinutes?: number | string | null;
  duration?: number | string | null;
  minutes?: number | string | null;
  resources?: RoadmapResource[];
};

/** Alias kept for callers that import the pre-`*Response` name. */
export type RoadmapStep = RoadmapStepResponse;

export type RoadmapResponse = {
  roadmapId: string;
  workspaceId: string;
  targetGoal: string;
  confidence: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null;
  status: string;
  progressPercent: number;
  steps: RoadmapStepResponse[];
  createdAt: string;
  updatedAt: string;
  isRewardClaimed?: boolean | null;
  // Optional fields the UI reads defensively (backend may or may not send them).
  id?: string | null;
  title?: string | null;
  description?: string | null;
  resources?: RoadmapResource[];
};


export type GenerateRoadmapResponse = {
  roadmapId: string;
  status: string;
  message: string;
};

export const ROADMAP_STEPS_KEY = "skillSprint.roadmap.steps";
export const ROADMAP_GENERATION_STATUS_KEY = "skillSprint.roadmap.generationStatus";

/**
 * POST /api/workspaces/{workspaceId}/roadmaps/generate
 * Yêu cầu backend sinh lộ trình học từ learning structure đã confirmed.
 */
export async function generateRoadmap(workspaceId: string): Promise<GenerateRoadmapResponse> {
  const res = await requestJson<GenerateRoadmapResponse>(`/api/workspaces/${workspaceId}/roadmaps/generate`, {
    method: "POST",
  });

  // Safely unwrap the unified backend response: res?.data or res itself.
  const cleanData = res?.data || res;

  // If cleanData contains a roadmapId, return it immediately.
  if (cleanData && typeof cleanData === "object" && (cleanData as any).roadmapId) {
    return cleanData as GenerateRoadmapResponse;
  }

  // Reject with a clear error from the backend or a fallback message.
  throw new Error((res as any)?.message || "Operation failed");
}

/**
 * GET /api/workspaces/{workspaceId}/roadmaps/current
 * Lấy lộ trình hiện tại (đã generate) của workspace.
 * Trả về null nếu backend trả 200 nhưng data = null (chưa generate).
 */
export async function getMyRoadmap(workspaceId: string): Promise<RoadmapResponse | null> {
  const res = await requestJson<RoadmapResponse>(`/api/workspaces/${workspaceId}/roadmaps/current`, {
    method: "GET",
  });

  if (!res.data) return null;

  return res.data;
}

// 👇 Alias export — MUST be declared BELOW the actual function to avoid hoisting issues.
export const getRoadmap = getMyRoadmap;

/**
 * POST /api/workspaces/{workspaceId}/roadmaps/claim-reward
 * Nhận phần thưởng khi hoàn thành toàn bộ roadmap.
 */
export async function claimRoadmapReward(workspaceId: string): Promise<void> {
  await requestJson<void>(`/api/workspaces/${workspaceId}/roadmaps/claim-reward`, {
    method: "POST",
  });
}

export default {
  generateRoadmap,
  getRoadmap,
  getMyRoadmap,
  claimRoadmapReward,
};