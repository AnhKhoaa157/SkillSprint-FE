import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminLeaderboard,
  getAdminUserPointSummary,
  getAdminUserPointEvents,
} from "./adminPointService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("adminPointService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminLeaderboard", () => {
    it("should fetch admin leaderboard", async () => {
      const mockData = { period: "WEEKLY", entries: { items: [], totalItems: 0 } };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockData } as any);

      const result = await getAdminLeaderboard({ period: "WEEKLY", search: "test", page: 1, size: 10 });

      expect(requestJson).toHaveBeenCalledWith(
        "/api/admin/leaderboard?period=WEEKLY&search=test&page=1&size=10",
        { method: "GET" }
      );
      expect(result).toEqual(mockData);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(getAdminLeaderboard({ period: "WEEKLY" })).rejects.toThrow("Không thể tải bảng xếp hạng");
    });
  });

  describe("getAdminUserPointSummary", () => {
    it("should fetch user point summary", async () => {
      const mockSummary = { userId: "u1", totalPoints: 100 };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSummary } as any);

      const result = await getAdminUserPointSummary("u1");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/users/u1/points", { method: "GET" });
      expect(result).toEqual(mockSummary);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(getAdminUserPointSummary("u1")).rejects.toThrow("Không thể tải tổng quan điểm");
    });
  });

  describe("getAdminUserPointEvents", () => {
    it("should fetch user point events", async () => {
      const mockPage = { items: [], totalItems: 0 };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPage } as any);

      const result = await getAdminUserPointEvents("u1", { type: "TASK_COMPLETED", page: 1, size: 5 });

      expect(requestJson).toHaveBeenCalledWith(
        "/api/admin/users/u1/point-events?type=TASK_COMPLETED&page=1&size=5",
        { method: "GET" }
      );
      expect(result).toEqual(mockPage);
    });

    it("should return empty page if no data", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      const result = await getAdminUserPointEvents("u1");

      expect(result.items).toEqual([]);
    });
  });
});
