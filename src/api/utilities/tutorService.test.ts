import { describe, it, expect, vi, beforeEach } from "vitest";
import tutorService from "./tutorService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("tutorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("askWorkspace", () => {
    it("should ask tutor a question at the workspace scope", async () => {
      const mockResponse = { answer: "Here is the answer" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse as any);

      const request = { question: "What is React?" };
      const result = await tutorService.askWorkspace("ws1", request);

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/ws1/tutor/ask", {
        method: "POST",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors from requestJson", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("API Error"));

      await expect(
        tutorService.askWorkspace("ws1", { question: "Test" })
      ).rejects.toThrow("API Error");
    });
  });

  describe("askStep", () => {
    it("should ask tutor a question at the step scope", async () => {
      const mockResponse = { answer: "Step context answer" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse as any);

      const request = { question: "How to complete this step?" };
      const result = await tutorService.askStep("step1", request);

      expect(requestJson).toHaveBeenCalledWith("/api/roadmap-steps/step1/tutor/ask", {
        method: "POST",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors from requestJson", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("API Error"));

      await expect(
        tutorService.askStep("step1", { question: "Test" })
      ).rejects.toThrow("API Error");
    });
  });
});
