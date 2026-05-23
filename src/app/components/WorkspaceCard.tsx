import { useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Clock3, MoreHorizontal, PencilLine, Trash2, FileText, ListTodo } from "lucide-react";

export type WorkspaceCardProps = {
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

  const safeProgress = useMemo(() => {
    if (!Number.isFinite(progress)) return 0;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }, [progress]);

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
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-800">{title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {formatDate(createdAt)}
              </span>
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
          <div className="mt-1 text-sm font-semibold text-slate-800">{totalDocuments} tài liệu</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <ListTodo className="h-3.5 w-3.5 text-amber-500" />
            Công việc
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{totalTasks} công việc</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-1 col-span-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Clock3 className="h-3.5 w-3.5 text-orange-500" />
            Hoàn thành
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{safeProgress}% roadmap</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tiến độ học tập</span>
          <span className="font-medium text-slate-600">{safeProgress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
            style={{ width: `${safeProgress}%` }}
          />
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
