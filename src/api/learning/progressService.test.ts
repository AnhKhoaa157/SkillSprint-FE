import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProgressDashboard } from "./progressService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("progressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWorkspaceId = "workspace-1";
  const mockDashboard = {
    workspaceId: mockWorkspaceId,
    roadmapId: "roadmap-1",
    roadmapStatus: "ACTIVE",
    progressPercent: 50,
    totalSteps: 10,
    completedSteps: 5,
    totalTasks: 20,
    completedTasks: 10,
    todayTaskCount: 2,
    overdueTaskCount: 0,
    today: "2023-01-01",
    currentStep: null,
    todayTasks: [],
    overdueTasks: [],
  };

  describe("getProgressDashboard", () => {
    it("should return null if workspaceId is not provided", async () => {
      const result = await getProgressDashboard("");
      expect(result).toBeNull();
      expect(requestJson).not.toHaveBeenCalled();
    });

    it("should fetch progress dashboard successfully", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: mockDashboard,
      });

      const result = await getProgressDashboard(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/progress`, {
        method: "GET",
      });
      expect(result).toEqual(mockDashboard);
    });

    it("should return null if API returns null data", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: null,
      });

      const result = await getProgressDashboard(mockWorkspaceId);
      expect(result).toBeNull();
    });

    it("should propagate errors", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("API Error"));

      await expect(getProgressDashboard(mockWorkspaceId)).rejects.toThrow("API Error");
    });
  });
});
