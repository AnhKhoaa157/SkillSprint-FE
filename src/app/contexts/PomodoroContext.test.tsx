import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PomodoroProvider, usePomodoro } from "./PomodoroContext";

// useBlocker needs a data router; stub it so the provider renders in isolation.
vi.mock("react-router", () => ({
  useBlocker: () => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }),
}));

function renderPomodoro() {
  return renderHook(() => usePomodoro(), { wrapper: PomodoroProvider });
}

describe("PomodoroContext natural-expiry signal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("bumps naturalExpirySignal exactly once when a running phase hits zero", () => {
    const { result } = renderPomodoro();

    expect(result.current.naturalExpirySignal).toBe(0);

    // Seed a running FOCUS phase with 1s left, then let it tick to zero.
    act(() => {
      result.current.hydrateTimer({
        stepId: "step-1",
        phase: "FOCUS",
        timeLeft: 1,
        isRunning: true,
        studySeconds: 0,
      });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.naturalExpirySignal).toBe(1);
  });

  it("does not bump the signal for a manual skip or pause", () => {
    const { result } = renderPomodoro();

    act(() => result.current.startTimer("step-1"));
    act(() => result.current.skipToNextPhase());
    act(() => result.current.pauseTimer());

    expect(result.current.naturalExpirySignal).toBe(0);
  });
});
