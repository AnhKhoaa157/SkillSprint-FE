import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSystemStatus,
  getMaintenanceConfig,
  updateMaintenanceMode,
  isoToLocalInput,
  localInputToIso,
} from "./systemMaintenanceService";
import { requestJson } from "../core/apiClient";
import { fetchSystemStatus } from "./maintenanceState";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

vi.mock("./maintenanceState", () => ({
  fetchSystemStatus: vi.fn(),
}));

describe("systemMaintenanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemStatus", () => {
    it("should delegate to fetchSystemStatus", async () => {
      const mockStatus = { isActive: true, message: "Maintenance" };
      vi.mocked(fetchSystemStatus).mockResolvedValueOnce(mockStatus as any);

      const result = await getSystemStatus();

      expect(fetchSystemStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });

  describe("getMaintenanceConfig", () => {
    it("should fetch maintenance config", async () => {
      const mockConfig = { enabled: true, active: true };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockConfig } as any);

      const result = await getMaintenanceConfig();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/system/maintenance");
      expect(result).toEqual(mockConfig);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(getMaintenanceConfig()).rejects.toThrow("Không tải được cấu hình bảo trì");
    });
  });

  describe("updateMaintenanceMode", () => {
    it("should update maintenance mode", async () => {
      const mockConfig = { enabled: false, active: false };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockConfig } as any);

      const request = { enabled: false };
      const result = await updateMaintenanceMode(request);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/system/maintenance", {
        method: "PATCH",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockConfig);
    });

    it("should throw error if update fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(updateMaintenanceMode({ enabled: true })).rejects.toThrow("Không cập nhật được chế độ bảo trì");
    });
  });

  describe("datetime helpers", () => {
    describe("isoToLocalInput", () => {
      it("should convert ISO to local input format", () => {
        // Mock timezone behavior can be tricky, so we test with local dates
        const date = new Date(2024, 0, 1, 12, 30); // Jan 1, 2024 12:30 local
        const isoString = date.toISOString();
        const result = isoToLocalInput(isoString);
        expect(result).toBe("2024-01-01T12:30");
      });

      it("should return empty string for null/undefined/invalid", () => {
        expect(isoToLocalInput(null)).toBe("");
        expect(isoToLocalInput(undefined)).toBe("");
        expect(isoToLocalInput("invalid-date")).toBe("");
      });
    });

    describe("localInputToIso", () => {
      it("should convert local input to ISO", () => {
        const local = "2024-01-01T12:30";
        const date = new Date(2024, 0, 1, 12, 30);
        const result = localInputToIso(local);
        expect(result).toBe(date.toISOString());
      });

      it("should return null for empty/invalid", () => {
        expect(localInputToIso("")).toBeNull();
        expect(localInputToIso("invalid")).toBeNull();
      });
    });
  });
});
