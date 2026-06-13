import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  ToggleLeft,
  ToggleRight,
  X,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}{required && <span style={{ color: ACCENT, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0",
  borderRadius: 8, fontSize: 14, color: "#0F172A", outline: "none",
  background: "#FAFAFA", boxSizing: "border-box",
};

// ─── Create / Edit Plan Modal ─────────────────────────────────────────────────

type PlanFormData = {
  planName: string;
  description: string;
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
  planName: "", description: "", monthlyPrice: "0", currency: "VND",
  maxWorkspaces: "", maxUploads: "", aiGenerateLimit: "",
  maxFileMb: "", maxWorkspaceMb: "",
  active: true, publicVisible: true, sortOrder: "0",
};

function planToForm(p: ServicePlanResponse): PlanFormData {
  return {
    planName: p.planName,
    description: p.description ?? "",
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
    <Modal open={open} onClose={onClose} title={editPlan ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"} width={620}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Basic Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tên gói" required>
              <input style={inputStyle} value={form.planName} onChange={(e) => set("planName", e.target.value)} placeholder="Vd: Premium Plan" />
            </Field>
            <Field label="Thứ tự hiển thị" hint="Số nhỏ hơn hiển thị trước">
              <input style={inputStyle} type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} min={0} />
            </Field>
          </div>

          <Field label="Mô tả">
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72, fontFamily: "inherit" }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn về gói..."
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Giá hàng tháng" required hint="Nhập 0 cho gói miễn phí">
              <input style={inputStyle} type="number" value={form.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} min={0} />
            </Field>
            <Field label="Đơn vị tiền tệ">
              <select style={inputStyle} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </Field>
          </div>

          {/* Quotas */}
          <div style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Giới hạn sử dụng (để trống = không giới hạn)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Số Workspace tối đa">
                <input style={inputStyle} type="number" value={form.maxWorkspaces} onChange={(e) => set("maxWorkspaces", e.target.value)} min={0} placeholder="∞" />
              </Field>
              <Field label="Số file upload tối đa">
                <input style={inputStyle} type="number" value={form.maxUploads} onChange={(e) => set("maxUploads", e.target.value)} min={0} placeholder="∞" />
              </Field>
              <Field label="Lượt tạo AI">
                <input style={inputStyle} type="number" value={form.maxUploads} onChange={(e) => set("aiGenerateLimit", e.target.value)} min={0} placeholder="∞" />
              </Field>
              <Field label="Kích thước file tối đa (MB)">
                <input style={inputStyle} type="number" value={form.maxFileMb} onChange={(e) => set("maxFileMb", e.target.value)} min={0} placeholder="∞" />
              </Field>
              <Field label="Dung lượng workspace tối đa (MB)">
                <input style={inputStyle} type="number" value={form.maxWorkspaceMb} onChange={(e) => set("maxWorkspaceMb", e.target.value)} min={0} placeholder="∞" />
              </Field>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "flex", gap: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} style={{ accentColor: ACCENT, width: 16, height: 16 }} />
              Kích hoạt gói
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <input type="checkbox" checked={form.publicVisible} onChange={(e) => set("publicVisible", e.target.checked)} style={{ accentColor: ACCENT, width: 16, height: 16 }} />
              Hiển thị công khai
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} disabled={saving}
            style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 600 }}>
            Hủy
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Đang lưu..." : editPlan ? "Cập nhật" : "Tạo gói"}
          </button>
        </div>
      </form>
    </Modal>
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
      onSaved(saved);
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

function PlanDetailModal({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: ServicePlanResponse | null }) {
  if (!plan) return null;
  const meta = PLAN_TYPE_META[plan.planType ?? "FREE"] ?? PLAN_TYPE_META.FREE;

  return (
    <Modal open={open} onClose={onClose} title="Chi tiết gói dịch vụ" width={540}>
      <div style={{ padding: "20px 24px" }}>
        {/* Plan header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#0F172A" }}>{plan.planName}</div>
            {plan.description && <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{plan.description}</div>}
          </div>
          <Badge className={meta.className}>{meta.label}</Badge>
        </div>

        {/* Price */}
        <div style={{ padding: "14px 16px", background: "rgba(255,107,0,0.05)", borderRadius: 10, border: "1px solid rgba(255,107,0,0.15)", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT }}>{formatPlanPrice(plan.monthlyPrice, plan.currency)}</div>
        </div>

        {/* Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trạng thái</div>
            <div style={{ marginTop: 6 }}>
              {plan.active
                ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60"><BadgeCheck size={12} /> Hoạt động</Badge>
                : <Badge className="bg-slate-100 text-slate-400 border-slate-200">Vô hiệu</Badge>}
            </div>
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hiển thị</div>
            <div style={{ marginTop: 6 }}>
              {plan.publicVisible
                ? <Badge className="bg-blue-50 text-blue-700 border-blue-200/60"><Eye size={12} /> Công khai</Badge>
                : <Badge className="bg-slate-100 text-slate-400 border-slate-200"><EyeOff size={12} /> Ẩn</Badge>}
            </div>
          </div>
        </div>

        {/* Quotas */}
        {plan.quotas && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Giới hạn sử dụng</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Workspaces", value: quota(plan.quotas.maxWorkspaces) },
                { label: "File upload", value: quota(plan.quotas.maxUploads) },
                { label: "Lượt AI", value: quota(plan.quotas.aiGenerateLimit) },
                { label: "Kích thước file", value: quota(plan.quotas.maxFileMb, " MB") },
                { label: "Dung lượng WS", value: quota(plan.quotas.maxWorkspaceMb, " MB") },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Tính năng ({plan.features.filter((f) => f.enabled).length}/{plan.features.length})
          </div>
          {plan.features.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>Chưa có tính năng nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {plan.features.map((f) => (
                <div key={f.featureKey} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: f.enabled ? "rgba(34,197,94,0.05)" : "#F8FAFC",
                  borderRadius: 8, border: `1px solid ${f.enabled ? "rgba(34,197,94,0.2)" : "#E2E8F0"}`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.enabled ? "#22C55E" : "#D1D5DB", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: f.enabled ? "#0F172A" : "#9CA3AF" }}>{f.featureName}</span>
                  </div>
                  <span style={{ fontSize: 11, color: f.enabled ? "#15803D" : "#9CA3AF", fontWeight: 600 }}>
                    {f.enabled ? "Bật" : "Tắt"}
                  </span>
                </div>
              ))}
            </div>
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
        updated[idx] = saved;
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng số gói", value: plans.length, colorClass: "text-slate-900" },
          { label: "Đang hoạt động", value: plans.filter((p) => p.active).length, colorClass: "text-emerald-700" },
          { label: "Đang ẩn", value: plans.filter((p) => !p.active).length, colorClass: "text-slate-400" },
          { label: "Công khai", value: plans.filter((p) => p.publicVisible).length, colorClass: "text-blue-600" },
        ].map(({ label, value, colorClass }) => (
          <div key={label} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-extrabold mt-1 ${colorClass}`}>{value}</div>
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
              <table className="w-full min-w-[900px] border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4 w-[24%]">Tên gói</th>
                    <th className="py-3 px-4 w-[12%]">Loại</th>
                    <th className="py-3 px-4 w-[14%]">Giá</th>
                    <th className="py-3 px-4 w-[14%]">Trạng thái</th>
                    <th className="py-3 px-4 w-[12%]">Hiển thị</th>
                    <th className="py-3 px-4 w-[12%]">Tính năng</th>
                    <th className="py-3 px-4 w-[12%] text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans
                    .slice()
                    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
                    .map((plan) => {
                      const meta = PLAN_TYPE_META[plan.planType ?? "FREE"] ?? PLAN_TYPE_META.FREE;
                      const enabledFeatures = plan.features.filter((f) => f.enabled).length;
                      return (
                        <motion.tr
                          key={plan.planId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-slate-50/40 transition-colors group"
                        >
                          {/* Tên gói */}
                          <td className="py-3.5 px-4 align-middle">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{plan.planName}</div>
                              {plan.description && (
                                <div className="text-xs text-slate-400 mt-1 max-w-[220px] truncate" title={plan.description}>
                                  {plan.description}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-300 mt-0.5">Thứ tự: {plan.sortOrder ?? "—"}</div>
                            </div>
                          </td>

                          {/* Loại */}
                          <td className="py-3.5 px-4 align-middle">
                            <Badge className={meta.className}>{meta.label}</Badge>
                          </td>

                          {/* Giá */}
                          <td className="py-3.5 px-4 align-middle">
                            {plan.monthlyPrice <= 0 ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold">Miễn phí</Badge>
                            ) : (
                              <span className="font-bold text-slate-900 text-sm">
                                {formatPlanPrice(plan.monthlyPrice, plan.currency)}
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-4 align-middle">
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
                          <td className="py-3.5 px-4 align-middle">
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
                          <td className="py-3.5 px-4 align-middle">
                            <div className="text-sm text-slate-700 font-semibold">
                              {enabledFeatures}/{plan.features.length}
                              <span className="text-slate-400 font-normal text-xs"> tính năng</span>
                            </div>
                          </td>

                          {/* Hành động */}
                          <td className="py-3.5 px-4 align-middle text-right">
                            <div className="inline-flex items-center gap-0.5 bg-slate-50 p-1 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <ActionBtn
                                icon={<Shield size={13} />}
                                title="Chi tiết"
                                onClick={() => openDetail(plan)}
                                className="text-slate-500 hover:text-slate-700 hover:border-slate-400"
                              />
                              <ActionBtn
                                icon={<Pencil size={13} />}
                                title="Chỉnh sửa"
                                onClick={() => openEdit(plan)}
                                className="text-blue-600 hover:text-blue-700 hover:border-blue-500"
                              />
                              <ActionBtn
                                icon={<ToggleRight size={13} />}
                                title="Trạng thái"
                                onClick={() => openStatus(plan)}
                                className={
                                  plan.active
                                    ? "text-emerald-600 hover:text-emerald-700 hover:border-emerald-500"
                                    : "text-slate-400 hover:text-slate-500 hover:border-slate-400"
                                }
                              />
                              <ActionBtn
                                icon={<Settings2 size={13} />}
                                title="Tính năng"
                                onClick={() => openFeatures(plan)}
                                className="text-[#FF6B00] hover:text-[#e05e00] hover:border-[#FF6B00]"
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
      className={`flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-all duration-150 ${className || ""}`}
    >
      {icon}
    </button>
  );
}

export default SubscriptionPlansView;
