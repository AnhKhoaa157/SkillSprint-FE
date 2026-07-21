import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStudySessionDetail,
  startStudySession,
  getStudySession,
  getStudySessionState,
  pausePomodoro,
  resumePomodoro,
  nextPomodoroPhase,
  skipPomodoroPhase,
  finishPomodoro,
  finishStudySession,
} from "./studySessionService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("studySessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTaskId = "task-1";
  const mockSessionId = "session-1";

  const mockSessionResponse = {
    sessionId: mockSessionId,
    workspaceId: "workspace-1",
    taskId: mockTaskId,
    status: "IN_PROGRESS",
    timerState: { phase: "FOCUS", isPaused: false, timeRemaining: 1500 },
  };

  describe("getStudySessionDetail", () => {
    it("should fetch study session detail by task id", async () => {
      const mockDetail = { taskId: mockTaskId, sessions: [] };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockDetail, success: true, code: 200, message: "ok" });

      const result = await getStudySessionDetail(mockTaskId);

      expect(requestJson).toHaveBeenCalledWith(`/api/calendar/tasks/${mockTaskId}/study-session`, { method: "GET" });
      expect(result).toEqual(mockDetail);
    });
  });

  describe("startStudySession", () => {
    it("should start a study session", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });

      const payload = {
        taskId: mockTaskId,
        durationMinutes: 25,
        targetOutcomes: ["Learn vitest"],
        pomodoroEnabled: true,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4,
      };

      const result = await startStudySession("workspace-1", payload);

      expect(requestJson).toHaveBeenCalledWith(`/api/calendar/tasks/workspace-1/sessions/start`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockSessionResponse);
    });
  });

  describe("getStudySession and getStudySessionState", () => {
    it("getStudySession should fetch session", async () => {
      const mockDetail = { sessionId: mockSessionId, taskId: mockTaskId };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockDetail, success: true, code: 200, message: "ok" });

      const result = await getStudySession(mockSessionId);

      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}`, { method: "GET" });
      expect(result).toEqual(mockDetail);
    });

    it("getStudySessionState should unwrap the nested session from the detail envelope", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        data: { session: mockSessionResponse, task: {}, actions: {} },
        success: true,
        code: 200,
        message: "ok",
      });

      const result = await getStudySessionState(mockSessionId);

      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}`, { method: "GET" });
      expect(result).toEqual(mockSessionResponse);
    });

    it("getStudySessionState returns null when the detail has no session", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({
        data: { session: null, task: {}, actions: {} },
        success: true,
        code: 200,
        message: "ok",
      });

      const result = await getStudySessionState(mockSessionId);

      expect(result).toBeNull();
    });
  });

  describe("Pomodoro actions", () => {
    it("pausePomodoro should pause", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });
      await pausePomodoro(mockSessionId);
      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/pomodoro/pause`, { method: "POST" });
    });

    it("resumePomodoro should resume", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });
      await resumePomodoro(mockSessionId);
      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/pomodoro/resume`, { method: "POST" });
    });

    it("nextPomodoroPhase should go to next phase", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });
      await nextPomodoroPhase(mockSessionId);
      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/pomodoro/next-phase`, { method: "POST" });
    });

    it("skipPomodoroPhase should call the dedicated manual-skip endpoint", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });
      await skipPomodoroPhase(mockSessionId);
      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/pomodoro/skip`, { method: "POST" });
    });

    it("finishPomodoro should finish pomodoro", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });
      await finishPomodoro(mockSessionId);
      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/pomodoro/finish`, { method: "POST" });
    });
  });

  describe("finishStudySession", () => {
    it("should finish study session", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockSessionResponse, success: true, code: 200, message: "ok" });

      const payload = { notes: "Done", focusScore: 5 };
      const result = await finishStudySession(mockSessionId, payload);

      expect(requestJson).toHaveBeenCalledWith(`/api/study-sessions/${mockSessionId}/finish`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockSessionResponse);
    });
  });
});
