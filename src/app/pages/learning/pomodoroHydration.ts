import type { PomodoroPhase } from "../../contexts/PomodoroContext";
import type { StudySessionResponse } from "../../../api/learning/studySessionService";

/**
 * Derived, backend-authoritative view of a Pomodoro timer for the CoursePlayer.
 * Kept as a pure function (no React) so the hierarchy rules below can be unit
 * tested directly, without rendering the whole player.
 */
export type PomodoroTimerSnapshot = {
  /** The timer can still tick (Pomodoro is IN_PROGRESS or PAUSED). */
  hasRunnableTimer: boolean;
  /** Pomodoro finished but the parent StudySession is still open — the learner
   *  must be offered a new cycle / finish, never have the session cleared. */
  isPomodoroExhausted: boolean;
  phase: PomodoroPhase;
  timeLeft: number;
  isRunning: boolean;
  studySeconds: number;
};

const VALID_PHASES: readonly PomodoroPhase[] = ["FOCUS", "SHORT_BREAK", "LONG_BREAK"];

function normalizePhase(value: unknown): PomodoroPhase {
  const upper = String(value ?? "FOCUS").toUpperCase();
  return (VALID_PHASES as readonly string[]).includes(upper) ? (upper as PomodoroPhase) : "FOCUS";
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").toUpperCase();
}

/**
 * The single rule for when the stored `activeSessionId` pointer may be dropped:
 * ONLY when the authoritative StudySession status is COMPLETED. A completed or
 * absent Pomodoro must never, on its own, clear the parent StudySession pointer.
 */
export function shouldClearSessionPointer(session: StudySessionResponse | null | undefined): boolean {
  return normalizeStatus(session?.status) === "COMPLETED";
}

/**
 * True when the server still reports the Pomodoro as IN_PROGRESS but its
 * `phaseEndAt` has already passed — i.e. the phase ran out while the tab was
 * closed or throttled in the background. Such a phase must be advanced via
 * `nextPomodoroPhase` (never resumed), so the caller reconciles it exactly once.
 */
export function isExpiredRunningPhase(
  session: StudySessionResponse | null | undefined,
  now: number = Date.now(),
): boolean {
  const pomodoro = session?.pomodoro;
  if (!pomodoro) return false;
  if (normalizeStatus(pomodoro.status) !== "IN_PROGRESS") return false;
  if (!pomodoro.phaseEndAt) return false;
  const endMs = new Date(pomodoro.phaseEndAt).getTime();
  if (Number.isNaN(endMs)) return false;
  return endMs <= now;
}

/**
 * Recompute the live timer state from a backend StudySession snapshot. Used both
 * for F5 re-hydration and after every pause/resume/skip so local state always
 * follows the server rather than being advanced blindly on the client.
 *
 * `now` is injectable for deterministic tests.
 */
export function deriveTimerSnapshot(
  session: StudySessionResponse | null | undefined,
  now: number = Date.now(),
): PomodoroTimerSnapshot {
  const empty: PomodoroTimerSnapshot = {
    hasRunnableTimer: false,
    isPomodoroExhausted: false,
    phase: "FOCUS",
    timeLeft: 0,
    isRunning: false,
    studySeconds: 0,
  };

  const pomodoro = session?.pomodoro;
  if (!pomodoro) {
    return empty;
  }

  const sessionCompleted = normalizeStatus(session?.status) === "COMPLETED";
  const pomodoroStatus = normalizeStatus(pomodoro.status);
  const phase = normalizePhase(pomodoro.currentPhase);
  const runnable = pomodoroStatus === "IN_PROGRESS" || pomodoroStatus === "PAUSED";
  const isRunning = pomodoroStatus === "IN_PROGRESS";

  const focusSeconds = Math.max(0, Math.floor((pomodoro.focusMinutes ?? 25) * 60));

  let remaining = Math.max(0, Math.floor(pomodoro.remainingSeconds ?? 0));
  // While running, derive the true remaining seconds from the phase deadline so a
  // refresh/clock gap never rewinds the countdown.
  if (isRunning && pomodoro.phaseEndAt) {
    const endMs = new Date(pomodoro.phaseEndAt).getTime();
    if (!Number.isNaN(endMs)) {
      remaining = Math.max(0, Math.round((endMs - now) / 1000));
    }
  }

  // Accumulated study time = credited whole focus minutes + the seconds already
  // spent inside the current focus phase (full − remaining). Only add the in-phase
  // portion while the Pomodoro is still runnable, otherwise a COMPLETED phase
  // (remaining 0) would falsely add a whole focus cycle.
  let studySeconds = Math.max(0, Math.floor((pomodoro.completedFocusMinutes ?? 0) * 60));
  // A legacy server response may contain PAUSED + 0 seconds before it has
  // actually credited the just-ended focus phase. Never manufacture a full
  // focus cycle on the client from that inconsistent snapshot.
  const isUncreditedPausedExpiry = pomodoroStatus === "PAUSED" && remaining === 0;
  if (phase === "FOCUS" && runnable && !isUncreditedPausedExpiry) {
    studySeconds += Math.max(0, focusSeconds - remaining);
  }

  return {
    hasRunnableTimer: runnable,
    isPomodoroExhausted: !runnable && !sessionCompleted,
    phase,
    timeLeft: runnable ? remaining : 0,
    isRunning,
    studySeconds,
  };
}
