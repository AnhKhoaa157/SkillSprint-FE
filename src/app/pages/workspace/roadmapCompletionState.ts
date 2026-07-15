import type { RoadmapResponse, RoadmapStep } from "../../../api/learning/roadmapService";
import type { CalendarTaskResponse } from "../../../api/utilities/calendarService";

const COMPLETED_STATUSES = new Set(["COMPLETED", "DONE"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "CANCELED"]);

export type RoadmapCompletionState = {
  completedStepCount: number;
  progressPercent: number;
  isRoadmapComplete: boolean;
  isSyncingCompletion: boolean;
};

export function isCompletedRoadmapStep(step: RoadmapStep): boolean {
  return COMPLETED_STATUSES.has(step.status.trim().toUpperCase());
}

function isCompletedCalendarTask(task: CalendarTaskResponse): boolean {
  return COMPLETED_STATUSES.has(task.status?.trim().toUpperCase() ?? "");
}

function isCancelledCalendarTask(task: CalendarTaskResponse): boolean {
  return CANCELLED_STATUSES.has(task.status?.trim().toUpperCase() ?? "");
}

/**
 * Client-side recovery hint for ADMIN_DEFAULT roadmaps created before the shared
 * backend completion policy. The backend still re-validates every condition
 * before it reconciles the roadmap or awards points.
 */
export function canReconcileLegacyRoadmap(
  roadmap: Pick<RoadmapResponse, "status" | "steps"> | null,
  tasks: CalendarTaskResponse[],
): boolean {
  if (!roadmap || roadmap.status.trim().toUpperCase() === "COMPLETED") return false;

  const steps = roadmap.steps ?? [];
  if (steps.length === 0) return false;

  return steps.every(step => {
    const activeStepTasks = tasks.filter(task =>
      task.roadmapStepId === step.stepId && !isCancelledCalendarTask(task),
    );
    return activeStepTasks.length > 0 && activeStepTasks.every(isCompletedCalendarTask);
  });
}

export function getRoadmapCompletionState(
  roadmap: Pick<RoadmapResponse, "status" | "steps"> | null,
): RoadmapCompletionState {
  const isRoadmapComplete = roadmap?.status.trim().toUpperCase() === "COMPLETED";
  const steps = roadmap?.steps ?? [];
  const completedStepCount = steps.filter(isCompletedRoadmapStep).length;
  const allStepsCompleted = steps.length > 0 && completedStepCount === steps.length;

  return {
    completedStepCount,
    progressPercent: isRoadmapComplete
      ? 100
      : steps.length > 0
        ? Math.min(99, Math.round((completedStepCount / steps.length) * 100))
        : 0,
    isRoadmapComplete,
    isSyncingCompletion: allStepsCompleted && !isRoadmapComplete,
  };
}
