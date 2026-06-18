import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquareText,
  Power,
  RefreshCw,
  Save,
  ServerCog,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMaintenanceConfig,
  updateMaintenanceMode,
  isoToLocalInput,
  localInputToIso,
  type MaintenanceResponse,
  type UpdateMaintenanceRequest,
} from "../../api/system/systemMaintenanceService";
import { setCachedMaintenance } from "../../api/system/maintenanceState";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-400";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function nowLocalInput(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AdminSystemStatus() {
  const [config, setConfig] = useState<MaintenanceResponse | null>(null);
  const [message, setMessage] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [nowTS, setNowTS] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTS(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isActive = config?.active ?? false;
  const isEnabledRaw = config?.enabled ?? false;
  const hasExpired = config?.endAt ? new Date(config.endAt).getTime() <= nowTS : false;
  const isEnabled = isEnabledRaw && !hasExpired;
  const messageValid = message.trim().length > 0;
  const nowStr = nowLocalInput();

  function applyConfig(next: MaintenanceResponse) {
    setConfig(next);
    setMessage(next.message ?? "");
    setStartLocal(isoToLocalInput(next.startAt));
    setEndLocal(isoToLocalInput(next.endAt));

    setCachedMaintenance({
      isActive: next.active,
      message: next.message ?? "",
      startAt: next.startAt,
      endAt: next.endAt,
    });
  }

  async function load() {
    setLoading(true);
    try {
      applyConfig(await getMaintenanceConfig());
    } catch (err) {
      toast.error((err as Error).message || "Không tải được cấu hình bảo trì");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(payload: UpdateMaintenanceRequest, successMsg: string) {
    if (payload.startAt) {
      const submittedStart = isoToLocalInput(payload.startAt);
      const startChanged = submittedStart !== isoToLocalInput(config?.startAt);
      if (startChanged && submittedStart < nowLocalInput()) {
        toast.error("Thời gian bắt đầu không được nằm trong quá khứ");
        return;
      }
    }

    if (payload.startAt && payload.endAt && new Date(payload.endAt) <= new Date(payload.startAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    
    if (payload.enabled && payload.endAt && new Date(payload.endAt).getTime() <= Date.now()) {
      toast.error("Lịch bảo trì cũ đã kết thúc. Vui lòng chọn thời gian kết thúc ở tương lai.");
      return;
    }

    setSaving(true);
    try {
      applyConfig(await updateMaintenanceMode(payload));
      toast.success(successMsg);
    } catch (err) {
      toast.error((err as Error).message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  }

  const schedulePayload = (): Pick<UpdateMaintenanceRequest, "startAt" | "endAt"> => ({
    startAt: localInputToIso(startLocal),
    endAt: localInputToIso(endLocal),
  });

  const handleActivate = () =>
    submit({ enabled: true, message: message.trim(), ...schedulePayload() }, "Đã bật chế độ bảo trì");

  const handleUpdate = () =>
    submit({ message: message.trim(), ...schedulePayload() }, "Đã cập nhật thông tin bảo trì");

  const handleDeactivate = () => submit({ enabled: false }, "Đã tắt chế độ bảo trì");

  const handleClearSchedule = () => {
    setStartLocal("");
    setEndLocal("");
    void submit({ clearSchedule: true }, "Đã xóa lịch bảo trì");
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
                <ServerCog size={20} className="text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Chế độ bảo trì hệ thống</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tạm ngưng truy cập cho người dùng · Admin luôn vào được</p>
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
                <MessageSquareText size={15} className="text-slate-400" /> Thông báo bảo trì
                <span className="text-orange-500">*</span>
              </label>
              <textarea
                className={`${inputCls} min-h-[100px] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Vd: SkillSprint đang nâng cấp hệ thống, dự kiến hoàn tất lúc 23:00. Cảm ơn bạn đã kiên nhẫn!"
                disabled={saving}
              />
              <span className="text-[11px] text-slate-400 leading-snug mt-1">
                Lưu ý: Chặn phía giao diện chỉ là lớp phòng vệ bổ sung — hiệu lực thực sự phụ thuộc vào việc backend trả về 503.
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
                  min={nowStr}
                  onChange={(e) => setStartLocal(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock size={15} className="text-slate-400" /> Dự kiến kết thúc (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={endLocal}
                  min={nowStr}
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
                Xóa lịch bảo trì
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
                  disabled={saving || !messageValid}
                  title={!messageValid ? "Vui lòng nhập thông báo bảo trì" : undefined}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  {saving ? "Đang bật..." : "Kích hoạt bảo trì"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={saving || !messageValid}
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
          <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-colors shadow-sm ${isActive ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
              {isActive ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? "bg-amber-500" : "bg-emerald-500"}`} />
                </span>
                <span className={`text-sm font-extrabold tracking-wide ${isActive ? "text-amber-700" : "text-emerald-700"}`}>
                  {isActive ? "ĐANG BẢO TRÌ" : "HỆ THỐNG HOẠT ĐỘNG"}
                </span>
                {isEnabled && !isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock size={11} /> Đã lên lịch
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 leading-snug ${isActive ? "text-amber-700/80" : "text-emerald-700/80"}`}>
                {isActive ? "Người dùng đang thấy trang bảo trì." : "Hệ thống hoạt động bình thường."}
              </p>
            </div>
            <Activity size={28} className={`shrink-0 ${isActive ? "text-amber-400" : "text-emerald-400"}`} />
          </div>

          {/* Maintenance Screen Mockup */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden relative shadow-inner">
            <div className="p-3 border-b border-slate-200 bg-slate-100/80 flex items-center gap-2">
              <div className="flex gap-1.5 ml-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3">Live Preview (Lock Screen)</div>
            </div>
            <div className="p-4 pt-10 pb-16 flex flex-col items-center justify-start bg-slate-50 min-h-[300px]">
              {/* Actual Maintenance Screen Rendering Mockup */}
              <AnimatePresence mode="wait">
                <motion.div
                  key="maintenance-preview"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[280px] text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-orange-500/10 border border-orange-100 flex items-center justify-center mb-6">
                    <ServerCog size={32} className="text-[#FF6B00]" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-2">Hệ thống đang bảo trì</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed min-h-[40px]">
                    {messageValid ? message : "Đang nâng cấp hệ thống. Cảm ơn bạn đã chờ đợi."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminSystemStatus;
