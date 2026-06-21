import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Coins, Plus, Minus, Ban, History, RefreshCw, AlertTriangle } from "lucide-react";
import { itemVariants } from "./components";
import { formatDateTime } from "./config";
import {
  getAdminUserPointEvents,
  type AdminPointEventResponse,
} from "../../../../api/admin/adminPointService";

type LoadState = "loading" | "error" | "ready";

export function PointAuditSection({
  userId,
  initialBanned,
}: {
  userId: string;
  userName: string;
  initialBanned: boolean;
}) {
  const [events, setEvents] = useState<AdminPointEventResponse[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [banned] = useState(initialBanned);

  const loadHistory = (): void => {
    setState("loading");
    getAdminUserPointEvents(userId, { size: 50 })
      .then((res) => {
        setEvents(res.items);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Coins size={15} className="text-orange-500" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Điểm thưởng &amp; Kiểm toán
          </h3>
        </div>
        {/* Manual point adjustment and leaderboard-ban are not exposed by the
            backend, so these controls are shown disabled rather than firing a
            request that would 404. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Tính năng điều chỉnh điểm thủ công chưa khả dụng"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
          >
            <Coins size={13} /> Điều chỉnh điểm
          </button>
          <button
            type="button"
            disabled
            title="Tính năng cấm khỏi bảng xếp hạng chưa khả dụng"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
          >
            <Ban size={13} /> Cấm khỏi BXH
          </button>
        </div>
      </div>

      {/* Banned status banner */}
      {banned && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2 text-xs font-semibold text-red-600">
          <Ban size={13} /> Người dùng đang bị cấm khỏi bảng xếp hạng.
        </div>
      )}

      {/* Audit log */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <History size={12} /> Lịch sử điểm
        </div>

        {state === "loading" && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-xs text-slate-500">
            <AlertTriangle size={20} className="text-amber-500" />
            <span>Không thể tải lịch sử điểm.</span>
            <button
              type="button"
              onClick={loadHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={12} /> Thử lại
            </button>
          </div>
        )}

        {state === "ready" && events.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Chưa có sự kiện điểm nào.
          </div>
        )}

        {state === "ready" && events.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-bold">Thời gian</th>
                  <th className="py-2 pr-3 font-bold">Thay đổi</th>
                  <th className="py-2 pr-3 font-bold">Lý do</th>
                  <th className="py-2 font-bold">Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const positive = ev.points >= 0;
                  return (
                    <tr key={`${ev.createdAt}-${i}`} className="border-t border-slate-100 align-top">
                      <td className="py-2.5 pr-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(ev.createdAt)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
                          style={
                            positive
                              ? { background: "rgba(34,197,94,0.1)", color: "#16A34A" }
                              : { background: "rgba(239,68,68,0.1)", color: "#DC2626" }
                          }
                        >
                          {positive ? <Plus size={10} /> : <Minus size={10} />}
                          {Math.abs(ev.points).toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 max-w-[240px]">
                        {ev.description || ev.eventType}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        {ev.workspaceName || "Hệ thống"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default PointAuditSection;
