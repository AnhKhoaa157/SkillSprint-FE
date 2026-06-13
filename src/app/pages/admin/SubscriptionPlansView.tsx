import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Crown,
  Database,
  Eye,
  EyeOff,
  HardDrive,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSubscriptionPlan,
  getSubscriptionPlanAuditLogs,
  getSubscriptionPlanDetail,
  getSubscriptionPlans,
  getPlanFeaturesCatalog,
  updatePlanFeatures,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
  formatPlanPrice,
  type AdminAuditLogResponse,
  type BusinessActionType,
  type CreateServicePlanRequest,
  type FeatureCatalogResponse,
  type FeatureToggle,
  type ServicePlanResponse,
  type ServicePlanType,
} from "../../../api/adminSubscriptionPlansService";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#FF6B00";

const PLAN_TYPE_META: Record<ServicePlanType, { label: string; className: string }> = {
  FREE:          { label: "Free",          className: "bg-slate-100 text-slate-600 border-slate-200" },
  SKILL_BUILDER: { label: "Skill Builder", className: "bg-blue-50 text-blue-600 border-blue-200/60" },
  PREMIUM:       { label: "Premium",       className: "bg-orange-50 text-orange-600 border-orange-200/60" },
};

const ACTION_TYPE_LABEL: Record<BusinessActionType, string> = {
  SERVICE_PLAN_CREATED:          "Tạo gói",
  SERVICE_PLAN_UPDATED:          "Cập nhật gói",
  SERVICE_PLAN_STATUS_UPDATED:   "Cập nhật trạng thái",
  SERVICE_PLAN_FEATURES_UPDATED: "Cập nhật tính năng",
};

const ACTION_TYPE_COLOR: Record<BusinessActionType, string> = {
  SERVICE_PLAN_CREATED:          "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  SERVICE_PLAN_UPDATED:          "bg-blue-50 text-blue-700 border-blue-200/60",
  SERVICE_PLAN_STATUS_UPDATED:   "bg-amber-50 text-amber-700 border-amber-200/60",
  SERVICE_PLAN_FEATURES_UPDATED: "bg-purple-50 text-purple-700 border-purple-200/60",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function quota(val: number | null | undefined, unit = "") {
  if (val == null) return "∞";
  return `${val}${unit}`;
}

// ─── Tiny Badge ───────────────────────────────────────────────────────────────

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border ${className || ""}`}>
      {children}
    </span>
  );
}

// ─── Animated Plan-Type Badge ─────────────────────────────────────────────────
// Keyframes + hover rules are injected once (PlanBadgeStyles) near the view root.
// Premium: metallic shimmer (moving gradient) + soft glow pulse.
// Skill Builder: blue gradient with hover scale/glow. Free: clean slate.

const PLAN_BADGE_CSS = `
@keyframes planBadgeShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes planBadgeGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(249,115,22,0.35); }
  50%      { box-shadow: 0 0 16px rgba(249,115,22,0.6); }
}
.plan-badge { transition: transform .3s ease, filter .3s ease, box-shadow .3s ease, background .3s ease; }
.plan-badge-premium:hover { transform: scale(1.06); filter: brightness(1.08) saturate(1.05); }
.plan-badge-builder:hover { transform: scale(1.05); filter: brightness(1.05); box-shadow: 0 4px 14px rgba(79,70,229,0.45); }
.plan-badge-free:hover    { transform: scale(1.03); background: #e2e8f0; }
/* React subtly when hovering the whole row */
.group:hover .plan-badge-premium { transform: scale(1.04); filter: brightness(1.1); }
.group:hover .plan-badge-builder { transform: scale(1.04); box-shadow: 0 4px 14px rgba(79,70,229,0.4); }
.group:hover .plan-badge-free    { background: #e2e8f0; }
@media (prefers-reduced-motion: reduce) {
  .plan-badge-premium { animation: none !important; }
}
`;

function PlanBadgeStyles() {
  return <style>{PLAN_BADGE_CSS}</style>;
}

function PlanTypeBadge({ type }: { type: ServicePlanType }) {
  const label = (PLAN_TYPE_META[type] ?? PLAN_TYPE_META.FREE).label;
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    whiteSpace: "nowrap", lineHeight: 1.3, cursor: "default", userSelect: "none",
  };

  if (type === "PREMIUM") {
    return (
      <span
        className="plan-badge plan-badge-premium"
        style={{
          ...base,
          color: "#fff",
          // golden highlight band sweeps over an amber→orange→gold base
          backgroundImage:
            "linear-gradient(110deg,#f59e0b 0%,#f97316 25%,#fbbf24 42%,#fde68a 50%,#fbbf24 58%,#f97316 75%,#f59e0b 100%)",
          backgroundSize: "200% 100%",
          animation: "planBadgeShimmer 2.8s linear infinite, planBadgeGlow 2.4s ease-in-out infinite",
          textShadow: "0 1px 2px rgba(124,45,18,0.4)",
        }}
      >
        <Crown size={11} fill="currentColor" /> {label}
      </span>
    );
  }

  if (type === "SKILL_BUILDER") {
    return (
      <span
        className="plan-badge plan-badge-builder"
        style={{
          ...base,
          color: "#fff",
          backgroundImage: "linear-gradient(to right,#3b82f6,#4f46e5)",
          boxShadow: "0 2px 8px rgba(59,130,246,0.28)",
        }}
      >
        <Zap size={11} fill="currentColor" /> {label}
      </span>
    );
  }

  // FREE — clean slate with a smooth hover reaction
  return (
    <span
      className="plan-badge plan-badge-free"
      style={{ ...base, color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0" }}
    >
      {label}
    </span>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 bg-transparent border-0 p-0 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {checked
        ? <ToggleRight size={22} className="text-[#FF6B00]" />
        : <ToggleLeft size={22} className="text-slate-400" />}
    </button>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, width = 560, children }: {
  open: boolean; onClose: () => void; title: string; width?: number; children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16,
              boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
              width: "100%", maxWidth: width,
              maxHeight: "90vh", overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{title}</span>
              <button
                onClick={onClose}
                style={{
                  background: "#F1F5F9", border: "none", borderRadius: 8,
                  width: 32, height: 32, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
                }}
              >
                <X size={16} />
              </button>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

// Shared SaaS-style input: rounded-xl with a smooth orange focus ring.
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50";

// ─── Create / Edit Plan Modal ─────────────────────────────────────────────────

type PlanFormData = {
  planName: string;
  description: string;
  benefits: string[];
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

const DEFAULT_FORM: PlanFormData = {
  planName: "", description: "", benefits: [], monthlyPrice: "0", currency: "VND",
  maxWorkspaces: "", maxUploads: "", aiGenerateLimit: "",
  maxFileMb: "", maxWorkspaceMb: "",
  active: true, publicVisible: true, sortOrder: "0",
};

function planToForm(p: ServicePlanResponse): PlanFormData {
  return {
    planName: p.planName,
    description: p.description ?? "",
    benefits: p.benefits ?? [],
    monthlyPrice: String(p.monthlyPrice),
    currency: p.currency ?? "VND",
    maxWorkspaces: p.quotas?.maxWorkspaces != null ? String(p.quotas.maxWorkspaces) : "",
    maxUploads: p.quotas?.maxUploads != null ? String(p.quotas.maxUploads) : "",
    aiGenerateLimit: p.quotas?.aiGenerateLimit != null ? String(p.quotas.aiGenerateLimit) : "",
    maxFileMb: p.quotas?.maxFileMb != null ? String(p.quotas.maxFileMb) : "",
    maxWorkspaceMb: p.quotas?.maxWorkspaceMb != null ? String(p.quotas.maxWorkspaceMb) : "",
    active: p.active,
    publicVisible: p.publicVisible ?? true,
    sortOrder: p.sortOrder != null ? String(p.sortOrder) : "0",
  };
}

function PlanFormModal({
  open, onClose, editPlan, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editPlan: ServicePlanResponse | null;
  onSaved: (plan: ServicePlanResponse) => void;
}) {
  const [form, setForm] = useState<PlanFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editPlan ? planToForm(editPlan) : DEFAULT_FORM);
  }, [editPlan, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (k: keyof PlanFormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const parseOptInt = (s: string): number | undefined =>
    s.trim() === "" ? undefined : parseInt(s, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planName.trim()) { toast.error("Tên gói không được để trống"); return; }
    const price = parseFloat(form.monthlyPrice);
    if (isNaN(price) || price < 0) { toast.error("Giá không hợp lệ"); return; }

    const quotas = {
      maxWorkspaces: parseOptInt(form.maxWorkspaces),
      maxUploads: parseOptInt(form.maxUploads),
      aiGenerateLimit: parseOptInt(form.aiGenerateLimit),
      maxFileMb: parseOptInt(form.maxFileMb),
      maxWorkspaceMb: parseOptInt(form.maxWorkspaceMb),
    };

    setSaving(true);
    try {
      let saved: ServicePlanResponse;
      if (editPlan) {
        saved = await updateSubscriptionPlan(editPlan.planId, {
          planName: form.planName,
          description: form.description || undefined,
          benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
          monthlyPrice: price,
          currency: form.currency,
          ...quotas,
          publicVisible: form.publicVisible,
          sortOrder: parseInt(form.sortOrder || "0", 10),
        });
        toast.success("Đã cập nhật gói dịch vụ");
      } else {
        saved = await createSubscriptionPlan({
          planName: form.planName,
          description: form.description || undefined,
          benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
          monthlyPrice: price,
          currency: form.currency,
          ...quotas,
          active: form.active,
          publicVisible: form.publicVisible,
          sortOrder: parseInt(form.sortOrder || "0", 10),
        });
        toast.success("Đã tạo gói dịch vụ mới");
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

              {/* ── Sticky Header ── */}
              <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Layers size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {editPlan ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editPlan ? "Cập nhật thông tin, giá và quyền lợi của gói" : "Thiết lập thông tin, giá và quyền lợi cho gói mới"}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose}
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                  <X size={18} />
                </button>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                {/* Basic info + Pricing */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Field label="Tên gói" required>
                        <input className={inputCls} value={form.planName} onChange={(e) => set("planName", e.target.value)} placeholder="Vd: Premium Plan" />
                      </Field>
                    </div>
                    <Field label="Thứ tự" hint="Số nhỏ hiển thị trước">
                      <input className={inputCls} type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} min={0} />
                    </Field>
                  </div>

                  <Field label="Mô tả">
                    <textarea
                      className={`${inputCls} min-h-[76px] resize-y`}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Mô tả ngắn về gói..."
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Giá hàng tháng" required hint="Nhập 0 cho gói miễn phí">
                      <input className={inputCls} type="number" value={form.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} min={0} />
                    </Field>
                    <Field label="Đơn vị tiền tệ">
                      <select className={inputCls} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                        <option value="VND">VND</option>
                        <option value="USD">USD</option>
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Quyền lợi gói</label>
                      <p className="text-xs text-slate-400 mt-0.5">Hiển thị cho người dùng trên trang giá</p>
                    </div>
                    <button type="button"
                      onClick={() => setForm((f) => ({ ...f, benefits: [...f.benefits, ""] }))}
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 active:scale-[0.98] transition">
                      <Plus size={14} /> Thêm quyền lợi
                    </button>
                  </div>

                  {form.benefits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
                      Chưa có quyền lợi nào.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {form.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 pl-3 pr-1.5 py-1.5 focus-within:border-orange-300 focus-within:bg-white transition">
                          <span className="w-5 shrink-0 text-xs font-bold text-slate-300 text-center">{i + 1}</span>
                          <input
                            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 py-1"
                            value={b}
                            placeholder="Nhập quyền lợi..."
                            onChange={(e) => setForm((f) => { const next = [...f.benefits]; next[i] = e.target.value; return { ...f, benefits: next }; })}
                          />
                          <button type="button" title="Xóa quyền lợi"
                            onClick={() => setForm((f) => ({ ...f, benefits: f.benefits.filter((_, j) => j !== i) }))}
                            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Usage limits — clean card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <ShieldAlert size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 leading-tight">Giới hạn sử dụng</h4>
                      <p className="text-[11px] text-slate-400">Để trống = không giới hạn</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Số Workspace tối đa">
                      <input className={inputCls} type="number" min={0} value={form.maxWorkspaces} onChange={(e) => set("maxWorkspaces", e.target.value)} placeholder="∞ Không giới hạn" />
                    </Field>
                    <Field label="Số file upload tối đa">
                      <input className={inputCls} type="number" min={0} value={form.maxUploads} onChange={(e) => set("maxUploads", e.target.value)} placeholder="∞ Không giới hạn" />
                    </Field>
                    <Field label="Lượt tạo AI">
                      <input className={inputCls} type="number" min={0} value={form.aiGenerateLimit} onChange={(e) => set("aiGenerateLimit", e.target.value)} placeholder="∞ Không giới hạn" />
                    </Field>
                    <Field label="Kích thước file (MB)">
                      <input className={inputCls} type="number" min={0} value={form.maxFileMb} onChange={(e) => set("maxFileMb", e.target.value)} placeholder="∞ Không giới hạn" />
                    </Field>
                    <Field label="Dung lượng workspace (MB)">
                      <input className={inputCls} type="number" min={0} value={form.maxWorkspaceMb} onChange={(e) => set("maxWorkspaceMb", e.target.value)} placeholder="∞ Không giới hạn" />
                    </Field>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-orange-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Kích hoạt gói</div>
                      <div className="text-[11px] text-slate-400">Cho phép người dùng đăng ký</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" checked={form.publicVisible} onChange={(e) => set("publicVisible", e.target.checked)} className="w-4 h-4 accent-orange-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Hiển thị công khai</div>
                      <div className="text-[11px] text-slate-400">Xuất hiện trên trang giá</div>
                    </div>
                  </label>
                </div>

              </div>

              {/* ── Sticky Footer ── */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                <button type="button" onClick={onClose} disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? "Đang lưu..." : editPlan ? "Cập nhật" : "Tạo gói dịch vụ"}
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Status Modal ─────────────────────────────────────────────────────────────

function StatusModal({
  open, onClose, plan, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  plan: ServicePlanResponse | null;
  onSaved: (plan: ServicePlanResponse) => void;
}) {
  const [active, setActive] = useState(true);
  const [publicVisible, setPublicVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setActive(plan.active);
      setPublicVisible(plan.publicVisible ?? true);
    }
  }, [plan, open]);

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      const saved = await updateSubscriptionPlanStatus(plan.planId, { active, publicVisible });
      toast.success("Đã cập nhật trạng thái gói");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cập nhật trạng thái" width={420}>
      <div style={{ padding: "20px 24px 0" }}>
        {plan && (
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 20, border: "1px solid #E2E8F0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{plan.planName}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              {formatPlanPrice(plan.monthlyPrice, plan.currency)}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>Kích hoạt gói</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Người dùng có thể đăng ký gói này</div>
            </div>
            <ToggleSwitch checked={active} onChange={setActive} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>Hiển thị công khai</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Gói xuất hiện trên trang giá cả</div>
            </div>
            <ToggleSwitch checked={publicVisible} onChange={setPublicVisible} />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} disabled={saving}
          style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 600 }}>
          Hủy
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Features Modal ───────────────────────────────────────────────────────────

function FeaturesModal({
  open, onClose, plan, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  plan: ServicePlanResponse | null;
  onSaved: (plan: ServicePlanResponse) => void;
}) {
  const [catalog, setCatalog] = useState<FeatureCatalogResponse[]>([]);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !plan) return;
    setLoading(true);
    getPlanFeaturesCatalog()
      .then((features) => {
        setCatalog(features);
        const initial: Record<string, boolean> = {};
        features.forEach((f) => {
          const planFeature = plan.features.find((pf) => pf.featureKey === f.featureKey);
          initial[f.featureKey] = planFeature?.enabled ?? false;
        });
        setToggles(initial);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, plan]);

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      const features: FeatureToggle[] = Object.entries(toggles).map(([featureKey, enabled]) => ({ featureKey, enabled }));
      const saved = await updatePlanFeatures(plan.planId, { features });
      toast.success("Đã cập nhật tính năng gói");
      // Features is the ONLY place toggles are persisted. Merge the response
      // onto the current plan so any field the features endpoint may omit
      // (benefits, quotas, pricing…) is preserved and never becomes undefined.
      onSaved({ ...plan, ...saved });
      onClose();
    } catch (err) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  const enabledCount = Object.values(toggles).filter(Boolean).length;

  return (
    <Modal open={open} onClose={onClose} title="Quản lý tính năng" width={520}>
      <div style={{ padding: "16px 24px 0" }}>
        {plan && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 16, border: "1px solid #E2E8F0" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{plan.planName}</div>
            <Badge className="bg-orange-50 text-orange-600 border-orange-200/60">
              {enabledCount}/{catalog.length} tính năng
            </Badge>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 14 }}>
            Đang tải danh sách tính năng...
          </div>
        ) : catalog.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 14 }}>
            Không có tính năng nào trong hệ thống
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 4 }}>
            {catalog.map((f) => (
              <div key={f.featureKey} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: toggles[f.featureKey] ? "rgba(255,107,0,0.04)" : "#F8FAFC",
                borderRadius: 10, border: `1px solid ${toggles[f.featureKey] ? "rgba(255,107,0,0.2)" : "#E2E8F0"}`,
                transition: "all 0.15s",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                    {f.featureName}
                    {!f.active && (
                      <Badge className="bg-slate-100 text-slate-400 border-slate-200">Tắt</Badge>
                    )}
                  </div>
                  {f.description && (
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.description}
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "#CBD5E1", marginTop: 2 }}>
                    {f.featureKey}
                  </div>
                </div>
                <ToggleSwitch
                  checked={toggles[f.featureKey] ?? false}
                  onChange={(v) => setToggles((t) => ({ ...t, [f.featureKey]: v }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #F1F5F9", marginTop: 16 }}>
        <button onClick={onClose} disabled={saving}
          style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 600 }}>
          Hủy
        </button>
        <button onClick={handleSave} disabled={saving || loading}
          style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", cursor: (saving || loading) ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: (saving || loading) ? 0.7 : 1 }}>
          {saving ? "Đang lưu..." : "Lưu tính năng"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Plan Detail Modal ────────────────────────────────────────────────────────

// Premium banner gradient per plan type (Free: slate, Skill Builder: blue, Premium: orange)
const PLAN_BANNER: Record<ServicePlanType, { gradient: string; label: string }> = {
  FREE:          { gradient: "linear-gradient(135deg,#64748B,#475569)", label: "Free" },
  SKILL_BUILDER: { gradient: "linear-gradient(135deg,#3B82F6,#2563EB)", label: "Skill Builder" },
  PREMIUM:       { gradient: "linear-gradient(135deg,#FF8A3D,#FF6B00)", label: "Premium" },
};

function PlanDetailModal({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: ServicePlanResponse | null }) {
  if (!plan) return null;

  const banner = PLAN_BANNER[plan.planType ?? "FREE"] ?? PLAN_BANNER.FREE;
  const benefits = plan.benefits ?? [];
  const enabledCount = plan.features.filter((f) => f.enabled).length;
  const q = plan.quotas;
  const quotaItems = q
    ? [
        { label: "Workspaces", value: quota(q.maxWorkspaces), Icon: Layers },
        { label: "File upload", value: quota(q.maxUploads), Icon: Upload },
        { label: "Lượt AI", value: quota(q.aiGenerateLimit), Icon: Sparkles },
        { label: "Kích thước file", value: quota(q.maxFileMb, " MB"), Icon: HardDrive },
        { label: "Dung lượng WS", value: quota(q.maxWorkspaceMb, " MB"), Icon: Database },
      ]
    : [];

  const pill: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
    borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.22)", color: "#fff",
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10,
  };

  return (
    <Modal open={open} onClose={onClose} title="Chi tiết gói dịch vụ" width={880}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ padding: "20px 24px" }}>

        {/* ── Left: General info & Quotas ── */}
        <div>
          {/* Premium banner header */}
          <div style={{ borderRadius: 14, padding: "18px 20px", background: banner.gradient, color: "#fff", marginBottom: 16, boxShadow: "0 10px 30px rgba(15,23,42,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>{banner.label}</span>
              <span style={pill}>{plan.active ? <><BadgeCheck size={12} /> Hoạt động</> : "Vô hiệu"}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10, lineHeight: 1.2 }}>{plan.planName}</div>
            {plan.description && <div style={{ fontSize: 13, opacity: 0.92, marginTop: 6, lineHeight: 1.5 }}>{plan.description}</div>}
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 14, letterSpacing: "-0.02em" }}>
              {formatPlanPrice(plan.monthlyPrice, plan.currency)}
              {plan.monthlyPrice > 0 && <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}> /tháng</span>}
            </div>
          </div>

          {/* Meta badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {plan.publicVisible
              ? <Badge className="bg-blue-50 text-blue-700 border-blue-200/60"><Eye size={12} /> Công khai</Badge>
              : <Badge className="bg-slate-100 text-slate-400 border-slate-200"><EyeOff size={12} /> Ẩn</Badge>}
            <Badge className="bg-slate-100 text-slate-500 border-slate-200">Thứ tự #{plan.sortOrder ?? "—"}</Badge>
          </div>

          {/* Quotas */}
          {quotaItems.length > 0 && (
            <>
              <div style={sectionLabel}>Giới hạn sử dụng</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {quotaItems.map(({ label, value, Icon }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} className="text-slate-500" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Right: Benefits & Features ── */}
        <div>
          {/* Quyền lợi gói — orange checks, matching PricingModal */}
          <div style={sectionLabel}>Quyền lợi gói</div>
          {benefits.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", marginBottom: 18 }}>Chưa có quyền lợi nào</div>
          ) : (
            <ul style={{ listStyle: "none", margin: "0 0 18px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                  <Check size={16} color={ACCENT} strokeWidth={2.5} className="flex-shrink-0" style={{ marginTop: 2 }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ borderTop: "1px solid #E2E8F0", marginBottom: 16 }} />

          {/* Tính năng chi tiết — green checks */}
          <div style={sectionLabel}>Tính năng chi tiết ({enabledCount}/{plan.features.length})</div>
          {plan.features.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>Chưa có tính năng nào</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.features.map((f) => (
                <li key={f.featureKey} className="flex items-start gap-2" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {f.enabled
                    ? <Check size={16} strokeWidth={2.5} className="text-emerald-600 flex-shrink-0" style={{ marginTop: 2 }} />
                    : <X size={16} className="text-slate-300 flex-shrink-0" style={{ marginTop: 2 }} />}
                  <span style={{ color: f.enabled ? "#0F172A" : "#9CA3AF", textDecoration: f.enabled ? undefined : "line-through" }}>{f.featureName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </Modal>
  );
}

// ─── Audit Log Row ────────────────────────────────────────────────────────────

function AuditLogRow({ log, expanded, onToggle }: { log: AdminAuditLogResponse; expanded: boolean; onToggle: () => void }) {
  const actionMeta = ACTION_TYPE_COLOR[log.actionType] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const hasDetails = log.description || log.oldValue || log.newValue || log.metadata;

  return (
    <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
      <div
        onClick={hasDetails ? onToggle : undefined}
        className={`grid grid-cols-[1.6fr_1.2fr_1.6fr_1fr_auto] gap-3 items-center px-4 py-3 ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        } ${expanded ? "bg-slate-50/75" : "bg-white"} hover:bg-slate-50/40 transition-colors`}
      >
        <div className="text-xs text-slate-900">
          <div className="font-bold">{log.adminEmail}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{formatDate(log.createdAt)}</div>
        </div>
        <div>
          <Badge className={actionMeta}>
            {ACTION_TYPE_LABEL[log.actionType] ?? log.actionType}
          </Badge>
        </div>
        <div className="text-xs text-slate-900 font-bold truncate">{log.title}</div>
        <div className="text-[11px] font-mono text-slate-400 truncate">
          {log.entityId.slice(0, 8)}…
        </div>
        {hasDetails && (
          <div className="text-slate-400">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {expanded && hasDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-3.5 pt-2 flex flex-col gap-2 border-t border-slate-100 bg-slate-50/30"
        >
          {log.description && (
            <div className="text-xs text-slate-700 leading-relaxed">{log.description}</div>
          )}
          {(log.oldValue || log.newValue) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {log.oldValue && (
                <div className="p-2.5 bg-red-50/50 border border-red-200/40 rounded-lg">
                  <div className="text-[9px] font-bold text-red-700 mb-1.5 uppercase tracking-wider">Trước</div>
                  <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap break-all leading-normal">{log.oldValue}</pre>
                </div>
              )}
              {log.newValue && (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/40 rounded-lg">
                  <div className="text-[9px] font-bold text-emerald-700 mb-1.5 uppercase tracking-wider">Sau</div>
                  <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap break-all leading-normal">{log.newValue}</pre>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function SubscriptionPlansView() {
  const [tab, setTab] = useState<"plans" | "audit">("plans");
  const [plans, setPlans] = useState<ServicePlanResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [detailPlan, setDetailPlan] = useState<ServicePlanResponse | null>(null);
  const [editPlan, setEditPlan] = useState<ServicePlanResponse | null>(null);
  const [statusPlan, setStatusPlan] = useState<ServicePlanResponse | null>(null);
  const [featuresPlan, setFeaturesPlan] = useState<ServicePlanResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const auditLoadedRef = useRef(false);

  async function loadPlans() {
    setLoadingPlans(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách gói");
    } finally {
      setLoadingPlans(false);
    }
  }

  async function loadAuditLogs() {
    setLoadingAudit(true);
    try {
      const data = await getSubscriptionPlanAuditLogs();
      setAuditLogs(data);
      auditLoadedRef.current = true;
    } catch (err) {
      toast.error((err as Error).message || "Không tải được nhật ký");
    } finally {
      setLoadingAudit(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  useEffect(() => {
    if (tab === "audit" && !auditLoadedRef.current) loadAuditLogs();
  }, [tab]);

  function handlePlanSaved(saved: ServicePlanResponse) {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.planId === saved.planId);
      if (idx >= 0) {
        const updated = [...prev];
        // Merge over the existing entry rather than replacing it: status- and
        // features-update callers may return a partial plan, so we keep the
        // prior fields instead of dropping them (avoids undefined render errors).
        updated[idx] = { ...updated[idx], ...saved };
        return updated;
      }
      return [...prev, saved];
    });
    auditLoadedRef.current = false;
  }

  function openDetail(plan: ServicePlanResponse) {
    getSubscriptionPlanDetail(plan.planId)
      .then((detail) => { setDetailPlan(detail); setShowDetailModal(true); })
      .catch((err) => toast.error(err.message));
  }

  function openEdit(plan: ServicePlanResponse) {
    setEditPlan(plan);
    setShowEditModal(true);
  }

  function openStatus(plan: ServicePlanResponse) {
    setStatusPlan(plan);
    setShowStatusModal(true);
  }

  function openFeatures(plan: ServicePlanResponse) {
    setFeaturesPlan(plan);
    setShowFeaturesModal(true);
  }

  const tabs = [
    { id: "plans" as const, label: "Gói dịch vụ", icon: Layers },
    { id: "audit" as const, label: "Nhật ký thay đổi", icon: ClipboardList },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <PlanBadgeStyles />

      {/* ── Header ── */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Layers size={20} className="text-[#FF6B00]" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-slate-900 leading-none">Quản lý gói dịch vụ</h1>
                <p className="text-xs text-slate-500 mt-1">Cấu hình các gói subscription · {plans.length} gói hiện có</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={loadPlans} disabled={loadingPlans}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700 disabled:opacity-50">
              <RefreshCw size={14} className={loadingPlans ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-0 bg-[#FF6B00] hover:bg-[#e05e00] transition-colors text-white cursor-pointer text-xs font-bold shadow-sm">
              <Plus size={16} />
              Tạo gói mới
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: "Tổng số gói",    value: plans.length,                                Icon: Layers,     iconBg: "bg-slate-100",   iconColor: "text-slate-600",  valueClass: "text-slate-900" },
          { label: "Đang hoạt động", value: plans.filter((p) => p.active).length,        Icon: BadgeCheck, iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", valueClass: "text-emerald-700" },
          { label: "Đang ẩn",        value: plans.filter((p) => !p.active).length,       Icon: EyeOff,     iconBg: "bg-slate-100",   iconColor: "text-slate-500",  valueClass: "text-slate-500" },
          { label: "Công khai",      value: plans.filter((p) => p.publicVisible).length, Icon: Eye,        iconBg: "bg-blue-50",     iconColor: "text-blue-600",   valueClass: "text-blue-600" },
        ].map(({ label, value, Icon, iconBg, iconColor, valueClass }) => (
          <div key={label} className="flex items-center gap-3.5 p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-shadow">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</div>
              <div className={`text-2xl font-extrabold leading-tight ${valueClass}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border-none cursor-pointer text-xs font-bold transition-all ${
              tab === id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ── */}
      {tab === "plans" && (
        <div className="flex flex-col gap-3">
          {loadingPlans ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Đang tải danh sách gói...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              Chưa có gói dịch vụ nào.&nbsp;
              <button onClick={() => setShowCreateModal(true)} className="bg-transparent border-none cursor-pointer text-[#FF6B00] font-bold hover:underline">
                Tạo gói đầu tiên
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-[22%]">Tên gói</th>
                    <th className="py-3.5 px-4 w-[10%]">Loại</th>
                    <th className="py-3.5 px-4 w-[12%]">Giá</th>
                    <th className="py-3.5 px-4 w-[12%]">Trạng thái</th>
                    <th className="py-3.5 px-4 w-[11%]">Hiển thị</th>
                    <th className="py-3.5 px-4 w-[11%]">Tính năng</th>
                    <th className="py-3.5 px-4 w-[10%]">Quyền lợi</th>
                    <th className="py-3.5 px-4 w-[12%] text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans
                    .slice()
                    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
                    .map((plan) => {
                      const enabledFeatures = plan.features.filter((f) => f.enabled).length;
                      const benefitsCount = (plan.benefits ?? []).length;
                      return (
                        <motion.tr
                          key={plan.planId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* Tên gói */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-[15px] truncate">{plan.planName}</span>
                              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold leading-none">
                                #{plan.sortOrder ?? "—"}
                              </span>
                            </div>
                            {plan.description && (
                              <div className="text-xs text-slate-400 mt-1 max-w-[240px] truncate" title={plan.description}>
                                {plan.description}
                              </div>
                            )}
                          </td>

                          {/* Loại */}
                          <td className="py-4 px-4 align-middle">
                            <PlanTypeBadge type={plan.planType ?? "FREE"} />
                          </td>

                          {/* Giá */}
                          <td className="py-4 px-4 align-middle">
                            {plan.monthlyPrice <= 0 ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold">Miễn phí</Badge>
                            ) : (
                              <span className="font-bold text-slate-900 text-sm">
                                {formatPlanPrice(plan.monthlyPrice, plan.currency)}
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              {plan.active ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-sm font-semibold text-emerald-700">Hoạt động</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  <span className="text-sm font-medium text-slate-400">Vô hiệu</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Hiển thị */}
                          <td className="py-4 px-4 align-middle">
                            {plan.publicVisible ? (
                              <Badge className="bg-blue-50 text-blue-600 border-blue-200/60 font-semibold flex items-center gap-1">
                                <Eye size={12} /> Công khai
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-400 border-slate-200 font-semibold flex items-center gap-1">
                                <EyeOff size={12} /> Ẩn
                              </Badge>
                            )}
                          </td>

                          {/* Tính năng */}
                          <td className="py-4 px-4 align-middle">
                            <div className="text-sm text-slate-700 font-semibold">
                              {enabledFeatures}/{plan.features.length}
                              <span className="text-slate-400 font-normal text-xs"> tính năng</span>
                            </div>
                          </td>

                          {/* Quyền lợi */}
                          <td className="py-4 px-4 align-middle">
                            {benefitsCount > 0 ? (
                              <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200/60 font-semibold">
                                {benefitsCount} quyền lợi
                              </Badge>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Hành động */}
                          <td className="py-4 px-4 align-middle text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <ActionBtn
                                icon={<Shield size={14} />}
                                title="Chi tiết"
                                onClick={() => openDetail(plan)}
                                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              />
                              <ActionBtn
                                icon={<Pencil size={14} />}
                                title="Chỉnh sửa"
                                onClick={() => openEdit(plan)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              />
                              <ActionBtn
                                icon={<ToggleRight size={14} />}
                                title="Trạng thái"
                                onClick={() => openStatus(plan)}
                                className={
                                  plan.active
                                    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-400 hover:text-slate-500 hover:bg-slate-100"
                                }
                              />
                              <ActionBtn
                                icon={<Settings2 size={14} />}
                                title="Tính năng"
                                onClick={() => openFeatures(plan)}
                                className="text-[#FF6B00] hover:text-[#e05e00] hover:bg-orange-50"
                              />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === "audit" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button onClick={() => { auditLoadedRef.current = false; loadAuditLogs(); }} disabled={loadingAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700 disabled:opacity-50">
              <RefreshCw size={13} className={loadingAudit ? "animate-spin" : ""} />
              Làm mới nhật ký
            </button>
          </div>

          {loadingAudit ? (
            <div className="text-center py-16 text-slate-400 text-sm">Đang tải nhật ký...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              Chưa có nhật ký nào
            </div>
          ) : (
            <>
              {/* Audit header */}
              <div className="grid grid-cols-[1.6fr_1.2fr_1.6fr_1fr_auto] gap-3 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Admin</span>
                <span>Hành động</span>
                <span>Nội dung</span>
                <span>Entity ID</span>
                <span className="w-4" />
              </div>

              <div className="flex flex-col gap-2">
                {auditLogs.map((log) => (
                  <AuditLogRow
                    key={log.logId}
                    log={log}
                    expanded={expandedLogId === log.logId}
                    onToggle={() => setExpandedLogId((id) => (id === log.logId ? null : log.logId))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <PlanFormModal
        open={showCreateModal || showEditModal}
        onClose={() => { setShowCreateModal(false); setShowEditModal(false); setEditPlan(null); }}
        editPlan={showEditModal ? editPlan : null}
        onSaved={handlePlanSaved}
      />
      <PlanDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        plan={detailPlan}
      />
      <StatusModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        plan={statusPlan}
        onSaved={handlePlanSaved}
      />
      <FeaturesModal
        open={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        plan={featuresPlan}
        onSaved={handlePlanSaved}
      />
    </motion.div>
  );
}

// ─── Tiny action button ───────────────────────────────────────────────────────

function ActionBtn({
  icon,
  title,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-9 h-9 rounded-full border border-slate-200/70 bg-white shadow-sm hover:shadow cursor-pointer transition-all duration-150 ${className || ""}`}
    >
      {icon}
    </button>
  );
}

export default SubscriptionPlansView;
