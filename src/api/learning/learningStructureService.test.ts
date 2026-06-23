import { describe, it, expect, vi, beforeEach } from "vitest";
import learningStructureService from "./learningStructureService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  extractApiData: vi.fn((response) => response.data),
}));

describe("learningStructureService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWorkspaceId = "workspace-1";
  const mockStructure = {
    structureId: "struct-1",
    workspaceId: mockWorkspaceId,
    status: "REVIEW_REQUIRED",
    chapters: [],
  };

  describe("generateLearningStructure", () => {
    it("should generate a new learning structure", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: mockStructure });

      const result = await learningStructureService.generateLearningStructure(mockWorkspaceId);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/learning-structure/generate`
      );
      expect(result).toEqual(mockStructure);
    });
  });

  describe("getLearningStructure", () => {
    it("should fetch the learning structure", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: mockStructure });

      const result = await learningStructureService.getLearningStructure(mockWorkspaceId);

      expect(skillSprintApiClient.get).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/learning-structure`);
      expect(result).toEqual(mockStructure);
    });

    it("should return null if API returns 404", async () => {
      const error404: any = new Error("Not found");
      error404.response = { status: 404 };

      vi.mocked(skillSprintApiClient.get).mockRejectedValueOnce(error404);

      const result = await learningStructureService.getLearningStructure(mockWorkspaceId);

      expect(skillSprintApiClient.get).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/learning-structure`);
      expect(result).toBeNull();
    });

    it("should propagate other errors", async () => {
      const error500 = new Error("Internal Server Error");
      vi.mocked(skillSprintApiClient.get).mockRejectedValueOnce(error500);

      await expect(learningStructureService.getLearningStructure(mockWorkspaceId)).rejects.toThrow("Internal Server Error");
    });
  });

  describe("confirmLearningStructure", () => {
    it("should confirm the learning structure", async () => {
      const confirmedStructure = { ...mockStructure, status: "CONFIRMED" };
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: confirmedStructure });

      const result = await learningStructureService.confirmLearningStructure(mockWorkspaceId);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/learning-structure/confirm`,
        {}
      );
      expect(result).toEqual(confirmedStructure);
    });
  });
});
