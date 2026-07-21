import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAdminUsers,
  getAdminUser,
  updateUserStatus,
  updateUserRole,
  updateUserSubscription,
} from "./adminUserService";
import { API_BASE } from "../core/config";
import { getAuthHeaders } from "../core/apiClient";
import { triggerSessionExpiry } from "../auth/sessionExpiry";

vi.mock("../core/apiClient", () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: "Bearer token" })),
}));

vi.mock("../auth/sessionExpiry", () => ({
  triggerSessionExpiry: vi.fn(),
  extractAuthCode: vi.fn(),
}));

const originalFetch = global.fetch;

describe("adminUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getAdminUsers", () => {
    it("should fetch admin users", async () => {
      const mockData = { items: [{ userId: "u1" }], totalItems: 21 };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ success: true, data: mockData }),
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const result = await getAdminUsers("test", 1, 20);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users?search=test&page=1&size=20"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token" }),
        })
      );
      // getAdminUsers maps the items to content:
      expect(result.content[0].id).toBe("u1");
      expect(result.totalElements).toBe(21);
    });

    it("should trigger session expiry on 401", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 401,
        ok: false,
        text: async () => JSON.stringify({ message: "Failed to load users" }),
      } as any);

      await expect(getAdminUsers()).rejects.toThrow("Failed to load users");
      expect(triggerSessionExpiry).toHaveBeenCalled();
    });
  });

  describe("getAdminUser", () => {
    it("should fetch admin user", async () => {
      const mockData = { userId: "u1" };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ success: true, data: mockData }),
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const result = await getAdminUser("u1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1"),
        expect.any(Object)
      );
      expect(result.id).toBe("u1");
    });
  });

  describe("updateUserStatus", () => {
    it("should update user status", async () => {
      const mockData = { userId: "u1", status: "DISABLE" };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ success: true, data: mockData }),
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const result = await updateUserStatus("u1", { status: "DISABLE" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/status"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "DISABLE" }),
        })
      );
      expect(result.status).toBe("DISABLE");
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      const mockData = { userId: "u1", roles: ["ADMIN"] };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ success: true, data: mockData }),
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const result = await updateUserRole("u1", { roles: ["ADMIN"] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/roles"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ role: "ADMIN" }), // Maps to { role: roles[0] }
        })
      );
      expect(result.id).toBe("u1");
    });
  });

  describe("updateUserSubscription", () => {
    it("should update user subscription", async () => {
      const mockData = { subscriptionId: "sub1" };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ success: true, data: mockData }),
        json: async () => ({ success: true, data: mockData }),
      } as any);

      const result = await updateUserSubscription("u1", { planType: "PREMIUM" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/subscription"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ planType: "PREMIUM" }),
        })
      );
      expect(result.subscriptionId).toBe("sub1");
    });
  });
});
