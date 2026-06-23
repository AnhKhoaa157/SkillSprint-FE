import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import healthService from "./healthService";
import { API_BASE } from "../core/config";

const originalFetch = global.fetch;

describe("healthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe("probeHealth", () => {
    it("should fetch health status successfully", async () => {
      const mockResponse = { status: "up" };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      } as any);

      const result = await healthService.probeHealth();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/health`, { cache: 'no-store' });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on non-ok response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as any);

      await expect(healthService.probeHealth()).rejects.toThrow("Health check failed: 503");
    });

    it("should throw error on non-json response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "text/html" }),
      } as any);

      await expect(healthService.probeHealth()).rejects.toThrow("Health check returned non-JSON response");
    });
  });

  describe("subscribeHealth & getCurrentHealth", () => {
    it("should manage subscription and polling", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ status: "up" }),
      } as any);

      const cb = vi.fn();
      const unsubscribe = healthService.subscribeHealth(cb);

      // Called immediately with initial status 'unknown'
      expect(cb).toHaveBeenCalledWith("unknown");

      // Advance timers to trigger the first poll response
      await vi.advanceTimersByTimeAsync(30000);
      
      expect(cb).toHaveBeenCalledWith("up");
      expect(healthService.getCurrentHealth()).toBe("up");

      unsubscribe();
    });

    it("should handle polling failures", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 503,
      } as any);

      const cb = vi.fn();
      const unsubscribe = healthService.subscribeHealth(cb);

      await vi.advanceTimersByTimeAsync(30000);
      
      expect(cb).toHaveBeenCalledWith("down");
      expect(healthService.getCurrentHealth()).toBe("down");

      unsubscribe();
    });
  });
});
