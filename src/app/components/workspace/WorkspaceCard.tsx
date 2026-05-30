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
          setProgressPercent(dashboard?.progressPercent ?? null);
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
      className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-500 ring-1 ring-orange-500/10">
            <BookOpenCheck className="h-6 w-6" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-800">{title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{formatDate(createdAt)}</span>
              {todayTaskCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-100">
                  <Clock3 className="h-3 w-3" />
                  {todayTaskCount} hôm nay
                </span>
              )}
              {overdueTaskCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueTaskCount} quá hạn
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
              {description || "Workspace dùng để gom tài liệu, phân tích nội dung và sinh roadmap học tập bằng AI."}
            </p>
          </div>
        </div>

        <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Workspace actions"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={2.25} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <PencilLine className="h-4 w-4" />
                Sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <FileText className="h-3.5 w-3.5 text-orange-500" />
            Tài liệu
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{documentsLabel}</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <ListTodo className="h-3.5 w-3.5 text-amber-500" />
            Công việc
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{tasksLabel}</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-1 col-span-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Clock3 className="h-3.5 w-3.5 text-orange-500" />
            Hoàn thành
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{progressLabel}</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tiến độ học tập</span>
          <span className="font-medium text-slate-600">{loadingStats ? "..." : `${safeProgress}%`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300" style={{ width: `${safeProgress}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 transition hover:text-orange-600"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          Truy cập
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}
