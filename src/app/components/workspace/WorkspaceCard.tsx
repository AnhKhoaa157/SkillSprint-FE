import { useEffect, useMemo, useState } from "react";
import { ArrowRight, AlertTriangle, BookOpenCheck, Clock3, MoreHorizontal, PencilLine, Trash2, FileText, ListTodo } from "lucide-react";
import materialService from "../../../api/materialService";
import progressService, { type ProgressDashboardResponse } from "../../../api/progressService";

export type WorkspaceCardProps = {
  workspaceId: string;
  title: string;
  description?: string | null;
  totalDocuments?: number;
  totalTasks?: number;
  progress?: number;
  createdAt?: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatDate(createdAt?: string) {
  if (!createdAt) return "Chưa có ngày tạo";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày tạo";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WorkspaceCard({
  workspaceId,
  title,
  description,
  totalDocuments = 0,
  totalTasks = 0,
  progress = 0,
  createdAt,
  onOpen,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [materialCount, setMaterialCount] = useState<number | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const safeProgress = useMemo(() => {
    const value = progressPercent ?? progress;
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [progress, progressPercent]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      if (!workspaceId) {
        setMaterialCount(null);
        setTaskCount(null);
        setProgressPercent(null);
        return;
      }

      setLoadingStats(true);

      try {
        const [progressResult, materialsResult] = await Promise.allSettled([
          progressService.getProgressDashboard(workspaceId),
          materialService.getMaterials(workspaceId),
        ]);

        if (!mounted) return;

        if (progressResult.status === "fulfilled") {
          const dashboard = progressResult.value;
          setTaskCount(dashboard?.totalTasks ?? null);
          if (dashboard) {
            const rp = dashboard.progressPercent;
            setProgressPercent((typeof rp === 'number' && !isNaN(rp)) ? rp : 0);
          } else {
            setProgressPercent(null);
          }
        } else {
          setTaskCount(null);
          setProgressPercent(null);
        }

        if (materialsResult.status === "fulfilled") {
          setMaterialCount(materialsResult.value.length);
        } else {
          setMaterialCount(null);
        }
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const documentsLabel = loadingStats ? "..." : `${materialCount ?? totalDocuments} tài liệu`;
  const tasksLabel = loadingStats ? "..." : `${taskCount ?? totalTasks} công việc`;
  const progressLabel = loadingStats ? "..." : `${safeProgress}% roadmap`;
  const todayTaskCount = 0;
  const overdueTaskCount = 0;

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-[#FDFCF9]/90 p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF7E21]/30 hover:shadow-[0_15px_30px_-10px_rgba(255,126,33,0.08),0_4px_12px_-5px_rgba(255,126,33,0.04)]"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Background visual light flares on card hover */}
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-[#FF7E21]/6 via-[#FFD29D]/2 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100 pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-tr from-amber-500/2 via-transparent to-transparent blur-xl pointer-events-none" />
      
      <div className="relative">
        {/* Header content */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF9F5] to-[#FFEFE0] border border-orange-200/50 text-[#FF7E21] shadow-[inset_0_1.5px_3px_rgba(255,126,33,0.04)] transition-all duration-300 group-hover:from-[#FF8C37] group-hover:to-[#FF6B00] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_16px_-4px_rgba(255,126,33,0.35)] group-hover:scale-105">
              <BookOpenCheck className="h-6 w-6" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-extrabold text-slate-800 transition-colors duration-200 group-hover:text-[#FF7E21]">{title}</h3>
                <span className="rounded-full bg-slate-50 border border-slate-200/40 px-2 py-0.5 text-[10px] font-bold text-slate-500/80 backdrop-blur-sm">{formatDate(createdAt)}</span>
                {todayTaskCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold text-[#FF7E21] ring-1 ring-[#FFEDD5]">
                    <Clock3 className="h-3 w-3" />
                    {todayTaskCount} hôm nay
                  </span>
                )}
                {overdueTaskCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-100">
                    <AlertTriangle className="h-3 w-3" />
                    {overdueTaskCount} quá hạn
                  </span>
                )}
              </div>
              <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-slate-500/90 font-medium">
                {description || "Workspace dùng để gom tài liệu, phân tích nội dung và sinh roadmap học tập bằng AI."}
              </p>
            </div>
          </div>

          <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#FF7E21]/35 hover:bg-[#FFF7ED]/30 hover:text-[#FF7E21] shadow-sm"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Workspace actions"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <PencilLine className="h-4 w-4 text-slate-400" />
                  Sửa tên
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clean, professional horizontal stats badges with color coordinates */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100/80 pt-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-1.5 text-xs font-bold text-blue-700 transition-all duration-200 hover:bg-blue-50/60 hover:scale-102">
            <FileText className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />
            <span>{documentsLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-1.5 text-xs font-bold text-violet-700 transition-all duration-200 hover:bg-violet-50/60 hover:scale-102">
            <ListTodo className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
            <span>{tasksLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-1.5 text-xs font-bold text-[#FF7E21] transition-all duration-200 hover:bg-orange-50/60 hover:scale-102">
            <Clock3 className="h-3.5 w-3.5 text-[#FF7E21]" strokeWidth={2} />
            <span>{progressLabel}</span>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Tiến độ học tập</span>
            <span className="font-black text-[#FF7E21]">{loadingStats ? "..." : `${safeProgress}%`}</span>
          </div>
          <div className="relative h-2 w-full rounded-full bg-slate-100 border border-slate-200/20 p-[1px]">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#FF7E21] to-[#FF4D00] shadow-[0_1.5px_4px_rgba(255,126,33,0.25)] transition-all duration-500" 
              style={{ width: `${safeProgress}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Footer link style action */}
      <div className="mt-5 flex items-center justify-end border-t border-slate-100/50 pt-3.5">
        <span className="inline-flex items-center gap-1 text-xs font-black text-[#FF7E21] transition-all duration-300 group-hover:text-[#E05300] group-hover:translate-x-0.5">
          Truy cập học tập
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </article>
  );
}
