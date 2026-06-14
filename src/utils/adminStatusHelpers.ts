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

export function getStatusBadge(status?: string | null): StatusBadge {
  const normalized = String(status || "").toUpperCase();
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
export function resolveLivePlan(planId: string | null | undefined, livePlans: any[]) {
  if (!planId || !Array.isArray(livePlans) || livePlans.length === 0) return null;
  
  const safeTargetId = String(planId).toLowerCase().trim();
  
  return livePlans.find((p) => {
    if (!p || !p.planId) return false;
    return String(p.planId).toLowerCase().trim() === safeTargetId;
  }) || null;
}
