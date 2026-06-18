import type { AdminLeaderboardPeriod } from "../../../../../api/admin/adminPointService";

/** Visual metadata per point event type — colored badge classes + a VN label. */
type EventMeta = { label: string; className: string };

const EVENT_TYPE_META: Record<string, EventMeta> = {
  TASK_COMPLETED: { label: "Hoàn thành task", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ROADMAP_STEP_COMPLETED: { label: "Hoàn thành bước", className: "bg-orange-50 text-orange-700 border-orange-200" },
  ROADMAP_COMPLETED: { label: "Hoàn thành roadmap", className: "bg-amber-100 text-amber-800 border-amber-300" },
  QUIZ_PASSED: { label: "Quiz đạt", className: "bg-green-50 text-green-700 border-green-200" },
  QUIZ_EXCELLENT: { label: "Quiz xuất sắc", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  QUIZ_UPGRADE_BONUS: { label: "Thưởng nâng hạng", className: "bg-violet-50 text-violet-700 border-violet-200" },
  ADMIN_ADJUSTMENT: { label: "Điều chỉnh thủ công", className: "bg-slate-100 text-slate-700 border-slate-300" },
};

export function eventTypeMeta(eventType: string): EventMeta {
  return EVENT_TYPE_META[eventType] ?? { label: eventType, className: "bg-slate-100 text-slate-600 border-slate-200" };
}

export const PERIOD_LABEL: Record<AdminLeaderboardPeriod, string> = {
  WEEKLY: "Tuần này",
  MONTHLY: "Tháng này",
  ALL_TIME: "Mọi thời điểm",
};

/** "18/06/2026 14:30" from an ISO 8601 timestamp. Falls back to the raw string. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "18/06/2026" from a date-only (YYYY-MM-DD) or ISO string. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
