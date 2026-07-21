import { describe, it, expect } from "vitest";
import {
  authoritativeStudiedMinutes,
  deriveTimerSnapshot,
  isExpiredRunningPhase,
  shouldClearSessionPointer,
} from "./pomodoroHydration";
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

describe("authoritativeStudiedMinutes (server-authoritative quiz/completion gate)", () => {
  // The 24:56 screenshot, proven as Case B: a single active FOCUS phase, 4 seconds
  // in (24:56 remaining), with NO prior completed focus minutes. The gate must read
  // ~0 minutes and cannot satisfy a 25-minute (or even the 20-minute) requirement —
  // regardless of whatever the client's visual counter shows.
  it("credits ~0 minutes for a fresh FOCUS at 24:56 with no completed cycles, failing the gate", () => {
    const phaseEndAt = new Date(NOW + 1496 * 1000).toISOString(); // 24:56 remaining
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "IN_PROGRESS",
        currentPhase: "FOCUS",
        completedFocusMinutes: 0,
        phaseEndAt,
      }),
    });

    const minutes = authoritativeStudiedMinutes(session, NOW);

    expect(minutes).toBe(0); // 4 seconds of study — never 25
    expect(minutes >= 25).toBe(false);
    expect(minutes >= 20).toBe(false); // cannot unlock the minimum gate either
  });

  // Case A: one genuinely completed 25-minute focus cycle already credited, plus a
  // brand-new FOCUS phase 4 seconds in. The gate must reflect the real 25 completed
  // minutes and only ~4 seconds of the current cycle.
  it("credits exactly the prior completed cycle plus current-cycle seconds", () => {
    const phaseEndAt = new Date(NOW + 1496 * 1000).toISOString(); // new FOCUS, 24:56 left
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "IN_PROGRESS",
        currentPhase: "FOCUS",
        currentCycle: 2,
        completedFocusMinutes: 25,
        phaseEndAt,
      }),
    });

    const snap = deriveTimerSnapshot(session, NOW);
    expect(snap.studySeconds).toBe(25 * 60 + 4); // 25 completed minutes + 4 seconds

    const minutes = authoritativeStudiedMinutes(session, NOW);
    expect(minutes).toBe(25);
    expect(minutes >= 20).toBe(true); // a real completed cycle DOES satisfy the gate
  });

  it("does not unlock the gate from a paused zero-second legacy snapshot", () => {
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "PAUSED",
        currentPhase: "FOCUS",
        completedFocusMinutes: 0,
        remainingSeconds: 0,
      }),
    });

    expect(authoritativeStudiedMinutes(session, NOW)).toBe(0);
  });

  it("counts credited focus minutes on a paused mid-focus snapshot without client input", () => {
    // Paused with 5 minutes left of a 25-minute focus → 20 authoritative minutes,
    // enough to satisfy a 20-minute minimum with no client counter involved.
    const session = makeSession({
      pomodoro: makePomodoro({
        status: "PAUSED",
        currentPhase: "FOCUS",
        completedFocusMinutes: 0,
        remainingSeconds: 5 * 60,
      }),
    });

    expect(authoritativeStudiedMinutes(session, NOW)).toBe(20);
  });

  it("returns 0 when there is no session or Pomodoro (no client fallback)", () => {
    expect(authoritativeStudiedMinutes(null, NOW)).toBe(0);
    expect(authoritativeStudiedMinutes(makeSession({ pomodoro: null }), NOW)).toBe(0);
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
