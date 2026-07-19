import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import marketplaceService from "./marketplaceService";
import { isCurrentQualityPass, useMarketplaceQualityJob } from "./useMarketplaceQualityJob";
import type { MarketplaceQualityJob } from "./marketplaceTypes";

vi.mock("./marketplaceService", () => ({
  default: {
    getLatestCreatorQualityJob: vi.fn(),
    queueCreatorQualityJob: vi.fn(),
  },
}));

const queuedJob: MarketplaceQualityJob = {
  jobId: "job-1",
  versionId: "version-1",
  status: "QUEUED",
  score: null,
  currentSnapshot: true,
  retryCount: 0,
  maxRetries: 2,
  startedAt: null,
  completedAt: null,
  createdAt: "2026-07-19T00:00:00Z",
  report: null,
};

describe("useMarketplaceQualityJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => vi.useRealTimers());

  it("polls only while a quality job is active and stops after it passes", async () => {
    vi.useFakeTimers();
    const passedJob = { ...queuedJob, status: "PASSED", score: 100 } satisfies MarketplaceQualityJob;
    vi.mocked(marketplaceService.getLatestCreatorQualityJob)
      .mockResolvedValueOnce(queuedJob)
      .mockResolvedValueOnce(passedJob);

    const { result } = renderHook(() => useMarketplaceQualityJob("version-1"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.job).toEqual(queuedJob);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(result.current.passed).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(marketplaceService.getLatestCreatorQualityJob).toHaveBeenCalledTimes(2);
  });

  it("treats a missing job as an empty state and can queue one", async () => {
    vi.mocked(marketplaceService.getLatestCreatorQualityJob)
      .mockRejectedValueOnce(Object.assign(new Error("Not found"), { status: 404 }));
    vi.mocked(marketplaceService.queueCreatorQualityJob).mockResolvedValueOnce(queuedJob);

    const { result } = renderHook(() => useMarketplaceQualityJob("version-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.job).toBeNull();

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.job).toEqual(queuedJob);
  });

  it("keeps polling an active job after a transient request failure", async () => {
    vi.useFakeTimers();
    const passedJob = { ...queuedJob, status: "PASSED", score: 100 } satisfies MarketplaceQualityJob;
    vi.mocked(marketplaceService.getLatestCreatorQualityJob)
      .mockResolvedValueOnce(queuedJob)
      .mockRejectedValueOnce(new Error("Temporary network failure"))
      .mockResolvedValueOnce(passedJob);

    const { result } = renderHook(() => useMarketplaceQualityJob("version-1"));
    await act(async () => { await Promise.resolve(); });

    await act(async () => { await vi.advanceTimersByTimeAsync(3_000); });
    expect(result.current.error).toBe("Temporary network failure");
    expect(result.current.active).toBe(true);

    await act(async () => { await vi.advanceTimersByTimeAsync(3_000); });
    expect(result.current.passed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("ignores an older version response after the route changes", async () => {
    let resolveOld: ((job: MarketplaceQualityJob) => void) | undefined;
    const oldRequest = new Promise<MarketplaceQualityJob>(resolve => { resolveOld = resolve; });
    const currentJob = { ...queuedJob, jobId: "job-2", versionId: "version-2" };
    vi.mocked(marketplaceService.getLatestCreatorQualityJob)
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(currentJob);

    const { result, rerender } = renderHook(
      ({ versionId }) => useMarketplaceQualityJob(versionId),
      { initialProps: { versionId: "version-1" } },
    );
    rerender({ versionId: "version-2" });
    await waitFor(() => expect(result.current.job).toEqual(currentJob));

    await act(async () => { resolveOld?.(queuedJob); await oldRequest; });
    expect(result.current.job).toEqual(currentJob);
  });

  it("requires both PASSED and the current snapshot", () => {
    expect(isCurrentQualityPass({ ...queuedJob, status: "PASSED", currentSnapshot: true })).toBe(true);
    expect(isCurrentQualityPass({ ...queuedJob, status: "PASSED", currentSnapshot: false })).toBe(false);
    expect(isCurrentQualityPass(queuedJob)).toBe(false);
  });
});
