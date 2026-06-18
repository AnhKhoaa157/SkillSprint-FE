import { requestJson } from "../core/apiClient";
import type {
  AdjustUserPointsRequest,
  LeaderboardPeriod,
  LeaderboardResponse,
  MyPointEvent,
  PointHistoryLog,
  UserPointSummary,
} from "../core/skillSprintModels";

/**
 * Points / Leaderboard / Scoring API layer.
 *
 * Learner endpoints (LIVE on the backend):
 *   GET /api/leaderboard/me                         → own summary + ranks
 *   GET /api/leaderboard/{weekly|monthly|all-time}  → ranked entries (BE aggregates)
 *
 * Admin endpoints (CONTRACT — pending on the backend; these will 404 until the
 * point_history_log + adjust-score + leaderboard-ban work ships server-side):
 *   GET   /api/admin/users/{id}/point-history
 *   PATCH /api/admin/users/{id}/adjust-score
 *   PATCH /api/admin/users/{id}/leaderboard-ban?banned=...
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

type PointHistoryEnvelope =
  | PointHistoryLog[]
  | { items?: PointHistoryLog[]; content?: PointHistoryLog[] }
  | null;

/** Admin: fetch a user's point addition/deduction audit log. */
export async function getPointHistory(userId: string): Promise<PointHistoryLog[]> {
  const res = await requestJson<PointHistoryEnvelope>(
    `/api/admin/users/${encodeURIComponent(userId)}/point-history`,
    { method: "GET" },
  );
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.content ?? [];
}

/** Admin: adjust a user's points by a (possibly negative) delta with a mandatory reason. */
export async function adjustUserPoints(
  userId: string,
  payload: AdjustUserPointsRequest,
): Promise<PointHistoryLog | null> {
  const res = await requestJson<PointHistoryLog>(
    `/api/admin/users/${encodeURIComponent(userId)}/adjust-score`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return res.data;
}

/** Admin: ban or unban a user from all leaderboard scopes. */
export async function toggleLeaderboardBan(userId: string, isBanned: boolean): Promise<void> {
  await requestJson<unknown>(
    `/api/admin/users/${encodeURIComponent(userId)}/leaderboard-ban?banned=${isBanned ? "true" : "false"}`,
    { method: "PATCH" },
  );
}

export default {
  getMeSummary,
  getMyPointEvents,
  getLeaderboard,
  getPointHistory,
  adjustUserPoints,
  toggleLeaderboardBan,
};
