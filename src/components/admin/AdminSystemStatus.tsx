import { useEffect, useState } from "react";
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
} from "../../api/systemMaintenanceService";
import { setCachedMaintenance } from "../../api/maintenanceState";

// Shared SaaS input style: rounded-xl with a smooth orange focus ring.
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-400";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

/** Current local wall-clock time as "YYYY-MM-DDTHH:mm" — for a datetime-local `min=` attribute
    and for minute-precision past-date comparisons. The timezone-offset shift makes toISOString()
    yield the *local* clock instead of UTC, which is what datetime-local inputs expect. */
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
  // Lower bound for both pickers: the current local minute. Native-disables past dates in the UI.
  const nowStr = nowLocalInput();

  function applyConfig(next: MaintenanceResponse) {
    setConfig(next);
    setMessage(next.message ?? "");
    setStartLocal(isoToLocalInput(next.startAt));
    setEndLocal(isoToLocalInput(next.endAt));

    // Keep the shared (framework-agnostic) cache in lockstep with what the admin just toggled, so
    // the apiClient interceptor + login guard react immediately instead of waiting for the next
    // 30s poll. `active` already means "enabled AND inside the [startAt, endAt] window".
    // NOTE: this only flips state in THIS admin browser. Learner sessions are force-logged-out by
    // each client's <MaintenanceGate> (and, authoritatively, by the backend invalidating sessions).
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(payload: UpdateMaintenanceRequest, successMsg: string) {
    // Anti-past-date guard. The native `min=` already blocks past dates in the picker UI; this is
    // the definitive backstop for a manually-typed/forced value. Compared at minute precision (to
    // match `min=`), and only when a start is actually being submitted (so Deactivate/Clear are
    // unaffected). We reject only a *changed* start, so re-saving an already-running maintenance —
    // whose startAt is legitimately in the past — is never falsely blocked.
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
    
    // Guard against activating with an already expired endAt
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
    submit({ clearSchedule: true }, "Đã xóa lịch bảo trì");
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <ServerCog size={20} className="text-[#FF6B00]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Chế độ bảo trì hệ thống</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tạm ngưng truy cập cho người dùng · Admin luôn vào được</p>
            {/* Operator reminder: the client-side lockdown is defense-in-depth only. */}
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Lưu ý: chặn phía giao diện chỉ là lớp phòng vệ bổ sung — hiệu lực thực sự phụ thuộc vào việc backend trả về 503 cho người dùng không phải admin.
            </p>
          </div>
        </div>
        <button
          onClick={load}
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
              ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
              : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isActive ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isActive ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2.5 w-2.5`}>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    isActive ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isActive ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              <span
                className={`text-sm font-extrabold tracking-wide ${
                  isActive ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {isActive ? "ĐANG BẢO TRÌ" : "HỆ THỐNG HOẠT ĐỘNG"}
              </span>
              {isEnabled && !isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  <Clock size={11} /> Đã lên lịch
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 truncate ${isActive ? "text-amber-700/80" : "text-emerald-700/80"}`}>
              {isActive
                ? config?.message || "Người dùng đang thấy trang bảo trì."
                : "Người dùng đang truy cập bình thường."}
            </p>
          </div>
          <Activity size={28} className={`shrink-0 ${isActive ? "text-amber-400" : "text-emerald-400"}`} />
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
              <MessageSquareText size={15} className="text-slate-400" /> Thông báo bảo trì
              <span className="text-orange-500">*</span>
            </label>
            <textarea
              className={`${inputCls} min-h-[88px] resize-y`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vd: SkillSprint đang nâng cấp hệ thống, dự kiến hoàn tất lúc 23:00. Cảm ơn bạn đã kiên nhẫn!"
              disabled={saving}
            />
            <span className="text-xs text-slate-400">Nội dung hiển thị cho người dùng trên trang bảo trì.</span>
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

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-slate-100 mt-1">
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
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu thay đổi
              </button>
              <button
                onClick={handleDeactivate}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                {saving ? "Đang tắt..." : "Tắt bảo trì"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSystemStatus;
