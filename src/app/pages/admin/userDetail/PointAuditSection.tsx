import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Coins, Plus, Minus, Ban, ShieldCheck, History, RefreshCw, AlertTriangle } from "lucide-react";
import { itemVariants } from "./components";
import { formatDateTime } from "./config";
import {
  getPointHistory,
  adjustUserPoints,
  toggleLeaderboardBan,
} from "../../../../api/learning/pointService";
import type { PointHistoryLog } from "../../../../api/core/skillSprintModels";
import { AdjustPointsModal } from "../../../components/modals/AdjustPointsModal";
import { LeaderboardBanModal } from "../../../components/modals/LeaderboardBanModal";

type LoadState = "loading" | "error" | "ready";

export function PointAuditSection({
  userId,
  userName,
  initialBanned,
}: {
  userId: string;
  userName: string;
  initialBanned: boolean;
}) {
  const [logs, setLogs] = useState<PointHistoryLog[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [banned, setBanned] = useState(initialBanned);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  useEffect(() => setBanned(initialBanned), [initialBanned]);

  const loadHistory = (): void => {
    setState("loading");
    getPointHistory(userId)
      .then((rows) => {
        setLogs(rows);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleAdjust = async (scoreDelta: number, reason: string): Promise<void> => {
    try {
      await adjustUserPoints(userId, { scoreDelta, reason });
      toast.success("Điều chỉnh điểm thành công");
      // Tell the header XP pill (and any listeners) to refresh.
      window.dispatchEvent(new Event("skillSprint:points-updated"));
      loadHistory();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Lỗi điều chỉnh điểm";
      toast.error(message);
      throw e; // keep the modal open
    }
  };

  const handleBanConfirm = async (): Promise<void> => {
    const next = !banned;
    try {
      await toggleLeaderboardBan(userId, next);
      setBanned(next);
      toast.success(next ? "Đã cấm người dùng khỏi bảng xếp hạng" : "Đã gỡ cấm người dùng");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Lỗi cập nhật trạng thái cấm";
      toast.error(message);
      throw e;
    }
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm active:scale-[0.98] cursor-pointer"
            style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}
          >
            <Coins size={13} /> Điều chỉnh điểm
          </button>
          <button
            type="button"
            onClick={() => setBanOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border active:scale-[0.98] cursor-pointer transition-colors"
            style={
              banned
                ? { background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#16A34A" }
                : { background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.25)", color: "#DC2626" }
            }
          >
            {banned ? <ShieldCheck size={13} /> : <Ban size={13} />}
            {banned ? "Gỡ cấm BXH" : "Cấm khỏi BXH"}
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
          <History size={12} /> Lịch sử điều chỉnh điểm
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

        {state === "ready" && logs.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Chưa có điều chỉnh điểm thủ công nào.
          </div>
        )}

        {state === "ready" && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-bold">Thời gian</th>
                  <th className="py-2 pr-3 font-bold">Thay đổi</th>
                  <th className="py-2 pr-3 font-bold">Lý do</th>
                  <th className="py-2 font-bold">Thực hiện bởi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const positive = log.scoreDelta >= 0;
                  return (
                    <tr key={log.logId} className="border-t border-slate-100 align-top">
                      <td className="py-2.5 pr-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
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
                          {Math.abs(log.scoreDelta).toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 max-w-[240px]">{log.reason}</td>
                      {/* Denormalized — rendered straight from the row, no extra fetch. */}
                      <td className="py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        {log.adminFullName || "Hệ thống"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdjustPointsModal
        isOpen={adjustOpen}
        userName={userName}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleAdjust}
      />
      <LeaderboardBanModal
        isOpen={banOpen}
        userName={userName}
        isBanning={!banned}
        onClose={() => setBanOpen(false)}
        onConfirm={handleBanConfirm}
      />
    </motion.div>
  );
}

export default PointAuditSection;
