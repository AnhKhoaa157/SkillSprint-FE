import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMeSummary, getMyPointEvents, getLeaderboard } from "./pointService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("pointService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMeSummary", () => {
    it("should fetch user point summary", async () => {
      const mockSummary = { userId: "user-1", totalPoints: 100, currentStreak: 5, rank: 2 };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSummary, success: true, code: 200, message: "ok" });

      const result = await getMeSummary();

      expect(requestJson).toHaveBeenCalledWith("/api/leaderboard/me", { method: "GET" });
      expect(result).toEqual(mockSummary);
    });

    it("should propagate errors", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("API Error"));

      await expect(getMeSummary()).rejects.toThrow("API Error");
    });
  });

  describe("getMyPointEvents", () => {
    it("should fetch user point events", async () => {
      const mockEvents = [{ eventId: "ev-1", points: 10 }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockEvents, success: true, code: 200, message: "ok" });

      const result = await getMyPointEvents();

      expect(requestJson).toHaveBeenCalledWith("/api/leaderboard/me/events", { method: "GET" });
      expect(result).toEqual(mockEvents);
    });
  });

  describe("getLeaderboard", () => {
    it("should fetch leaderboard with query params", async () => {
      const mockLeaderboard = { content: [{ userId: "user-1", totalPoints: 100 }], last: true };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockLeaderboard, success: true, code: 200, message: "ok" });

      const result = await getLeaderboard("all-time", 10);

      expect(requestJson).toHaveBeenCalledWith("/api/leaderboard/all-time?size=10", { method: "GET" });
      expect(result).toEqual(mockLeaderboard);
    });
  });
});
