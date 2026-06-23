import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMe, updateMe, getAvatarUploadUrl, confirmAvatarUpload } from "./meService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("meService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMeResponse = {
    userId: "user-1",
    email: "test@example.com",
    emailVerified: true,
    fullName: "Test User",
    avatarUrl: "http://example.com/avatar.png",
    timeZone: "Asia/Ho_Chi_Minh",
    status: "ACTIVE",
    roles: ["LEARNER"],
  };

  describe("getMe", () => {
    it("should fetch user profile", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: mockMeResponse,
      });

      const result = await getMe();

      expect(requestJson).toHaveBeenCalledWith("/api/me", { method: "GET" });
      expect(result).toEqual(mockMeResponse);
    });

    it("should propagate errors", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("API Error"));
      await expect(getMe()).rejects.toThrow("API Error");
    });
  });

  describe("updateMe", () => {
    it("should update user profile", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: mockMeResponse,
      });

      const payload = { fullName: "Updated User", timeZone: "UTC" };
      const result = await updateMe(payload);

      expect(requestJson).toHaveBeenCalledWith("/api/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockMeResponse);
    });
  });

  describe("getAvatarUploadUrl", () => {
    it("should get presigned url for avatar upload", async () => {
      const mockUrlResponse = {
        uploadUrl: "http://s3.example.com/upload",
        objectKey: "avatars/user-1.jpg",
        expiresAt: "2023-01-01T01:00:00Z",
      };

      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: mockUrlResponse,
      });

      const result = await getAvatarUploadUrl("avatar.jpg", "image/jpeg");

      expect(requestJson).toHaveBeenCalledWith("/api/me/avatar/upload-url", {
        method: "POST",
        body: JSON.stringify({ fileName: "avatar.jpg", contentType: "image/jpeg" }),
      });
      expect(result).toEqual(mockUrlResponse);
    });
  });

  describe("confirmAvatarUpload", () => {
    it("should confirm avatar upload", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        success: true,
        code: 200,
        message: "ok",
        data: mockMeResponse,
      });

      const result = await confirmAvatarUpload("avatars/user-1.jpg");

      expect(requestJson).toHaveBeenCalledWith("/api/me/avatar/confirm", {
        method: "POST",
        body: JSON.stringify({ objectKey: "avatars/user-1.jpg" }),
      });
      expect(result).toEqual(mockMeResponse);
    });
  });
});
