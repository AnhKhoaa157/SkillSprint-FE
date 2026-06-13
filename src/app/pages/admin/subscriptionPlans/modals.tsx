import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck, Check, Eye, EyeOff, Layers, Loader2, Plus, ShieldAlert, Sparkles, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSubscriptionPlan,
  getPlanFeaturesCatalog,
  updatePlanFeatures,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
  formatPlanPrice,
  type FeatureCatalogResponse,
  type FeatureToggle,
  type ServicePlanResponse,
} from "../../../../api/adminSubscriptionPlansService";
import { PlanTypeBadge } from "../../../../components/admin/PlanTypeBadge";
import { Badge, Field, Modal, ToggleSwitch } from "./primitives";
import {
  ACCENT,
  BADGE_ANIMATIONS,
  BADGE_GRADIENT_PRESETS,
  BADGE_ICON_OPTIONS,
  DEFAULT_FORM,
  MAX_PRICE_VND,
  PLAN_BANNER,
  PLAN_TYPE_OPTIONS,
  QUOTA_DETAIL_FIELDS,
  QUOTA_FORM_FIELDS,
  buildPlanPayload,
  inputCls,
  planToForm,
  type PlanFormData,
} from "./config";

/* ========================================================================== */
/*  Create / Edit plan                                                        */
/* ========================================================================== */

export function PlanFormModal({
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

  const priceOverflow = Number(form.monthlyPrice) > MAX_PRICE_VND;
  const quotaOverflow = QUOTA_FORM_FIELDS.some((f) => f.max != null && Number(form[f.key]) > f.max);
  const isFormInvalid = priceOverflow || quotaOverflow;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planName.trim()) { toast.error("Tên gói không được để trống"); return; }
    const price = parseFloat(form.monthlyPrice);
    if (isNaN(price) || price < 0) { toast.error("Giá không hợp lệ"); return; }

    setSaving(true);
    try {
      const payload = buildPlanPayload(form, price);
      const saved = editPlan
        ? await updateSubscriptionPlan(editPlan.planId, payload)
        : await createSubscriptionPlan({ ...payload, active: form.active });
      toast.success(editPlan ? "Đã cập nhật gói dịch vụ" : "Đã tạo gói dịch vụ mới");
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

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6">

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

                  <Field label="Loại gói" required hint={editPlan ? "🔒 Không thể đổi loại của gói đã tồn tại" : "Mỗi loại chỉ gán cho một gói"}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PLAN_TYPE_OPTIONS.map((opt) => {
                        const selected = form.planType === opt.value;
                        const locked = Boolean(editPlan);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={locked && !selected}
                            onClick={() => { if (!locked) set("planType", opt.value); }}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                              selected
                                ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            } ${locked ? "cursor-not-allowed" : ""} ${locked && !selected ? "opacity-40" : ""}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Giá hàng tháng" required>
                      <input
                        className={`${inputCls} ${priceOverflow ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        type="number"
                        value={form.monthlyPrice}
                        onChange={(e) => set("monthlyPrice", e.target.value)}
                        min={0}
                      />
                      <AnimatePresence mode="wait" initial={false}>
                        {priceOverflow ? (
                          <motion.span key="price-error"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="text-xs font-medium text-red-500">
                            ⚠️ Giá hàng tháng vượt quá giới hạn cho phép (Tối đa 999 triệu VNĐ)
                          </motion.span>
                        ) : (
                          <motion.span key="price-hint"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-xs text-slate-400">
                            Nhập 0 cho gói miễn phí
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Field>
                    <Field label="Đơn vị tiền tệ">
                      <select className={inputCls} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                        <option value="VND">VND</option>
                        <option value="USD">USD</option>
                      </select>
                    </Field>
                  </div>
                </div>

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

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Sparkles size={15} className="text-[#FF6B00]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 leading-tight">Thiết kế Giao diện Badge</h4>
                      <p className="text-[11px] text-slate-400">Tùy chỉnh màu gradient, icon và hiệu ứng động</p>
                    </div>
                  </div>

                  <Field label="Preset gradient">
                    <div className="flex flex-wrap gap-2">
                      {BADGE_GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.label}
                          onClick={() => set("badgeColor", preset.value)}
                          className={`h-8 w-12 rounded-lg bg-gradient-to-r ${preset.value} ring-2 transition active:scale-[0.95] ${
                            form.badgeColor === preset.value ? "ring-orange-500" : "ring-transparent hover:ring-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </Field>

                  <Field label="Tailwind classes (nâng cao)">
                    <input
                      className={inputCls}
                      value={form.badgeColor}
                      onChange={(e) => set("badgeColor", e.target.value)}
                      placeholder="from-... via-... to-... text-white shadow-.../30"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Icon (Lucide)">
                      <select className={inputCls} value={form.badgeIcon} onChange={(e) => set("badgeIcon", e.target.value)}>
                        <option value="">— Mặc định theo loại —</option>
                        {BADGE_ICON_OPTIONS.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Hiệu ứng động">
                      <div className="flex gap-2">
                        {BADGE_ANIMATIONS.map((a) => (
                          <button
                            key={a.value}
                            type="button"
                            onClick={() => set("animationType", a.value)}
                            className={`flex-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                              (form.animationType || "none") === a.value
                                ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>

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
                    {QUOTA_FORM_FIELDS.map((qf) => {
                      const value = form[qf.key] as string;
                      const isOver = qf.max != null && Number(value) > qf.max;
                      return (
                        <Field key={qf.key} label={qf.label}>
                          <input
                            className={`${inputCls} ${isOver ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                            type="number"
                            min={0}
                            value={value}
                            onChange={(e) => set(qf.key, e.target.value)}
                            placeholder="∞ Không giới hạn"
                          />
                          {qf.max != null && (
                            <AnimatePresence mode="wait" initial={false}>
                              {isOver ? (
                                <motion.span key="q-error"
                                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                  className="text-xs font-medium text-red-500">
                                  {qf.errorMsg}
                                </motion.span>
                              ) : (
                                <motion.span key="q-hint"
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="text-xs text-slate-400">
                                  Để trống = không giới hạn
                                </motion.span>
                              )}
                            </AnimatePresence>
                          )}
                        </Field>
                      );
                    })}
                  </div>
                </div>

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
                      <div className="text-[11px] text-slate-400">Xuất hiện trên trang giá cả</div>
                    </div>
                  </label>
                </div>

                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 leading-tight">Xem trước Badge</h4>
                    <p className="text-[11px] text-slate-400">Cập nhật theo thời gian thực</p>
                  </div>
                  <PlanTypeBadge
                    type={form.planType}
                    label={PLAN_TYPE_OPTIONS.find((o) => o.value === form.planType)?.label}
                    badgeColor={form.badgeColor}
                    badgeIcon={form.badgeIcon}
                    animationType={form.animationType}
                    size="md"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                <button type="button" onClick={onClose} disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={saving || isFormInvalid}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed">
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

/* ========================================================================== */
/*  Status (active / public)                                                  */
/* ========================================================================== */

export function StatusModal({
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

/* ========================================================================== */
/*  Feature toggles                                                           */
/* ========================================================================== */

export function FeaturesModal({
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

/* ========================================================================== */
/*  Read-only detail                                                          */
/* ========================================================================== */

export function PlanDetailModal({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: ServicePlanResponse | null }) {
  if (!plan) return null;

  const banner = PLAN_BANNER[plan.planType ?? "FREE"] ?? PLAN_BANNER.FREE;
  const benefits = plan.benefits ?? [];
  const enabledCount = plan.features.filter((f) => f.enabled).length;
  const q = plan.quotas;

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

        <div>
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

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {plan.publicVisible
              ? <Badge className="bg-blue-50 text-blue-700 border-blue-200/60"><Eye size={12} /> Công khai</Badge>
              : <Badge className="bg-slate-100 text-slate-400 border-slate-200"><EyeOff size={12} /> Ẩn</Badge>}
            <Badge className="bg-slate-100 text-slate-500 border-slate-200">Thứ tự #{plan.sortOrder ?? "—"}</Badge>
          </div>

          {q && (
            <>
              <div style={sectionLabel}>Giới hạn sử dụng</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {QUOTA_DETAIL_FIELDS.map(({ label, pick, Icon }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} className="text-slate-500" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{pick(q)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
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
