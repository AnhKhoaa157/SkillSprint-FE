import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FeedbackType,
  FeedbackStatus,
  getMyFeedbacks,
  getMyFeedbackDetail,
  createFeedback,
  getFeedbackImageUploadUrl,
  uploadFeedbackImage,
  getAdminFeedbacks,
  deleteFeedback,
  getFeedbackDetail,
  updateFeedbackStatus,
} from "./feedbackService";
import { requestJson, getAuthHeaders } from "../core/apiClient";
import { API_BASE } from "../core/config";
import { triggerSessionExpiry } from "../auth/sessionExpiry";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ Authorization: "Bearer token" })),
}));

vi.mock("../auth/sessionExpiry", () => ({
  triggerSessionExpiry: vi.fn(),
  extractAuthCode: vi.fn(),
}));

const originalFetch = global.fetch;

describe("feedbackService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getMyFeedbacks", () => {
    it("should fetch user feedbacks with pagination", async () => {
      const mockPage = { items: [{ feedbackId: "f1", title: "Test", type: "BUG", status: "OPEN" }] };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPage }),
      } as any);

      const result = await getMyFeedbacks(0, 20);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/feedback?page=0&size=20`, {
        method: "GET",
        headers: { Authorization: "Bearer token" },
      });
      expect(result.items[0].feedbackId).toBe("f1");
    });
  });

  describe("getMyFeedbackDetail", () => {
    it("should fetch feedback details", async () => {
      const mockDetail = { feedbackId: "f1", title: "Test", type: "BUG", status: "OPEN" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockDetail } as any);

      const result = await getMyFeedbackDetail("f1");

      expect(requestJson).toHaveBeenCalledWith(`/api/feedback/f1`);
      expect(result.feedbackId).toBe("f1");
    });
  });

  describe("createFeedback", () => {
    it("should create feedback", async () => {
      const mockResult = { feedbackId: "f1", title: "Test", type: "BUG", status: "OPEN" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockResult } as any);

      const payload = {
        type: FeedbackType.BUG,
        title: "Test",
        content: "Content",
      };

      const result = await createFeedback(payload);

      expect(requestJson).toHaveBeenCalledWith(`/api/feedback`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result.feedbackId).toBe("f1");
    });

    it("should throw error if creation fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ message: "Failed to submit feedback" } as any);

      await expect(
        createFeedback({ type: FeedbackType.BUG, title: "T", content: "C" })
      ).rejects.toThrow("Failed to submit feedback");
    });
  });

  describe("getFeedbackImageUploadUrl", () => {
    it("should fetch presigned upload URL", async () => {
      const mockData = { uploadUrl: "http://s3.com", objectKey: "obj1", fileUrl: "", expiresAt: "" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockData } as any);

      const result = await getFeedbackImageUploadUrl("test.png", "image/png");

      expect(requestJson).toHaveBeenCalledWith(`/api/feedback/upload-url`, {
        method: "POST",
        body: JSON.stringify({ fileName: "test.png", contentType: "image/png" }),
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("uploadFeedbackImage", () => {
    it("should upload image successfully to S3", async () => {
      const mockData = { uploadUrl: "http://s3.com", objectKey: "obj1", fileUrl: "", expiresAt: "" };
      
      // First call for getFeedbackImageUploadUrl uses requestJson
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockData } as any);

      // Second call for the actual upload uses fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, status: 200 } as any);

      const mockFile = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(mockFile, 'size', { value: 1024 });

      const result = await uploadFeedbackImage(mockFile);

      expect(global.fetch).toHaveBeenCalledWith("http://s3.com", {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: mockFile,
      });
      expect(result).toBe("obj1");
    });
  });

  describe("Admin Functions", () => {
    it("should get admin feedbacks", async () => {
      const mockPage = { items: [{ feedbackId: "f1", title: "Test", type: "BUG", status: "OPEN" }] };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPage } as any);

      const result = await getAdminFeedbacks(0, 10, "OPEN");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/feedback?page=0&size=10&status=OPEN");
      expect(result.items[0].feedbackId).toBe("f1");
    });

    it("should get admin feedback detail", async () => {
      const mockDetail = { feedbackId: "f1", type: "BUG", status: "OPEN" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockDetail } as any);

      const result = await getFeedbackDetail("f1");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/feedback/f1");
      expect(result.feedbackId).toBe("f1");
    });

    it("should update feedback status", async () => {
      const mockDetail = { feedbackId: "f1", type: "BUG", status: "CLOSED" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockDetail } as any);

      const result = await updateFeedbackStatus("f1", FeedbackStatus.CLOSED, "Done");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/feedback/f1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED", adminNote: "Done" }),
      });
      expect(result.feedbackId).toBe("f1");
    });

    it("should delete feedback", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await deleteFeedback("f1");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/feedback/f1", {
        method: "DELETE",
      });
    });
  });
});
