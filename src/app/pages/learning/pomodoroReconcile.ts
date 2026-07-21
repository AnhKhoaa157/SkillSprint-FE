import studySessionService, {
  type StudySessionResponse,
} from "../../../api/learning/studySessionService";
import { isExpiredRunningPhase } from "./pomodoroHydration";

export type PomodoroReconcileResult =
  | { kind: "ready"; session: StudySessionResponse; didAdvance: boolean }
  | { kind: "retry-required"; error: unknown };

/**
 * Resolve the authoritative session snapshot to hydrate from.
 *
 * If the server still reports the phase as IN_PROGRESS but its `phaseEndAt` has
 * already passed (the timer ran out while the tab was closed or throttled in the
 * background), advance it server-side exactly once via `nextPomodoroPhase` and
 * return that response — the phase must be advanced, NEVER resumed. On any failure
 * we fall back to the last known session so the UI still reflects the server.
 *
 * Otherwise the session is returned unchanged for a normal hydrate. Time is never
 * credited on the client here.
 */
export async function resolveReconciledSession(
  session: StudySessionResponse | null,
  activeSessionId: string | null,
  now: number = Date.now(),
): Promise<PomodoroReconcileResult | null> {
  if (!session) return null;
  if (activeSessionId && isExpiredRunningPhase(session, now)) {
    try {
      return {
        kind: "ready",
        session: await studySessionService.nextPomodoroPhase(activeSessionId),
        didAdvance: true,
      };
    } catch (error: unknown) {
      return { kind: "retry-required", error };
    }
  }
  return { kind: "ready", session, didAdvance: false };
}
