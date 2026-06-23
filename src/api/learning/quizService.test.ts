import { describe, it, expect, vi, beforeEach } from "vitest";
import quizService from "./quizService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("quizService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStepId = "step-1";
  const mockQuizId = "quiz-1";
  
  const mockQuiz = {
    quizId: mockQuizId,
    stepId: mockStepId,
    title: "Test Quiz",
    passingScore: 80,
    questionCount: 5,
    status: "ACTIVE",
    latestAttempt: null,
    questions: [],
  };

  describe("getCurrent", () => {
    it("should fetch current quiz", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockQuiz, success: true, code: 200, message: "ok" });

      const result = await quizService.getCurrent(mockStepId);

      expect(requestJson).toHaveBeenCalledWith(`/api/roadmap-steps/${mockStepId}/quiz/current`, { method: "GET" });
      expect(result).toEqual(mockQuiz);
    });

    it("should return null on 404 error", async () => {
      const error404: any = new Error("Not found");
      error404.status = 404;
      vi.mocked(requestJson).mockRejectedValueOnce(error404);

      const result = await quizService.getCurrent(mockStepId);

      expect(requestJson).toHaveBeenCalledWith(`/api/roadmap-steps/${mockStepId}/quiz/current`, { method: "GET" });
      expect(result).toBeNull();
    });

    it("should propagate other errors", async () => {
      const error500 = new Error("Server Error");
      vi.mocked(requestJson).mockRejectedValueOnce(error500);

      await expect(quizService.getCurrent(mockStepId)).rejects.toThrow("Server Error");
    });
  });

  describe("generate", () => {
    it("should generate quiz", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockQuiz, success: true, code: 200, message: "ok" });

      const result = await quizService.generate(mockStepId);

      expect(requestJson).toHaveBeenCalledWith(`/api/roadmap-steps/${mockStepId}/quiz/generate`, { method: "POST" });
      expect(result).toEqual(mockQuiz);
    });
  });

  describe("submit", () => {
    it("should submit quiz answers", async () => {
      const mockAttempt = { attemptId: "att-1", score: 100, passed: true, results: [] };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockAttempt, success: true, code: 200, message: "ok" });

      const payload = { answers: [{ questionId: "q-1", selectedOptionId: "opt-1" }] };
      const result = await quizService.submit(mockQuizId, payload);

      expect(requestJson).toHaveBeenCalledWith(`/api/quizzes/${mockQuizId}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockAttempt);
    });
  });

  describe("getLatestAttempt", () => {
    it("should fetch latest attempt", async () => {
      const mockAttempt = { attemptId: "att-1", score: 100, passed: true, results: [] };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockAttempt, success: true, code: 200, message: "ok" });

      const result = await quizService.getLatestAttempt(mockQuizId);

      expect(requestJson).toHaveBeenCalledWith(`/api/quizzes/${mockQuizId}/attempts/latest`, { method: "GET" });
      expect(result).toEqual(mockAttempt);
    });
  });
});
