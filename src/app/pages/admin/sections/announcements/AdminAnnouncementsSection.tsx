import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone,
  RefreshCw,
  Power,
  Save,
  Loader2,
  Info,
  AlertTriangle,
  CalendarClock,
  Clock,
  MessageSquareText,
  Type as TypeIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminAnnouncement,
  updateAdminAnnouncement,
  type AnnouncementType,
  type AnnouncementResponse,
  type UpdateAnnouncementRequest,
} from "../../../../../api/systemAnnouncementService";

/* ── datetime-local <-> ISO helpers (mirrors systemMaintenanceService) ── */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-400";

const TYPE_META: Record<AnnouncementType, { label: string; cls: string; Icon: typeof Info; color: string; bg: string; border: string }> = {
  INFO: { label: "Thông tin", cls: "text-blue-700", Icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  WARNING: { label: "Cảnh báo", cls: "text-orange-700", Icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
};

export function AdminAnnouncementsSection() {
  const [config, setConfig] = useState<AnnouncementResponse | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("INFO");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isActive = config?.active ?? false;
  const isEnabled = config?.enabled ?? false;
  const titleValid = title.trim().length > 0;
  const messageValid = message.trim().length > 0;
  const formValid = titleValid && messageValid;

  function applyConfig(next: AnnouncementResponse) {
    setConfig(next);
    setTitle(next.title ?? "");
    setMessage(next.message ?? "");
    setType(next.type ?? "INFO");
    setStartLocal(isoToLocalInput(next.startAt));
    setEndLocal(isoToLocalInput(next.endAt));
  }

  async function load() {
    setLoading(true);
    try {
      applyConfig(await getAdminAnnouncement());
    } catch (err) {
      toast.error((err as Error).message || "Không tải được cấu hình thông báo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(payload: UpdateAnnouncementRequest, successMsg: string) {
    // Guard against an inverted schedule before hitting the API.
    if (payload.startAt && payload.endAt && new Date(payload.endAt) <= new Date(payload.startAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    setSaving(true);
    try {
      applyConfig(await updateAdminAnnouncement(payload));
      toast.success(successMsg);
    } catch (err) {
      toast.error((err as Error).message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  }

  const contentPayload = (): UpdateAnnouncementRequest => ({
    title: title.trim(),
    message: message.trim(),
    content: message.trim(), // Backup if backend still expects 'content' instead of 'message'
    type,
    startAt: localInputToIso(startLocal),
    endAt: localInputToIso(endLocal),
  });

  const handleActivate = () => submit({ enabled: true, ...contentPayload() }, "Đã kích hoạt thông báo");

  const handleUpdate = () => submit({ ...contentPayload() }, "Đã cập nhật thông báo");

  const handleDeactivate = () => submit({ enabled: false }, "Đã tắt thông báo");

  const handleClearSchedule = () => {
    setStartLocal("");
    setEndLocal("");
    void submit({ clearSchedule: true }, "Đã xóa lịch hiển thị");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column: Form (span 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Megaphone size={20} className="text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Thông báo hệ thống</h2>
                <p className="text-xs text-slate-500 mt-0.5">Một thông báo công khai duy nhất hiển thị trên toàn trang</p>
              </div>
            </div>
            <button
              onClick={() => void load()}
              disabled={loading || saving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 disabled:opacity-50 active:scale-[0.98] shadow-sm"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Megaphone size={15} className="text-slate-400" /> Tiêu đề
                <span className="text-orange-500">*</span>
              </label>
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vd: Bảo trì hệ thống định kỳ"
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <MessageSquareText size={15} className="text-slate-400" /> Nội dung
                <span className="text-orange-500">*</span>
              </label>
              <textarea
                className={`${inputCls} min-h-[100px] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nội dung thông báo hiển thị cho người dùng..."
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <TypeIcon size={15} className="text-slate-400" /> Loại thông báo
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(TYPE_META).map(([key, meta]) => {
                  const t = key as AnnouncementType;
                  const isSelected = type === t;
                  const Icon = meta.Icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setType(t)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected ? `${meta.border} ${meta.bg} ring-2 ring-orange-500/20` : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                        <Icon size={16} className={isSelected ? meta.color : "text-slate-500"} />
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? meta.cls : "text-slate-700"}`}>
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <CalendarClock size={15} className="text-slate-400" /> Bắt đầu (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={startLocal}
                  max={endLocal || undefined}
                  onChange={(e) => setStartLocal(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock size={15} className="text-slate-400" /> Kết thúc (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={endLocal}
                  min={startLocal || undefined}
                  onChange={(e) => setEndLocal(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            {(startLocal || endLocal) && (
              <button
                onClick={handleClearSchedule}
                disabled={saving}
                className="self-start text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Xóa lịch hiển thị
              </button>
            )}
          </div>
          
          {/* Actions - Sticky Bottom */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-5 flex flex-wrap items-center justify-between gap-4 z-10">
            {config ? (
              <div className="text-xs text-slate-400 flex flex-col gap-0.5">
                <span>Cập nhật: <strong className="text-slate-600">{formatDateTime(config.updatedAt)}</strong></span>
              </div>
            ) : <div/>}
            <div className="flex items-center gap-3 ml-auto">
              {!isEnabled ? (
                <button
                  onClick={handleActivate}
                  disabled={saving || !formValid}
                  title={!formValid ? "Vui lòng nhập tiêu đề và nội dung" : undefined}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  {saving ? "Đang kích hoạt..." : "Kích hoạt"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={saving || !formValid}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                    Tắt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview (span 2) */}
        <div className="lg:col-span-2 sticky top-20 flex flex-col gap-5">
          {/* Status Indicator */}
          <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-colors shadow-sm ${isActive ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50" : "border-slate-200 bg-white"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
              {isActive ? <Megaphone size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                </span>
                <span className={`text-sm font-extrabold tracking-wide ${isActive ? "text-emerald-700" : "text-slate-600"}`}>
                  {isActive ? "ĐANG HIỂN THỊ" : "CHƯA PHÁT SÓNG"}
                </span>
                {isEnabled && !isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock size={11} /> Đã lên lịch
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 leading-snug ${isActive ? "text-emerald-700/80" : "text-slate-500"}`}>
                {isActive ? "Banner đang xuất hiện trên trang Học viên." : "Banner chưa được bật hoặc chưa đến giờ."}
              </p>
            </div>
          </div>

          {/* Banner Mockup */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden relative shadow-inner">
            <div className="p-3 border-b border-slate-200 bg-slate-100/80 flex items-center gap-2">
              <div className="flex gap-1.5 ml-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3">Live Preview</div>
            </div>
            <div className="p-4 pt-6 pb-12 flex flex-col items-center justify-start bg-white min-h-[220px]">
              {/* Fake Dashboard Header */}
              <div className="w-full max-w-sm h-10 border-b border-slate-100 flex items-center justify-between px-4 mb-4 opacity-40">
                <div className="w-24 h-4 bg-slate-200 rounded-full"></div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                  <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                </div>
              </div>
              
              {/* Actual Banner Rendering Mockup */}
              <AnimatePresence mode="wait">
                {titleValid || messageValid ? (
                  <motion.div
                    key="banner"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`w-full max-w-sm shadow-xl relative overflow-hidden rounded-xl border ${
                      type === "WARNING"
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                    }`}
                  >
                    <div className="px-4 py-3 flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${type === "WARNING" ? "text-orange-500" : "text-blue-500"}`}>
                        {type === "WARNING" ? <AlertTriangle size={18} /> : <Info size={18} />}
                      </div>
                      <div className="flex-1 min-w-0 pb-0.5">
                        {titleValid && <h4 className={`text-sm font-bold ${type === "WARNING" ? "text-orange-900" : "text-blue-900"}`}>{title}</h4>}
                        {messageValid && <p className={`text-[13px] mt-0.5 leading-relaxed ${type === "WARNING" ? "text-orange-800" : "text-blue-800"}`}>{message}</p>}
                      </div>
                      <button className={`shrink-0 p-1 -mr-1 rounded-md transition-colors ${type === "WARNING" ? "hover:bg-orange-200/50 text-orange-400" : "hover:bg-blue-200/50 text-blue-400"}`}>
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-sm text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-6 text-slate-400 text-sm font-medium"
                  >
                    Hãy nhập Tiêu đề và Nội dung<br/>để xem trước
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminAnnouncementsSection;
