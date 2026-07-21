import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import studySessionService, {
  type StudySessionResponse,
} from "../../../api/learning/studySessionService";
import { useNaturalExpirySync } from "./useNaturalExpirySync";

vi.mock("../../../api/learning/studySessionService", () => ({
  default: {
    nextPomodoroPhase: vi.fn(),
  },
}));

const nextPomodoroPhase = vi.mocked(studySessionService.nextPomodoroPhase);

const serverSnapshot = { sessionId: "s1", status: "IN_PROGRESS" } as unknown as StudySessionResponse;

type Props = {
  naturalExpirySignal: number;
  activeSessionId: string | null;
  onSynced: (session: StudySessionResponse) => void;
  onError: (error: unknown) => void;
};

function setup(initial: Partial<Props> = {}) {
  const onSynced = vi.fn();
  const onError = vi.fn();
  const initialProps: Props = {
    naturalExpirySignal: 0,
    activeSessionId: "s1",
    onSynced,
    onError,
    ...initial,
  };
  const view = renderHook((props: Props) => useNaturalExpirySync(props), { initialProps });
  return { view, onSynced, onError, initialProps };
}

describe("useNaturalExpirySync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextPomodoroPhase.mockResolvedValue(serverSnapshot);
  });

  it("does not call nextPomodoroPhase before any natural expiry", async () => {
    setup({ naturalExpirySignal: 0 });
    expect(nextPomodoroPhase).not.toHaveBeenCalled();
  });

  it("calls nextPomodoroPhase exactly once for a natural expiry and forwards the server snapshot", async () => {
    const { view, onSynced } = setup({ naturalExpirySignal: 0 });

    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError: vi.fn() });

    await waitFor(() => expect(onSynced).toHaveBeenCalledWith(serverSnapshot));
    expect(nextPomodoroPhase).toHaveBeenCalledTimes(1);
    expect(nextPomodoroPhase).toHaveBeenCalledWith("s1");
  });

  it("de-duplicates repeated re-renders with the same expiry signal (StrictMode-safe)", async () => {
    const onSynced = vi.fn();
    const { view } = setup({ naturalExpirySignal: 0, onSynced });

    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError: vi.fn() });
    await waitFor(() => expect(nextPomodoroPhase).toHaveBeenCalledTimes(1));

    // A plain re-render at the same signal must NOT fire another call.
    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError: vi.fn() });
    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError: vi.fn() });

    expect(nextPomodoroPhase).toHaveBeenCalledTimes(1);
  });

  it("fires once per distinct natural expiry", async () => {
    const onSynced = vi.fn();
    const { view } = setup({ naturalExpirySignal: 0, onSynced });

    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError: vi.fn() });
    await waitFor(() => expect(nextPomodoroPhase).toHaveBeenCalledTimes(1));

    view.rerender({ naturalExpirySignal: 2, activeSessionId: "s1", onSynced, onError: vi.fn() });
    await waitFor(() => expect(nextPomodoroPhase).toHaveBeenCalledTimes(2));
  });

  it("does not call the backend when there is no active session", async () => {
    const { view, onSynced } = setup({ naturalExpirySignal: 0, activeSessionId: null });

    view.rerender({ naturalExpirySignal: 1, activeSessionId: null, onSynced, onError: vi.fn() });

    expect(nextPomodoroPhase).not.toHaveBeenCalled();
  });

  it("reports failures through onError without calling onSynced", async () => {
    nextPomodoroPhase.mockRejectedValueOnce(new Error("boom"));
    const onSynced = vi.fn();
    const onError = vi.fn();
    const { view } = setup({ naturalExpirySignal: 0, onSynced, onError });

    view.rerender({ naturalExpirySignal: 1, activeSessionId: "s1", onSynced, onError });

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onSynced).not.toHaveBeenCalled();
  });
});
