import {
  BadgeCheck, Database, Eye, EyeOff, HardDrive, Layers, Sparkles, Upload,
  type LucideIcon,
} from "lucide-react";
import type {
  BusinessActionType,
  ServicePlanResponse,
  ServicePlanType,
} from "../../../../api/adminSubscriptionPlansService";

/* -------------------------------------------------------------------------- */
/*  Design tokens & hard limits.                                              */
/* -------------------------------------------------------------------------- */

export const ACCENT = "#FF6B00";
export const MAX_PRICE_VND = 999_999_999;
export const MAX_INT_JAVA = 2_000_000_000; // Java int column ceiling for quotas.

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50";

/* -------------------------------------------------------------------------- */
/*  Static option matrices (add a tier / preset by editing data, not JSX).    */
/* -------------------------------------------------------------------------- */

export const PLAN_TYPE_OPTIONS: { value: ServicePlanType; label: string }[] = [
  { value: "FREE", label: "Free" },
  { value: "SKILL_BUILDER", label: "Skill Builder" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ADMIN_DEFAULT", label: "Admin" },
];

export const BADGE_GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: "Royal", value: "from-pink-500 via-purple-500 to-indigo-600 text-white shadow-purple-500/30" },
  { label: "Golden", value: "from-amber-400 via-orange-500 to-amber-500 text-white shadow-orange-500/30" },
  { label: "Ocean", value: "from-sky-500 to-blue-600 text-white shadow-blue-500/30" },
  { label: "Emerald", value: "from-emerald-500 to-teal-600 text-white shadow-emerald-500/30" },
  { label: "Crimson", value: "from-rose-500 to-red-600 text-white shadow-red-500/30" },
  { label: "Slate", value: "from-slate-200 to-slate-300 text-slate-700 shadow-slate-300/30" },
];

export const BADGE_ICON_OPTIONS = ["Crown", "Zap", "Flame", "Sparkles", "ShieldAlert", "Star", "Rocket", "Gem", "Award", "BadgeCheck"];

export const BADGE_ANIMATIONS: { value: string; label: string }[] = [
  { value: "none", label: "Không" },
  { value: "shimmer", label: "Shimmer" },
  { value: "pulse", label: "Pulse" },
];

export const ACTION_TYPE_LABEL: Record<BusinessActionType, string> = {
  SERVICE_PLAN_CREATED: "Tạo gói",
  SERVICE_PLAN_UPDATED: "Cập nhật gói",
  SERVICE_PLAN_STATUS_UPDATED: "Cập nhật trạng thái",
  SERVICE_PLAN_FEATURES_UPDATED: "Cập nhật tính năng",
};

export const ACTION_TYPE_COLOR: Record<BusinessActionType, string> = {
  SERVICE_PLAN_CREATED: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  SERVICE_PLAN_UPDATED: "bg-blue-50 text-blue-700 border-blue-200/60",
  SERVICE_PLAN_STATUS_UPDATED: "bg-amber-50 text-amber-700 border-amber-200/60",
  SERVICE_PLAN_FEATURES_UPDATED: "bg-purple-50 text-purple-700 border-purple-200/60",
};

export const PLAN_BANNER: Record<ServicePlanType, { gradient: string; label: string }> = {
  FREE: { gradient: "linear-gradient(135deg,#64748B,#475569)", label: "Free" },
  SKILL_BUILDER: { gradient: "linear-gradient(135deg,#3B82F6,#2563EB)", label: "Skill Builder" },
  PREMIUM: { gradient: "linear-gradient(135deg,#FF8A3D,#FF6B00)", label: "Premium" },
  ADMIN_DEFAULT: { gradient: "linear-gradient(135deg,#a855f7,#6366f1)", label: "Admin" },
};

export type BtnType = "detail" | "edit" | "status-active" | "status-inactive" | "features";

export const BTN_THEMES: Record<BtnType, { text: string; bg: string; border: string }> = {
  detail: { text: "text-slate-600", bg: "bg-slate-500/10", border: "border-slate-200" },
  edit: { text: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-200" },
  "status-active": { text: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-200" },
  "status-inactive": { text: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-200" },
  features: { text: "text-[#FF6B00]", bg: "bg-orange-500/10", border: "border-orange-200" },
};

/**
 * Quota fields, shared by the create/edit form. `max`/`errorMsg` opt a field into
 * inline overflow validation. Add a quota here and it renders in the form + payload.
 */
export const QUOTA_FORM_FIELDS: {
  key: keyof PlanFormData;
  label: string;
  max?: number;
  errorMsg?: string;
}[] = [
  { key: "maxWorkspaces", label: "Số Workspace tối đa" },
  { key: "maxUploads", label: "Số file upload tối đa" },
  { key: "aiGenerateLimit", label: "Lượt tạo AI", max: MAX_INT_JAVA, errorMsg: "⚠️ Số lượt vượt quá giới hạn lưu trữ hệ thống (Tối đa 2 tỷ)" },
  { key: "maxFileMb", label: "Kích thước file (MB)" },
  { key: "maxWorkspaceMb", label: "Dung lượng workspace (MB)" },
];

/** Quota rows for the read-only detail modal. */
export const QUOTA_DETAIL_FIELDS: {
  label: string;
  pick: (q: NonNullable<ServicePlanResponse["quotas"]>) => string;
  Icon: LucideIcon;
}[] = [
  { label: "Workspaces", pick: (q) => quota(q.maxWorkspaces), Icon: Layers },
  { label: "File upload", pick: (q) => quota(q.maxUploads), Icon: Upload },
  { label: "Lượt AI", pick: (q) => quota(q.aiGenerateLimit), Icon: Sparkles },
  { label: "Kích thước file", pick: (q) => quota(q.maxFileMb, " MB"), Icon: HardDrive },
  { label: "Dung lượng WS", pick: (q) => quota(q.maxWorkspaceMb, " MB"), Icon: Database },
];

/** Header summary cards, derived from the current plan list. */
export function getStatCards(plans: ServicePlanResponse[]) {
  return [
    { label: "Tổng số gói", value: plans.length, Icon: Layers, iconBg: "bg-slate-100", iconColor: "text-slate-600", valueClass: "text-slate-900" },
    { label: "Đang hoạt động", value: plans.filter((p) => p.active).length, Icon: BadgeCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueClass: "text-emerald-700" },
    { label: "Đang ẩn", value: plans.filter((p) => !p.active).length, Icon: EyeOff, iconBg: "bg-slate-100", iconColor: "text-slate-500", valueClass: "text-slate-500" },
    { label: "Công khai", value: plans.filter((p) => p.publicVisible).length, Icon: Eye, iconBg: "bg-blue-50", iconColor: "text-blue-600", valueClass: "text-blue-600" },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Formatting helpers.                                                       */
/* -------------------------------------------------------------------------- */

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/** Render a quota value, treating null/undefined as "unlimited" (∞). */
export function quota(val: number | null | undefined, unit = "") {
  if (val == null) return "∞";
  return `${val}${unit}`;
}

/* -------------------------------------------------------------------------- */
/*  Form model + (de-duplicated) payload building.                           */
/* -------------------------------------------------------------------------- */

export type PlanFormData = {
  planName: string;
  description: string;
  benefits: string[];
  planType: ServicePlanType;
  badgeColor: string;
  badgeIcon: string;
  animationType: string;
  monthlyPrice: string;
  currency: string;
  maxWorkspaces: string;
  maxUploads: string;
  aiGenerateLimit: string;
  maxFileMb: string;
  maxWorkspaceMb: string;
  active: boolean;
  publicVisible: boolean;
  sortOrder: string;
};

export const DEFAULT_FORM: PlanFormData = {
  planName: "", description: "", benefits: [], planType: "FREE",
  badgeColor: "", badgeIcon: "", animationType: "none",
  monthlyPrice: "0", currency: "VND",
  maxWorkspaces: "", maxUploads: "", aiGenerateLimit: "",
  maxFileMb: "", maxWorkspaceMb: "",
  active: true, publicVisible: true, sortOrder: "0",
};

export function planToForm(p: ServicePlanResponse): PlanFormData {
  const str = (v: number | null | undefined) => (v != null ? String(v) : "");
  return {
    planName: p.planName,
    description: p.description ?? "",
    benefits: p.benefits ?? [],
    planType: p.planType ?? "FREE",
    badgeColor: p.badgeColor ?? "",
    badgeIcon: p.badgeIcon ?? "",
    animationType: p.animationType ?? "none",
    monthlyPrice: String(p.monthlyPrice),
    currency: p.currency ?? "VND",
    maxWorkspaces: str(p.quotas?.maxWorkspaces),
    maxUploads: str(p.quotas?.maxUploads),
    aiGenerateLimit: str(p.quotas?.aiGenerateLimit),
    maxFileMb: str(p.quotas?.maxFileMb),
    maxWorkspaceMb: str(p.quotas?.maxWorkspaceMb),
    active: p.active,
    publicVisible: p.publicVisible ?? true,
    sortOrder: str(p.sortOrder),
  };
}

export const parseOptInt = (s: string): number | undefined =>
  s.trim() === "" ? undefined : parseInt(s, 10);

/** Shared payload for both create and update (create layers `active` on top). */
export function buildPlanPayload(form: PlanFormData, price: number) {
  return {
    planName: form.planName,
    description: form.description || undefined,
    benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
    planType: form.planType,
    badgeColor: form.badgeColor || undefined,
    badgeIcon: form.badgeIcon || undefined,
    animationType: form.animationType || undefined,
    monthlyPrice: price,
    currency: form.currency,
    maxWorkspaces: parseOptInt(form.maxWorkspaces),
    maxUploads: parseOptInt(form.maxUploads),
    aiGenerateLimit: parseOptInt(form.aiGenerateLimit),
    maxFileMb: parseOptInt(form.maxFileMb),
    maxWorkspaceMb: parseOptInt(form.maxWorkspaceMb),
    publicVisible: form.publicVisible,
    sortOrder: parseInt(form.sortOrder || "0", 10),
  };
}
