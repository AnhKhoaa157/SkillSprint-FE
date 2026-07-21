import { beforeEach, describe, expect, it, vi } from "vitest";
import studySessionService, {
  type PomodoroTimerResponse,
  type StudySessionResponse,
} from "../../../api/learning/studySessionService";
import { resolveReconciledSession } from "./pomodoroReconcile";

vi.mock("../../../api/learning/studySessionService", () => ({
  default: {
    nextPomodoroPhase: vi.fn(),
    resumePomodoro: vi.fn(),
  },
}));

const nextPomodoroPhase = vi.mocked(studySessionService.nextPomodoroPhase);
const resumePomodoro = vi.mocked(studySessionService.resumePomodoro);

const NOW = Date.UTC(2026, 6, 21, 12, 0, 0);

function makeSession(pomodoro: Partial<PomodoroTimerResponse> | null): StudySessionResponse {
  return {
    sessionId: "s1",
    status: "IN_PROGRESS",
    pomodoro: pomodoro
      ? ({ status: "IN_PROGRESS", currentPhase: "FOCUS", focusMinutes: 25, ...pomodoro } as PomodoroTimerResponse)
      : null,
  } as StudySessionResponse;
}

describe("resolveReconciledSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("advances an expired IN_PROGRESS phase exactly once and returns the server response", async () => {
    const advanced = makeSession({ currentPhase: "SHORT_BREAK" });
    nextPomodoroPhase.mockResolvedValue(advanced);
    const expired = makeSession({ phaseEndAt: new Date(NOW - 60_000).toISOString() });

    const result = await resolveReconciledSession(expired, "s1", NOW);

    expect(nextPomodoroPhase).toHaveBeenCalledTimes(1);
    expect(nextPomodoroPhase).toHaveBeenCalledWith("s1");
    expect(result).toEqual({ kind: "ready", session: advanced, didAdvance: true });
  });

  it("never calls resumePomodoro for an expired IN_PROGRESS phase", async () => {
    nextPomodoroPhase.mockResolvedValue(makeSession({ currentPhase: "SHORT_BREAK" }));
    const expired = makeSession({ phaseEndAt: new Date(NOW - 1000).toISOString() });

    await resolveReconciledSession(expired, "s1", NOW);

    expect(resumePomodoro).not.toHaveBeenCalled();
  });

  it("returns the session unchanged (no call) when the running phase has not expired", async () => {
    const live = makeSession({ phaseEndAt: new Date(NOW + 600_000).toISOString() });

    const result = await resolveReconciledSession(live, "s1", NOW);

    expect(nextPomodoroPhase).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: "ready", session: live, didAdvance: false });
  });

  it("does not advance a PAUSED phase even if its phaseEndAt is in the past", async () => {
    const paused = makeSession({ status: "PAUSED", phaseEndAt: new Date(NOW - 60_000).toISOString() });

    const result = await resolveReconciledSession(paused, "s1", NOW);

    expect(nextPomodoroPhase).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: "ready", session: paused, didAdvance: false });
  });

  it("requires a fresh retry if the advance call fails instead of returning an invalid resumable snapshot", async () => {
    nextPomodoroPhase.mockRejectedValue(new Error("network"));
    const expired = makeSession({ phaseEndAt: new Date(NOW - 60_000).toISOString() });

    const result = await resolveReconciledSession(expired, "s1", NOW);

    expect(nextPomodoroPhase).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ kind: "retry-required" });
    expect(result).not.toMatchObject({ kind: "ready", session: expired });
  });

  it("returns null for a null session", async () => {
    expect(await resolveReconciledSession(null, "s1", NOW)).toBeNull();
    expect(nextPomodoroPhase).not.toHaveBeenCalled();
  });
});
