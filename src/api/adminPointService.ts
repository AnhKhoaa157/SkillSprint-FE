import { requestJson } from "./apiClient";

/**
 * Admin Points / Leaderboard API layer. All endpoints are under /api/admin and
 * require an ADMIN session (the shared requestJson client attaches the bearer +
 * X-Session-Id headers).
 */

export type AdminLeaderboardPeriod = "WEEKLY" | "MONTHLY" | "ALL_TIME";

export type AdminLeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  /** Already a presigned S3 URL — usable directly as an <img> src. */
  avatarObjectKey: string | null;
  points: number;
  streakDays: number;
  lastPointDate: string | null;
};

/** The `entries` field uses the custom PageResponse<T> envelope (items / totalItems). */
export type AdminLeaderboardResponse = {
  period: AdminLeaderboardPeriod;
  periodStart: string | null;
  periodEnd: string | null;
  entries: PageResponse<AdminLeaderboardEntry>;
};

export type AdminUserPointSummaryResponse = {
  userId: string;
  fullName: string;
  email: string;
  avatarObjectKey: string | null;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  streakDays: number;
  lastPointDate: string | null;
  weeklyRank: number | null;
  monthlyRank: number | null;
  allTimeRank: number | null;
};

export type AdminPointEventType =
  | "TASK_COMPLETED"
  | "ROADMAP_STEP_COMPLETED"
  | "ROADMAP_COMPLETED"
  | "QUIZ_PASSED"
  | "QUIZ_EXCELLENT"
  | "QUIZ_UPGRADE_BONUS"
  | "ADMIN_ADJUSTMENT";

export type AdminPointEventResponse = {
  eventType: string;
  sourceType: string;
  sourceId: string;
  points: number;
  description: string;
  workspaceId: string | null;
  workspaceName: string | null;
  eventDate: string | null;
  createdAt: string;
};

/** Custom backend PageResponse<T> envelope (items / totalItems). */
export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

const EMPTY_PAGE: PageResponse<AdminPointEventResponse> = {
  items: [],
  page: 0,
  size: 0,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export type GetAdminLeaderboardParams = {
  period: AdminLeaderboardPeriod;
  search?: string;
  page?: number;
  size?: number;
};

/** GET /api/admin/leaderboard */
export async function getAdminLeaderboard(
  params: GetAdminLeaderboardParams,
): Promise<AdminLeaderboardResponse> {
  const q = new URLSearchParams();
  q.set("period", params.period);
  if (params.search && params.search.trim()) q.set("search", params.search.trim());
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const res = await requestJson<AdminLeaderboardResponse>(
    `/api/admin/leaderboard?${q.toString()}`,
    { method: "GET" },
  );
  if (!res.data) throw new Error(res.message || "Không thể tải bảng xếp hạng");
  return res.data;
}

/** GET /api/admin/users/{userId}/points */
export async function getAdminUserPointSummary(
  userId: string,
): Promise<AdminUserPointSummaryResponse> {
  const res = await requestJson<AdminUserPointSummaryResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/points`,
    { method: "GET" },
  );
  if (!res.data) throw new Error(res.message || "Không thể tải tổng quan điểm");
  return res.data;
}

export type GetAdminUserPointEventsParams = {
  type?: AdminPointEventType | "";
  from?: string;
  to?: string;
  /** UUID of the workspace to filter events by. */
  workspaceId?: string;
  page?: number;
  size?: number;
};

/** GET /api/admin/users/{userId}/point-events */
export async function getAdminUserPointEvents(
  userId: string,
  params: GetAdminUserPointEventsParams = {},
): Promise<PageResponse<AdminPointEventResponse>> {
  const q = new URLSearchParams();
  if (params.type) q.set("type", params.type);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.workspaceId) q.set("workspaceId", params.workspaceId);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const res = await requestJson<PageResponse<AdminPointEventResponse>>(
    `/api/admin/users/${encodeURIComponent(userId)}/point-events?${q.toString()}`,
    { method: "GET" },
  );
  return res.data ?? EMPTY_PAGE;
}

export default {
  getAdminLeaderboard,
  getAdminUserPointSummary,
  getAdminUserPointEvents,
};
