import { describe, it, expect, beforeEach, vi } from "vitest";
import { login, register, logout, refreshAuthSession } from "./authService";
import { setCachedMaintenance } from "../system/maintenanceState";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCachedMaintenance(null);
    localStorage.clear();
  });

  const mockJwt = (expAdd = 3600) => {
    const enc = (o: any) => btoa(JSON.stringify(o)).replace(/=+$/, "");
    return `${enc({ alg: "none" })}.${enc({ exp: Math.floor(Date.now() / 1000) + expAdd })}.sig`;
  };

  describe("login", () => {
    it("should login successfully and return authenticated status", async () => {
      const mockToken = mockJwt();
      const mockResponse = {
        success: true,
        code: 200,
        message: "ok",
        data: {
          accessToken: mockToken,
          idToken: mockToken,
          refreshToken: "refresh",
          expiresIn: 3600,
          tokenType: "Bearer",
          sessionId: "sess-1",
          role: "LEARNER",
        },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        })
      );

      const result = await login("test@example.com", "password123");

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/auth/login"), expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      }));
      expect(result.status).toBe("authenticated");
    });

    it("should throw error when login fails", async () => {
      const mockResponse = {
        success: false,
        code: 401,
        message: "Invalid credentials",
        data: null,
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => mockResponse,
        })
      );

      await expect(login("test@example.com", "wrong")).rejects.toThrow("Invalid credentials");
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "ok" }),
        })
      );

      await register("Test User", "test@example.com", "password123");

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/auth/register"), expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fullName: "Test User", email: "test@example.com", password: "password123" }),
      }));
    });
  });

  describe("logout", () => {
    it("should clear local storage and call logout API", async () => {
      localStorage.setItem("skillSprint.auth.tokens", JSON.stringify({ accessToken: "abc", sessionId: "123" }));
      
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        })
      );

      await logout();

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/auth/logout"), expect.objectContaining({
        method: "POST",
      }));
      expect(localStorage.getItem("skillSprint.auth.tokens")).toBeNull();
    });
  });
});
