import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useBlocker } from "react-router";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PomodoroPhase = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

export const PHASE_DURATIONS: Record<PomodoroPhase, number> = {
  FOCUS: 1500,       // 25 min
  SHORT_BREAK: 300,  // 5 min
  LONG_BREAK: 900,   // 15 min
};

// Paths where the Pomodoro session is allowed to run uninterrupted.
// Navigation within this zone never triggers the exit blocker.
//
// Primary gate: startsWith("/app/learning") catches every sub-route under the
// learning section — /app/learning/course, /app/learning/quiz/:id, etc. —
// without needing an exhaustive list.
//
// Secondary includes: keep the public /learning/course path (no /app prefix)
// and /learning/quiz as fallbacks so the guard stays correct even if the
// public course-player route is ever opened while a session is active.
function isSafeFocusPath(pathname: string): boolean {
  // Normalise: guarantee a leading slash so prefix matching is unambiguous.
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return (
    p.startsWith("/app/learning") ||
    p.includes("/learning/course") ||
    p.includes("/learning/quiz")
  );
}

function formatStudyTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s} giây`;
  if (s === 0) return `${m} phút`;
  return `${m} phút ${s} giây`;
}

// ── Context shape ──────────────────────────────────────────────────────────────

interface PomodoroContextValue {
  // Timer state
  timeLeft: number;
  isTimerRunning: boolean;
  pomodoroPhase: PomodoroPhase;
  actualStudySeconds: number;
  focusCount: number;
  activeStepId: string | null;

  // Core actions
  startTimer: (stepId: string) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipToNextPhase: () => void;
  clearTimerContext: () => void;
  fastForwardTime: (seconds: number) => void;

  // Navigation guard — exposes blocker state so consumers can render a modal
  isNavigationBlocked: boolean;
  proceedNavigation: () => void;
  resetNavigation: () => void;
  /** Human-readable study time, e.g. "23 phút 15 giây" — use inside exit warning. */
  formattedStudyTime: string;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState(PHASE_DURATIONS.FOCUS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("FOCUS");
  const [actualStudySeconds, setActualStudySeconds] = useState(0);
  const [focusCount, setFocusCount] = useState(0);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Stable refs so interval callbacks always see the latest values without
  // being added to the exhaustive-deps list (which would recreate the interval).
  const phaseRef = useRef<PomodoroPhase>("FOCUS");
  phaseRef.current = pomodoroPhase;

  const activeStepIdRef = useRef<string | null>(null);
  activeStepIdRef.current = activeStepId;

  // ── Navigation blocker ───────────────────────────────────────────────────────
  // Block any navigation that leaves the Safe Focus Zone while the timer runs.
  const blockerFn = useCallback(
    ({ nextLocation }: { nextLocation: { pathname: string } }) =>
      isTimerRunning && !isSafeFocusPath(nextLocation.pathname),
    [isTimerRunning],
  );
  const blocker = useBlocker(blockerFn);

  // ── Phase expiry (pure state — no API calls here) ────────────────────────────
  // API sync for natural expiry is handled by CoursePlayer via a useEffect
  // watching `pomodoroPhase` changes.
  const handlePhaseExpire = useCallback((expired: PomodoroPhase) => {
    if (expired === "FOCUS") {
      setFocusCount((c) => c + 1);
      setPomodoroPhase("SHORT_BREAK");
      setTimeLeft(PHASE_DURATIONS.SHORT_BREAK);
      setIsTimerRunning(true); // auto-start the break
    } else {
      // Break ended — reset to FOCUS but require the user to press play
      setPomodoroPhase("FOCUS");
      setTimeLeft(PHASE_DURATIONS.FOCUS);
      // isTimerRunning stays false intentionally
    }
  }, []);

  // ── Core countdown tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;

    const id = setInterval(() => {
      if (phaseRef.current === "FOCUS") {
        setActualStudySeconds((s) => s + 1);
      }
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Calling state setters from inside an updater is batched correctly
          // in React 18 — this is the idiomatic pattern for countdown timers.
          setIsTimerRunning(false);
          handlePhaseExpire(phaseRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isTimerRunning, handlePhaseExpire]);

  // ── Core actions ─────────────────────────────────────────────────────────────

  /**
   * Starts (or resumes) the Pomodoro timer for a given learning step.
   * - Same stepId → simply resumes from the current position.
   * - Different stepId → full reset before starting, as if a new session began.
   */
  const startTimer = useCallback((stepId: string) => {
    const isNewSession = activeStepIdRef.current !== stepId;
    if (isNewSession) {
      setPomodoroPhase("FOCUS");
      setTimeLeft(PHASE_DURATIONS.FOCUS);
      setActualStudySeconds(0);
      setFocusCount(0);
    }
    setActiveStepId(stepId);
    setIsTimerRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setPomodoroPhase("FOCUS");
    setTimeLeft(PHASE_DURATIONS.FOCUS);
  }, []);

  const skipToNextPhase = useCallback(() => {
    setPomodoroPhase((prev) => {
      const next: PomodoroPhase = prev === "FOCUS" ? "SHORT_BREAK" : "FOCUS";
      if (prev === "FOCUS") setFocusCount((c) => c + 1);
      setTimeLeft(PHASE_DURATIONS[next]);
      return next;
    });
    setIsTimerRunning(true);
  }, []);

  const clearTimerContext = useCallback(() => {
    setIsTimerRunning(false);
    setPomodoroPhase("FOCUS");
    setTimeLeft(PHASE_DURATIONS.FOCUS);
    setActualStudySeconds(0);
    setFocusCount(0);
    setActiveStepId(null);
  }, []);

  const fastForwardTime = useCallback((seconds: number) => {
    setActualStudySeconds((prev) => prev + seconds);
  }, []);

  // ── Compose value ─────────────────────────────────────────────────────────────

  const value: PomodoroContextValue = {
    timeLeft,
    isTimerRunning,
    pomodoroPhase,
    actualStudySeconds,
    focusCount,
    activeStepId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextPhase,
    clearTimerContext,
    fastForwardTime,
    isNavigationBlocked: blocker.state === "blocked",
    proceedNavigation: () => {
      if (blocker.state === "blocked") {
        clearTimerContext();
        blocker.proceed();
      }
    },
    resetNavigation: () => {
      if (blocker.state === "blocked") blocker.reset();
    },
    formattedStudyTime: formatStudyTime(actualStudySeconds),
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return ctx;
}
