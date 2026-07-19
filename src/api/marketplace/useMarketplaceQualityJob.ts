import { useCallback, useEffect, useRef, useState } from "react";
import marketplaceService from "./marketplaceService";
import type { MarketplaceQualityJob } from "./marketplaceTypes";

const POLL_INTERVAL_MS = 3_000;
const ACTIVE_STATUSES = new Set(["QUEUED", "RUNNING"]);

function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Không thể tải trạng thái kiểm định chất lượng.";
}

export function isCurrentQualityPass(job: MarketplaceQualityJob | null): boolean {
  return job?.status === "PASSED" && job.currentSnapshot;
}

export function useMarketplaceQualityJob(versionId: string | null | undefined) {
  const [job, setJob] = useState<MarketplaceQualityJob | null>(null);
  const [loading, setLoading] = useState(Boolean(versionId));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async (silent = false) => {
    if (!versionId) {
      requestIdRef.current += 1;
      setJob(null);
      setLoading(false);
      return null;
    }

    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const latest = await marketplaceService.getLatestCreatorQualityJob(versionId);
      if (mountedRef.current && requestId === requestIdRef.current) setJob(latest);
      return latest;
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return null;
      if (statusOf(requestError) === 404) {
        setJob(null);
      } else {
        setError(messageOf(requestError));
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current && !silent) setLoading(false);
    }
  }, [versionId]);

  const start = useCallback(async () => {
    if (!versionId) return null;
    setStarting(true);
    setError(null);
    try {
      const queued = await marketplaceService.queueCreatorQualityJob(versionId);
      if (mountedRef.current) setJob(queued);
      return queued;
    } catch (requestError) {
      if (mountedRef.current) setError(messageOf(requestError));
      return null;
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }, [versionId]);

  useEffect(() => {
    mountedRef.current = true;
    setJob(null);
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!job || !ACTIVE_STATUSES.has(job.status)) return;
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      await refetch(true);
      if (!cancelled) timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };
    timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [job, refetch]);

  return {
    job,
    loading,
    starting,
    error,
    active: Boolean(job && ACTIVE_STATUSES.has(job.status)),
    passed: isCurrentQualityPass(job),
    refetch,
    start,
  };
}
