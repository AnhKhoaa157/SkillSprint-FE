import { describe, expect, it } from "vitest";
import type { RoadmapStep } from "../../../api/learning/roadmapService";
import type { CalendarTaskResponse } from "../../../api/utilities/calendarService";
import {
  canReconcileLegacyRoadmap,
  getRoadmapCompletionState,
  isCompletedRoadmapStep,
} from "./roadmapCompletionState";

function createStep(status: string): RoadmapStep {
  return {
    stepId: "step-1",
    roadmapId: "roadmap-1",
    title: "Step",
    sequenceNo: 1,
    status,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function createTask(stepId: string, status: string): CalendarTaskResponse {
  return {
    taskId: `task-${stepId}-${status}`,
    workspaceId: "workspace-1",
    roadmapStepId: stepId,
    title: "Task",
    status,
  };
}

describe("roadmapCompletionState", () => {
  it("only treats backend-completed steps as completed", () => {
    expect(isCompletedRoadmapStep(createStep("COMPLETED"))).toBe(true);
    expect(isCompletedRoadmapStep(createStep("CURRENT"))).toBe(false);
  });

  it("does not report 100% while the backend roadmap is still active", () => {
    const state = getRoadmapCompletionState({
      status: "ACTIVE",
      steps: [createStep("COMPLETED"), createStep("COMPLETED")],
    });

    expect(state).toMatchObject({
      completedStepCount: 2,
      progressPercent: 99,
      isRoadmapComplete: false,
      isSyncingCompletion: true,
    });
  });

  it("reports 100% only after the backend marks the roadmap completed", () => {
    const state = getRoadmapCompletionState({
      status: "COMPLETED",
      steps: [createStep("COMPLETED")],
    });

    expect(state).toMatchObject({
      progressPercent: 100,
      isRoadmapComplete: true,
      isSyncingCompletion: false,
    });
  });

  it("allows an admin legacy recovery only when every step has completed active tasks", () => {
    const first = createStep("CURRENT");
    const second = { ...createStep("UPCOMING"), stepId: "step-2" };
    const roadmap = { status: "ACTIVE", steps: [first, second] };

    expect(canReconcileLegacyRoadmap(roadmap, [
      createTask(first.stepId, "COMPLETED"),
      createTask(second.stepId, "DONE"),
      createTask(second.stepId, "CANCELLED"),
    ])).toBe(true);
  });

  it("does not allow recovery with a pending task or an empty step", () => {
    const first = createStep("CURRENT");
    const second = { ...createStep("UPCOMING"), stepId: "step-2" };
    const roadmap = { status: "ACTIVE", steps: [first, second] };

    expect(canReconcileLegacyRoadmap(roadmap, [
      createTask(first.stepId, "COMPLETED"),
      createTask(second.stepId, "TODO"),
    ])).toBe(false);
    expect(canReconcileLegacyRoadmap(roadmap, [
      createTask(first.stepId, "COMPLETED"),
    ])).toBe(false);
  });
});
