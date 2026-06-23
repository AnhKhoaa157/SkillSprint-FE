import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRoadmap, getMyRoadmap, getRoadmap, claimRoadmapReward } from "./roadmapService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("roadmapService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWorkspaceId = "workspace-1";

  describe("generateRoadmap", () => {
    it("should generate roadmap", async () => {
      const mockResponse = { data: { roadmapId: "roadmap-1" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await generateRoadmap(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/roadmaps/generate`, { method: "POST" });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getMyRoadmap", () => {
    it("should fetch roadmap", async () => {
      const mockResponse = { data: { roadmapId: "roadmap-1" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await getMyRoadmap(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/roadmaps/current`, { method: "GET" });
      expect(result).toEqual(mockResponse.data);
    });

    it("should return null if API returns 404", async () => {
      const error404: any = new Error("Not found");
      error404.status = 404;
      vi.mocked(requestJson).mockRejectedValueOnce(error404);

      const result = await getMyRoadmap(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/roadmaps/current`, { method: "GET" });
      expect(result).toBeNull();
    });

    it("should propagate other errors", async () => {
      const error500 = new Error("Server Error");
      vi.mocked(requestJson).mockRejectedValueOnce(error500);

      await expect(getMyRoadmap(mockWorkspaceId)).rejects.toThrow("Server Error");
    });
  });

  describe("claimRoadmapReward", () => {
    it("should claim roadmap reward", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: null });

      await claimRoadmapReward(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/roadmaps/claim-reward`, { method: "POST" });
    });
  });
});
