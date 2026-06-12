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

const PLAN_TYPE_META: Record<ServicePlanType, { label: string; color: string; bg: string; border: string }> = {
  FREE:          { label: "Free",          color: "#6B7280", bg: "#F3F4F6",               border: "#E5E7EB" },
  SKILL_BUILDER: { label: "Skill Builder", color: "#2563EB", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.25)" },
  PREMIUM:       { label: "Premium",       color: "#FF6B00", bg: "rgba(255,107,0,0.08)",  border: "rgba(255,107,0,0.25)" },
};

const ACTION_TYPE_LABEL: Record<BusinessActionType, string> = {
  SERVICE_PLAN_CREATED:          "Tạo gói",
  SERVICE_PLAN_UPDATED:          "Cập nhật gói",
  SERVICE_PLAN_STATUS_UPDATED:   "Cập nhật trạng thái",
  SERVICE_PLAN_FEATURES_UPDATED: "Cập nhật tính năng",
};

const ACTION_TYPE_COLOR: Record<BusinessActionType, { bg: string; text: string; border: string }> = {
  SERVICE_PLAN_CREATED:          { bg: "rgba(34,197,94,0.08)",   text: "#15803D", border: "rgba(34,197,94,0.28)" },
  SERVICE_PLAN_UPDATED:          { bg: "rgba(37,99,235,0.08)",   text: "#1D4ED8", border: "rgba(37,99,235,0.25)" },
  SERVICE_PLAN_STATUS_UPDATED:   { bg: "rgba(245,158,11,0.10)",  text: "#B45309", border: "rgba(245,158,11,0.28)" },
  SERVICE_PLAN_FEATURES_UPDATED: { bg: "rgba(168,85,247,0.08)",  text: "#7C3AED", border: "rgba(168,85,247,0.25)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function formatPrice(price: number, currency = "VND") {
  if (currency === "VND") {
    return price === 0
      ? "Miễn phí"
      : price >= 1_000_000
        ? `${(price / 1_000_000).toFixed(1)}M ₫/tháng`
        : `${(price / 1_000).toFixed(0)}K ₫/tháng`;
  }
  return `${price} ${currency}/month`;
}

function quota(val: number | null | undefined, unit = "") {
  if (val == null) return "∞";
  return `${val}${unit}`;
}

// ─── Tiny Badge ───────────────────────────────────────────────────────────────

function Badge({ bg, text, border, children }: { bg: string; text: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 20,
      background: bg, color: text, border: `1px solid ${border}`,
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer",
        padding: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      {checked
        ? <ToggleRight size={22} color={ACCENT} />
        : <ToggleLeft size={22} color="#9CA3AF" />}
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

  // Returns undefined (key omitted from JSON) when empty — both BE endpoints treat absent/null the same way.
  // CREATE: defaultValue(null, X) → applies hardcoded default; UPDATE: if (field != null) → skips field.
  const parseOptInt = (s: string): number | undefined =>
    s.trim() === "" ? undefined : parseInt(s, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planName.trim()) { toast.error("Tên gói không được để trống"); return; }
    const price = parseFloat(form.monthlyPrice);
    if (isNaN(price) || price < 0) { toast.error("Giá không hợp lệ"); return; }

    // Shared quota block — built once, used in both branches.
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
                <input style={inputStyle} type="number" value={form.aiGenerateLimit} onChange={(e) => set("aiGenerateLimit", e.target.value)} min={0} placeholder="∞" />
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
              {formatPrice(plan.monthlyPrice, plan.currency)}
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
            <Badge bg="rgba(255,107,0,0.08)" text={ACCENT} border="rgba(255,107,0,0.25)">
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
                      <Badge bg="#F3F4F6" text="#9CA3AF" border="#E5E7EB">Tắt</Badge>
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
          <Badge bg={meta.bg} text={meta.color} border={meta.border}>{meta.label}</Badge>
        </div>

        {/* Price */}
        <div style={{ padding: "14px 16px", background: "rgba(255,107,0,0.05)", borderRadius: 10, border: "1px solid rgba(255,107,0,0.15)", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT }}>{formatPrice(plan.monthlyPrice, plan.currency)}</div>
        </div>

        {/* Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trạng thái</div>
            <div style={{ marginTop: 6 }}>
              {plan.active
                ? <Badge bg="rgba(34,197,94,0.08)" text="#15803D" border="rgba(34,197,94,0.28)"><BadgeCheck size={12} /> Hoạt động</Badge>
                : <Badge bg="#F3F4F6" text="#9CA3AF" border="#E5E7EB">Vô hiệu</Badge>}
            </div>
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hiển thị</div>
            <div style={{ marginTop: 6 }}>
              {plan.publicVisible
                ? <Badge bg="rgba(37,99,235,0.08)" text="#1D4ED8" border="rgba(37,99,235,0.25)"><Eye size={12} /> Công khai</Badge>
                : <Badge bg="#F3F4F6" text="#9CA3AF" border="#E5E7EB"><EyeOff size={12} /> Ẩn</Badge>}
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
  const actionMeta = ACTION_TYPE_COLOR[log.actionType] ?? { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
  const hasDetails = log.description || log.oldValue || log.newValue || log.metadata;

  return (
    <div style={{ borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden", background: "#fff" }}>
      <div
        onClick={hasDetails ? onToggle : undefined}
        style={{
          display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1.6fr 1fr auto",
          gap: 12, alignItems: "center", padding: "12px 16px",
          cursor: hasDetails ? "pointer" : "default",
          background: expanded ? "#F8FAFC" : "#fff",
        }}
      >
        <div style={{ fontSize: 12, color: "#0F172A" }}>
          <div style={{ fontWeight: 600 }}>{log.adminEmail}</div>
          <div style={{ color: "#9CA3AF", fontSize: 11 }}>{formatDate(log.createdAt)}</div>
        </div>
        <Badge bg={actionMeta.bg} text={actionMeta.text} border={actionMeta.border}>
          {ACTION_TYPE_LABEL[log.actionType] ?? log.actionType}
        </Badge>
        <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>{log.title}</div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.entityId.slice(0, 8)}…
        </div>
        {hasDetails && (
          <div style={{ color: "#9CA3AF" }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {expanded && hasDetails && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #F1F5F9" }}>
          {log.description && (
            <div style={{ fontSize: 13, color: "#374151", paddingTop: 10 }}>{log.description}</div>
          )}
          {(log.oldValue || log.newValue) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {log.oldValue && (
                <div style={{ padding: "8px 10px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#B91C1C", marginBottom: 4, textTransform: "uppercase" }}>Trước</div>
                  <pre style={{ fontSize: 11, color: "#374151", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{log.oldValue}</pre>
                </div>
              )}
              {log.newValue && (
                <div style={{ padding: "8px 10px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", marginBottom: 4, textTransform: "uppercase" }}>Sau</div>
                  <pre style={{ fontSize: 11, color: "#374151", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{log.newValue}</pre>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ borderRadius: 16, padding: "20px 24px", background: "linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%)", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={20} color={ACCENT} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#0F172A" }}>Quản lý gói dịch vụ</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>Cấu hình các gói subscription · {plans.length} gói hiện có</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={loadPlans} disabled={loadingPlans}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: loadingPlans ? "spin 1s linear infinite" : "none" }} />
              Làm mới
            </button>
            <button onClick={() => setShowCreateModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              <Plus size={16} />
              Tạo gói mới
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        {[
          { label: "Tổng số gói", value: plans.length, color: "#0F172A" },
          { label: "Đang hoạt động", value: plans.filter((p) => p.active).length, color: "#15803D" },
          { label: "Đang ẩn", value: plans.filter((p) => !p.active).length, color: "#9CA3AF" },
          { label: "Công khai", value: plans.filter((p) => p.publicVisible).length, color: "#1D4ED8" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "14px 18px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, padding: "4px", background: "#F1F5F9", borderRadius: 12, width: "fit-content" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 9,
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.15s",
              background: tab === id ? "#fff" : "transparent",
              color: tab === id ? "#0F172A" : "#64748B",
              boxShadow: tab === id ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
            }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ── */}
      {tab === "plans" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loadingPlans ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14 }}>
              Đang tải danh sách gói...
            </div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              Chưa có gói dịch vụ nào.&nbsp;
              <button onClick={() => setShowCreateModal(true)} style={{ background: "none", border: "none", cursor: "pointer", color: ACCENT, fontWeight: 700, fontSize: 14 }}>
                Tạo gói đầu tiên
              </button>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1fr 1.4fr",
                gap: 12, padding: "10px 18px",
                fontSize: 11, fontWeight: 700, color: "#64748B",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <span>Tên gói</span>
                <span>Loại</span>
                <span>Giá</span>
                <span>Trạng thái</span>
                <span>Hiển thị</span>
                <span>Tính năng</span>
                <span style={{ textAlign: "right" }}>Hành động</span>
              </div>

              {plans
                .slice()
                .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
                .map((plan) => {
                  const meta = PLAN_TYPE_META[plan.planType ?? "FREE"] ?? PLAN_TYPE_META.FREE;
                  const enabledFeatures = plan.features.filter((f) => f.enabled).length;
                  return (
                    <motion.div key={plan.planId}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1fr 1.4fr",
                        gap: 12, alignItems: "center", padding: "14px 18px",
                        background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0",
                        transition: "box-shadow 0.15s",
                      }}
                      whileHover={{ boxShadow: "0 4px 16px rgba(15,23,42,0.08)" }}
                    >
                      {/* Name */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{plan.planName}</div>
                        {plan.description && (
                          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {plan.description}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 1 }}>Thứ tự: {plan.sortOrder ?? "—"}</div>
                      </div>

                      {/* Type */}
                      <Badge bg={meta.bg} text={meta.color} border={meta.border}>{meta.label}</Badge>

                      {/* Price */}
                      <div style={{ fontWeight: 700, fontSize: 13, color: plan.monthlyPrice === 0 ? "#15803D" : "#0F172A" }}>
                        {formatPrice(plan.monthlyPrice, plan.currency)}
                      </div>

                      {/* Active status */}
                      <div>
                        {plan.active
                          ? <Badge bg="rgba(34,197,94,0.08)" text="#15803D" border="rgba(34,197,94,0.28)">Hoạt động</Badge>
                          : <Badge bg="#F3F4F6" text="#9CA3AF" border="#E5E7EB">Vô hiệu</Badge>}
                      </div>

                      {/* Visibility */}
                      <div>
                        {plan.publicVisible
                          ? <Badge bg="rgba(37,99,235,0.08)" text="#1D4ED8" border="rgba(37,99,235,0.25)"><Eye size={10} /> Công khai</Badge>
                          : <Badge bg="#F3F4F6" text="#9CA3AF" border="#E5E7EB"><EyeOff size={10} /> Ẩn</Badge>}
                      </div>

                      {/* Features */}
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                        {enabledFeatures}/{plan.features.length}
                        <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: 11 }}> tính năng</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <ActionBtn icon={<Shield size={13} />} title="Chi tiết" onClick={() => openDetail(plan)} color="#64748B" />
                        <ActionBtn icon={<Pencil size={13} />} title="Chỉnh sửa" onClick={() => openEdit(plan)} color="#2563EB" />
                        <ActionBtn icon={<ToggleRight size={13} />} title="Trạng thái" onClick={() => openStatus(plan)} color={plan.active ? "#15803D" : "#9CA3AF"} />
                        <ActionBtn icon={<Settings2 size={13} />} title="Tính năng" onClick={() => openFeatures(plan)} color={ACCENT} />
                      </div>
                    </motion.div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { auditLoadedRef.current = false; loadAuditLogs(); }} disabled={loadingAudit}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 }}>
              <RefreshCw size={13} style={{ animation: loadingAudit ? "spin 1s linear infinite" : "none" }} />
              Làm mới nhật ký
            </button>
          </div>

          {loadingAudit ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14 }}>Đang tải nhật ký...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              Chưa có nhật ký nào
            </div>
          ) : (
            <>
              {/* Audit header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1.6fr 1fr auto",
                gap: 12, padding: "8px 16px",
                fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <span>Admin</span>
                <span>Hành động</span>
                <span>Nội dung</span>
                <span>Entity ID</span>
                <span style={{ width: 16 }} />
              </div>

              {auditLogs.map((log) => (
                <AuditLogRow
                  key={log.logId}
                  log={log}
                  expanded={expandedLogId === log.logId}
                  onToggle={() => setExpandedLogId((id) => (id === log.logId ? null : log.logId))}
                />
              ))}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

// ─── Tiny action button ───────────────────────────────────────────────────────

function ActionBtn({ icon, title, onClick, color }: { icon: React.ReactNode; title: string; onClick: () => void; color: string }) {
  return (
    <button title={title} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 7,
        border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = color; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; }}
    >
      {icon}
    </button>
  );
}

export default SubscriptionPlansView;
