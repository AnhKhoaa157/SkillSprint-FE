import { describe, it, expect } from "vitest";
import { deriveTimerSnapshot, isExpiredRunningPhase, shouldClearSessionPointer } from "./pomodoroHydration";
import type {
  PomodoroTimerResponse,
  StudySessionResponse,
} from "../../../api/learning/studySessionService";

const NOW = Date.UTC(2026, 6, 21, 10, 0, 0); // fixed clock for determinism

function makePomodoro(overrides: Partial<PomodoroTimerResponse> = {}): PomodoroTimerResponse {
  return {
    pomodoroId: "pomo-1",
    status: "IN_PROGRESS",
    currentPhase: "FOCUS",
    currentCycle: 1,
    totalCycles: 4,
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    remainingSeconds: 1500,
    phaseStartedAt: null,
    phaseEndAt: null,
    startedAt: null,
    endedAt: null,
    completedFocusMinutes: 0,
    ...overrides,
  };
}

function makeSession(overrides: Partial<StudySessionResponse> = {}): StudySessionResponse {
  return {
    sessionId: "session-1",
    workspaceId: "workspace-1",
    calendarTaskId: "task-1",
    roadmapStepId: "step-1",
    status: "IN_PROGRESS",
    startedAt: null,
    endedAt: null,
    durationMinutes: null,
    notes: null,
    focusScore: null,
    taskCompleted: null,
    minimumRequiredMinutes: null,
    pomodoro: makePomodoro(),
    ...overrides,
  };
}

describe("shouldClearSessionPointer", () => {
  it("clears the pointer ONLY when the StudySession itself is COMPLETED", () => {
    expect(shouldClearSessionPointer(makeSession({ status: "COMPLETED" }))).toBe(true);
  });

  it("keeps the pointer when the StudySession is IN_PROGRESS but the Pomodoro is COMPLETED", () => {
    const session = makeSession({
      status: "IN_PROGRESS",
      pomodoro: makePomodoro({ status: "COMPLETED", remainingSeconds: 0 }),
    });
    expect(shouldClearSessionPointer(session)).toBe(false);
  });

  it("keeps the pointer when the StudySession is IN_PROGRESS and the Pomodoro is absent", () => {
    expect(shouldClearSessionPointer(makeSession({ status: "IN_PROGRESS", pomodoro: null }))).toBe(false);
  });
});

describe("deriveTimerSnapshot", () => {
  it("marks the timer exhausted (not clearable) when the Pomodoro is COMPLETED but the session is open", () => {
    const session = makeSession({
      status: "IN_PROGRESS",
      pomodoro: makePomodoro({ status: "COMPLETED", currentPhase: "FOCUS", completedFocusMinutes: 3, remainingSeconds: 0 }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.hasRunnableTimer).toBe(false);
    expect(snap.isPomodoroExhausted).toBe(true);
    expect(snap.isRunning).toBe(false);
    expect(snap.timeLeft).toBe(0);
    // Only the credited focus minutes count — never a full 25-min cycle for a
    // phase that was skipped rather than genuinely completed.
    expect(snap.studySeconds).toBe(3 * 60);
  });

  it("does not treat a COMPLETED StudySession as an exhausted (resumable) timer", () => {
    const session = makeSession({
      status: "COMPLETED",
      pomodoro: makePomodoro({ status: "COMPLETED", remainingSeconds: 0 }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.hasRunnableTimer).toBe(false);
    expect(snap.isPomodoroExhausted).toBe(false);
  });

  it("derives remaining time from phaseEndAt and adds in-phase focus seconds while running", () => {
    const phaseEndAt = new Date(NOW + 1320 * 1000).toISOString(); // 22 min left
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "IN_PROGRESS",
        currentPhase: "FOCUS",
        completedFocusMinutes: 0,
        phaseEndAt,
      }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.isRunning).toBe(true);
    expect(snap.timeLeft).toBe(1320);
    // 25:00 focus − 22:00 remaining = 3:00 already studied in this phase.
    expect(snap.studySeconds).toBe(180);
  });

  it("reflects a manual skip result: a break phase with only the credited focus minutes", () => {
    // After skipping FOCUS a few minutes in, the backend returns a SHORT_BREAK
    // with completedFocusMinutes reflecting the small elapsed credit — never 25.
    const breakEndAt = new Date(NOW + 300 * 1000).toISOString();
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "IN_PROGRESS",
        currentPhase: "SHORT_BREAK",
        completedFocusMinutes: 3,
        remainingSeconds: 300,
        phaseEndAt: breakEndAt,
      }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.phase).toBe("SHORT_BREAK");
    expect(snap.hasRunnableTimer).toBe(true);
    expect(snap.isPomodoroExhausted).toBe(false);
    // Break phases add no focus seconds; only the credited 3 minutes count.
    expect(snap.studySeconds).toBe(180);
  });

  it("does not award a full focus cycle from a paused zero-second legacy snapshot", () => {
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "PAUSED",
        currentPhase: "FOCUS",
        completedFocusMinutes: 0,
        remainingSeconds: 0,
      }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.phase).toBe("FOCUS");
    expect(snap.isRunning).toBe(false);
    expect(snap.timeLeft).toBe(0);
    expect(snap.studySeconds).toBe(0);
  });

  it("returns an empty snapshot when there is no Pomodoro", () => {
    const snap = deriveTimerSnapshot(makeSession({ pomodoro: null }), NOW);
    expect(snap.hasRunnableTimer).toBe(false);
    expect(snap.isPomodoroExhausted).toBe(false);
    expect(snap.studySeconds).toBe(0);
  });

  // Bug B: a terminal / non-runnable server snapshot must render 00:00, paused,
  // the SERVER phase (not a stale local one), with accumulated study preserved.
  it("hydrates a completed terminal snapshot to the server phase at 00:00, paused, study preserved", () => {
    const session = makeSession({
      status: "IN_PROGRESS",
      pomodoro: makePomodoro({
        status: "COMPLETED",
        currentPhase: "SHORT_BREAK",
        completedFocusMinutes: 50,
        remainingSeconds: 0,
        phaseEndAt: new Date(NOW - 1000).toISOString(),
      }),
    });

    const snap = deriveTimerSnapshot(session, NOW);

    expect(snap.phase).toBe("SHORT_BREAK"); // server-aligned, never a stale local phase
    expect(snap.timeLeft).toBe(0);
    expect(snap.isRunning).toBe(false);
    expect(snap.hasRunnableTimer).toBe(false);
    expect(snap.studySeconds).toBe(50 * 60); // accumulated study preserved
  });
});

describe("isExpiredRunningPhase", () => {
  it("is true for an IN_PROGRESS phase whose phaseEndAt has passed", () => {
    const session = makeSession({
      pomodoro: makePomodoro({ status: "IN_PROGRESS", phaseEndAt: new Date(NOW - 1000).toISOString() }),
    });
    expect(isExpiredRunningPhase(session, NOW)).toBe(true);
  });

  it("is false while the IN_PROGRESS phase still has time left", () => {
    const session = makeSession({
      pomodoro: makePomodoro({ status: "IN_PROGRESS", phaseEndAt: new Date(NOW + 60_000).toISOString() }),
    });
    expect(isExpiredRunningPhase(session, NOW)).toBe(false);
  });

  it("is false for a PAUSED phase even past phaseEndAt (must not auto-advance a pause)", () => {
    const session = makeSession({
      pomodoro: makePomodoro({ status: "PAUSED", phaseEndAt: new Date(NOW - 60_000).toISOString() }),
    });
    expect(isExpiredRunningPhase(session, NOW)).toBe(false);
  });

  it("is false when there is no Pomodoro or no phaseEndAt", () => {
    expect(isExpiredRunningPhase(makeSession({ pomodoro: null }), NOW)).toBe(false);
    expect(
      isExpiredRunningPhase(
        makeSession({ pomodoro: makePomodoro({ status: "IN_PROGRESS", phaseEndAt: null }) }),
        NOW,
      ),
    ).toBe(false);
  });
});
