import type { ServicePlanType } from "../api/admin/adminSubscriptionPlansService";

export type StatusBadge = { bg: string; text: string; border: string; label: string };

export const STATUS_BADGE: Record<string, StatusBadge> = {
  ACTIVE:   { bg: "rgba(34,197,94,0.08)",   text: "#16A34A", border: "rgba(34,197,94,0.15)",   label: "Hoạt động" },
  DISABLE:  { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
  DISABLED: { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
};

export const SUB_TEXTS = {
  NO_SUBSCRIPTION: "Chưa đăng ký gói dịch vụ",
  HIDDEN_PLAN: "Gói ẩn",
};

export function normalizeStatus(status?: string | null): string {
  return String(status || "").toUpperCase().trim();
}

export function normalizePlanType(type?: string | null, nameFallback?: string | null): ServicePlanType {
  let t = String(type || "").toUpperCase().trim();
  
  if (!t || t === "LEARNER_DEFAULT" || t === "FREE" || t === "UNDEFINED" || t === "NULL") {
     const n = String(nameFallback || "").toUpperCase().trim();
     if (n.includes("ADMIN")) t = "ADMIN_DEFAULT";
     else if (
       n.includes("SKILLBUILDER") ||
       n.includes("SKILL_BUILDER") ||
       n.includes("SKILL BUILDER") ||
       n.includes("BASIC")
     ) {
       t = "SKILL_BUILDER";
     }
     else if (n.includes("PREMIUM")) t = "PREMIUM";
  }

  if (t === "ADMIN" || t === "ADMIN_DEFAULT") return "ADMIN_DEFAULT";
  if (
    t === "SKILLBUILDER" ||
    t === "SKILL_BUILDER" ||
    t === "SKILL BUILDER" ||
    t === "BASIC"
  ) {
    return "SKILL_BUILDER";
  }
  if (t === "PREMIUM") return "PREMIUM";
  return "FREE";
}

export function getStatusBadge(status?: string | null): StatusBadge {
  const normalized = normalizeStatus(status);
  return (
    STATUS_BADGE[normalized] ?? {
      bg: "#F3F4F6",
      text: "#6B7280",
      border: "#E5E7EB",
      label: status || "Không rõ",
    }
  );
}

/**
 * Safely parses backend date string and formats it to Vietnamese locale.
 * Returns "—" if parsing fails or if the value is missing.
 */
export function safeFormatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("vi-VN", opts);
}

/**
 * Safely parses backend date string and formats it to Vietnamese locale with time.
 * Returns "—" if parsing fails or if the value is missing.
 */
export function safeFormatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("vi-VN");
}

/**
 * Resolves a subscription record against the active plans array to return
 * the live configurations (badgeColor, badgeIcon, animationType, planName).
 * Performs case-insensitive matching on planId.
 */
export function resolveLivePlan(planId: string | null | undefined, livePlans: any[], planTypeFallback?: string | null, planNameFallback?: string | null) {
  if (!Array.isArray(livePlans) || livePlans.length === 0) return null;
  
  if (planId) {
    const safeTargetId = String(planId).toLowerCase().trim();
    const found = livePlans.find((p) => {
      if (!p || !p.planId) return false;
      return String(p.planId).toLowerCase().trim() === safeTargetId;
    });
    if (found) return found;
  }
  
  const normalizedType = normalizePlanType(planTypeFallback, planNameFallback);
  if (normalizedType !== "FREE") {
     const foundByType = livePlans.find(p => normalizePlanType(p.planType, p.planName) === normalizedType);
     if (foundByType) return foundByType;
  }
  
  return null;
}
