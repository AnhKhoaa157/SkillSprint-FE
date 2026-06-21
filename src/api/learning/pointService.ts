import { requestJson } from "../core/apiClient";
import type {
  LeaderboardPeriod,
  LeaderboardResponse,
  MyPointEvent,
  UserPointSummary,
} from "../core/skillSprintModels";

/**
 * Points / Leaderboard / Scoring API layer (learner-facing).
 *
 * Learner endpoints (LIVE on the backend):
 *   GET /api/leaderboard/me                         → own summary + ranks
 *   GET /api/leaderboard/{weekly|monthly|all-time}  → ranked entries (BE aggregates)
 *
 * Admin points/leaderboard endpoints live in `api/admin/adminPointService.ts`
 * (GET /api/admin/leaderboard, /api/admin/users/{id}/points + /point-events).
 */

const PERIOD_PATH: Record<LeaderboardPeriod, string> = {
  weekly: "/api/leaderboard/weekly",
  monthly: "/api/leaderboard/monthly",
  "all-time": "/api/leaderboard/all-time",
};

/** Fetch the logged-in user's total points and current rank. */
export async function getMeSummary(): Promise<UserPointSummary> {
  const res = await requestJson<UserPointSummary>("/api/leaderboard/me", { method: "GET" });
  if (!res.data) throw new Error(res.message || "Không thể tải điểm của bạn");
  return res.data;
}

/**
 * Fetch the logged-in user's own point ledger, newest first.
 * GET /api/leaderboard/me/events → flat (non-paginated) list of PointEventResponse.
 * Used to verify a real award exists before celebrating (e.g. ROADMAP_COMPLETED).
 */
export async function getMyPointEvents(): Promise<MyPointEvent[]> {
  const res = await requestJson<MyPointEvent[]>("/api/leaderboard/me/events", { method: "GET" });
  return res.data ?? [];
}

/** Fetch the top users for a scope. The BE aggregates ranking server-side. */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  size = 50,
): Promise<LeaderboardResponse> {
  const path = `${PERIOD_PATH[period]}?size=${encodeURIComponent(String(size))}`;
  const res = await requestJson<LeaderboardResponse>(path, { method: "GET" });
  if (!res.data) throw new Error(res.message || "Không thể tải bảng xếp hạng");
  return res.data;
}

export default {
  getMeSummary,
  getMyPointEvents,
  getLeaderboard,
};
