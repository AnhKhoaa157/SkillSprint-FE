import { useCallback, useEffect, useState } from "react";
import marketplaceService from "./marketplaceService";
import type { MarketplaceLeaderboardEntry } from "./marketplaceTypes";

export function refreshMarketplaceLeaderboard(id: string, scope: "item" | "version" = "item") {
  window.dispatchEvent(new CustomEvent("skillsprint:marketplace-leaderboard-updated", { detail: { id, scope } }));
}

export function useMarketplaceLeaderboard(id: string, limit = 10, scope: "item" | "version" = "item") {
  const [entries, setEntries] = useState<MarketplaceLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = scope === "version"
        ? await marketplaceService.getRankedLeaderboard(id)
        : await marketplaceService.getLeaderboard(id);
      setEntries(data.slice(0, limit));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, limit, scope]);

  useEffect(() => { void refetch(); }, [refetch]);

  useEffect(() => {
    const onLeaderboardUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; scope?: "item" | "version" }>).detail;
      if (detail?.id === id && detail.scope === scope) void refetch();
    };
    window.addEventListener("skillsprint:marketplace-leaderboard-updated", onLeaderboardUpdated);
    return () => window.removeEventListener("skillsprint:marketplace-leaderboard-updated", onLeaderboardUpdated);
  }, [id, refetch, scope]);

  return { entries, loading, error, refetch };
}
