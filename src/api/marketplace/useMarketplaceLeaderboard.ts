import { useCallback, useEffect, useState } from "react";
import marketplaceService from "./marketplaceService";
import type { MarketplaceLeaderboardEntry } from "./marketplaceTypes";

export function refreshMarketplaceLeaderboard(itemId: string) {
  window.dispatchEvent(new CustomEvent("skillsprint:marketplace-leaderboard-updated", { detail: { itemId } }));
}

export function useMarketplaceLeaderboard(itemId: string, limit = 10) {
  const [entries, setEntries] = useState<MarketplaceLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refetch = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await marketplaceService.getLeaderboard(itemId);
      setEntries(data.slice(0, limit));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [itemId, limit]);

  useEffect(() => { void refetch(); }, [refetch]);

  useEffect(() => {
    const onLeaderboardUpdated = (event: Event) => {
      if ((event as CustomEvent<{ itemId?: string }>).detail?.itemId === itemId) void refetch();
    };
    window.addEventListener("skillsprint:marketplace-leaderboard-updated", onLeaderboardUpdated);
    return () => window.removeEventListener("skillsprint:marketplace-leaderboard-updated", onLeaderboardUpdated);
  }, [itemId, refetch]);

  return { entries, loading, error, refetch };
}
