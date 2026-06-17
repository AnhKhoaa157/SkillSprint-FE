import { useEffect, useState } from "react";
import { motion } from "motion/react";
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

const TYPE_META: Record<AnnouncementType, { label: string; cls: string; Icon: typeof Info }> = {
  INFO: { label: "Thông tin", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", Icon: Info },
  WARNING: { label: "Cảnh báo", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertTriangle },
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
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 disabled:opacity-50 active:scale-[0.98]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* ── Live Status Monitor ── */}
          <div
            className={`rounded-2xl border p-4 flex items-center gap-4 transition-colors ${
              isActive
                ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50"
                : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isActive ? <Megaphone size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                      isActive ? "bg-indigo-500" : "bg-slate-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isActive ? "bg-indigo-500" : "bg-slate-400"
                    }`}
                  />
                </span>
                <span className={`text-sm font-extrabold tracking-wide ${isActive ? "text-indigo-700" : "text-slate-600"}`}>
                  {isActive ? "ĐANG HIỂN THỊ" : "KHÔNG HIỂN THỊ"}
                </span>
                {isEnabled && !isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock size={11} /> Đã lên lịch
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 truncate ${isActive ? "text-indigo-700/80" : "text-slate-500"}`}>
                {isActive
                  ? config?.title || "Thông báo đang hiển thị cho người dùng."
                  : "Hiện không có thông báo nào hiển thị cho người dùng."}
              </p>
            </div>
          </div>

          {/* ── Last updated meta ── */}
          {config && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
              <span>
                Cập nhật lần cuối: <span className="font-semibold text-slate-600">{formatDateTime(config.updatedAt)}</span>
              </span>
              {config.updatedBy && (
                <span>
                  Bởi: <span className="font-semibold text-slate-600">{config.updatedBy}</span>
                </span>
              )}
            </div>
          )}

          {/* ── Config form ── */}
          <div className="flex flex-col gap-4">
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
                className={`${inputCls} min-h-[88px] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nội dung thông báo hiển thị cho người dùng..."
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <TypeIcon size={15} className="text-slate-400" /> Loại thông báo
              </label>
              <select
                className={`${inputCls} cursor-pointer font-semibold`}
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                disabled={saving}
              >
                <option value="INFO">Thông tin (INFO)</option>
                <option value="WARNING">Cảnh báo (WARNING)</option>
              </select>
              <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TYPE_META[type].cls}`}>
                {(() => {
                  const MetaIcon = TYPE_META[type].Icon;
                  return <MetaIcon size={11} />;
                })()}
                {TYPE_META[type].label}
              </span>
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

          {/* ── Actions ── */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-slate-100 mt-1">
            {!isEnabled ? (
              <button
                onClick={handleActivate}
                disabled={saving || !formValid}
                title={!formValid ? "Vui lòng nhập tiêu đề và nội dung" : undefined}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                {saving ? "Đang kích hoạt..." : "Kích hoạt thông báo"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={saving || !formValid}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu thay đổi
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-slate-500 to-slate-600 shadow-lg shadow-slate-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  {saving ? "Đang tắt..." : "Tắt thông báo"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminAnnouncementsSection;
