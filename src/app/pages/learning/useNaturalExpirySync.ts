import { useEffect, useRef } from "react";
import studySessionService, {
  type StudySessionResponse,
} from "../../../api/learning/studySessionService";

type NaturalExpirySyncParams = {
  /** Bumped by PomodoroContext once per natural phase expiry. */
  naturalExpirySignal: number;
  activeSessionId: string | null;
  /** Called with the authoritative backend snapshot after a successful sync. */
  onSynced: (session: StudySessionResponse) => void;
  onError: (error: unknown) => void;
};

/**
 * Calls `POST /pomodoro/next-phase` exactly once for each natural phase expiry
 * and hands the authoritative response back to the caller. Manual skip, pause,
 * resume, and hydration never bump `naturalExpirySignal`, so they never trigger a
 * call here. A ref guards against duplicate calls from re-renders / Strict Mode.
 */
export function useNaturalExpirySync({
  naturalExpirySignal,
  activeSessionId,
  onSynced,
  onError,
}: NaturalExpirySyncParams): void {
  const processedSignalRef = useRef(0);

  useEffect(() => {
    if (naturalExpirySignal === 0) return;
    if (processedSignalRef.current === naturalExpirySignal) return;
    if (!activeSessionId) return;

    processedSignalRef.current = naturalExpirySignal;
    let cancelled = false;

    void (async () => {
      try {
        const updated = await studySessionService.nextPomodoroPhase(activeSessionId);
        if (!cancelled) onSynced(updated);
      } catch (error) {
        if (!cancelled) onError(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [naturalExpirySignal, activeSessionId, onSynced, onError]);
}
