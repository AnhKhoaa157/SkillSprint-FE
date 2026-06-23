import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getActivePublicAnnouncement,
  getAdminAnnouncement,
  updateAdminAnnouncement,
} from "./systemAnnouncementService";
import { requestJson } from "../core/apiClient";
import { API_BASE } from "../core/config";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

const originalFetch = global.fetch;

describe("systemAnnouncementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getActivePublicAnnouncement", () => {
    it("should return the active public announcement", async () => {
      const mockAnnouncement = { message: "System under maintenance" };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnnouncement }),
      } as any);

      const result = await getActivePublicAnnouncement();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/public/announcements/active`);
      expect(result).toEqual(mockAnnouncement);
    });

    it("should return null if not ok", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as any);

      const result = await getActivePublicAnnouncement();

      expect(result).toBeNull();
    });
  });

  describe("getAdminAnnouncement", () => {
    it("should get admin announcement config", async () => {
      const mockAnnouncement = { message: "Test" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockAnnouncement } as any);

      const result = await getAdminAnnouncement();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/system/announcement");
      expect(result).toEqual(mockAnnouncement);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(getAdminAnnouncement()).rejects.toThrow("Không tải được cấu hình thông báo");
    });
  });

  describe("updateAdminAnnouncement", () => {
    it("should update admin announcement", async () => {
      const mockAnnouncement = { message: "Test", enabled: true };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockAnnouncement } as any);

      const request = { enabled: true };
      const result = await updateAdminAnnouncement(request);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/system/announcement", {
        method: "PATCH",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockAnnouncement);
    });

    it("should throw error if update fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(updateAdminAnnouncement({ enabled: true })).rejects.toThrow("Không cập nhật được thông báo");
    });
  });
});
