import type { AdminUserDetail, SubscriptionAdminResponse } from "../../../../api/adminUserService";
import type { ServicePlanType } from "../../../../api/adminSubscriptionPlansService";

/* -------------------------------------------------------------------------- */
/*  Select options — single source of truth for the admin action dropdowns.   */
/* -------------------------------------------------------------------------- */

export type SelectOption = { label: string; value: string };

export const STATUS_OPTIONS: SelectOption[] = [
  { label: "Hoạt động (ACTIVE)", value: "ACTIVE" },
  { label: "Vô hiệu (DISABLE)", value: "DISABLED" },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { label: "Quản trị viên (ADMIN)", value: "ADMIN" },
  { label: "Người học (LEARNER)", value: "LEARNER" },
];

export const PLAN_TYPE_OPTIONS: SelectOption[] = [
  { label: "Gói người dùng mới (FREE)", value: "FREE" },
  { label: "Gói cá nhân nâng cao (SKILL_BUILDER)", value: "SKILL_BUILDER" },
  { label: "Gói tối cao đầy đủ (PREMIUM)", value: "PREMIUM" },
  { label: "Gói hệ thống đặc quyền (ADMIN_DEFAULT)", value: "ADMIN_DEFAULT" },
];

/* -------------------------------------------------------------------------- */
/*  Account-status badge palette.                                             */
/* -------------------------------------------------------------------------- */

export type StatusBadge = { bg: string; text: string; border: string; label: string };

const STATUS_BADGE: Record<string, StatusBadge> = {
  ACTIVE: { bg: "rgba(34,197,94,0.08)", text: "#16A34A", border: "rgba(34,197,94,0.15)", label: "Hoạt động" },
  DISABLE: { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
  DISABLED: { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
};

export function getStatusBadge(status?: string | null): StatusBadge {
  return (
    STATUS_BADGE[String(status).toUpperCase()] ?? {
      bg: "#F3F4F6",
      text: "#6B7280",
      border: "#E5E7EB",
      label: status || "Không rõ",
    }
  );
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers.                                                             */
/* -------------------------------------------------------------------------- */

/** Resolve a usable avatar URL, treating "null"/"undefined"/empty strings as absent. */
export function getUserAvatarUrl(user: AdminUserDetail): string {
  const candidate = user.avatarUrl ?? (user as { avatar?: unknown }).avatar;
  if (typeof candidate !== "string") return "";
  const trimmed = candidate.trim();
  const normalized = trimmed.toLowerCase();
  if (!trimmed || normalized === "null" || normalized === "undefined") return "";
  return trimmed;
}

/** Admin plans are open-ended — identified by explicit type or an "ADMIN" name. */
export function isAdminPlan(sub?: SubscriptionAdminResponse | null): boolean {
  if (!sub) return false;
  return sub.planType === "ADMIN_DEFAULT" || String(sub.planName).toUpperCase().includes("ADMIN");
}

/**
 * Map a (possibly partial) subscription onto the visual contract the badge expects.
 * Admin accounts force the emerald "ADMIN" look; a premium-named plan with no explicit
 * type still resolves to the premium look.
 */
export function resolvePlanBadge(sub: SubscriptionAdminResponse): { type: ServicePlanType; label: string } {
  const name = String(sub.planName ?? "").toUpperCase();
  const admin = sub.planType === "ADMIN_DEFAULT" || name.includes("ADMIN");
  const premium = sub.planType === "PREMIUM" || name.includes("PREMIUM");

  const type: ServicePlanType = admin
    ? "ADMIN_DEFAULT"
    : premium
      ? "PREMIUM"
      : ((sub.planType as ServicePlanType) ?? "FREE");

  return { type, label: admin ? "ADMIN" : sub.planName || "Gói ẩn" };
}

/** Localised date, or an em-dash when the value is missing. */
export function formatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", opts);
}

/** Localised date + time (used by the activity log). */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("vi-VN");
}
