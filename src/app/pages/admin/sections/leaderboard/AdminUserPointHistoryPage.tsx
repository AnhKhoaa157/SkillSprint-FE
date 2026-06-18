import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft, Trophy, Flame, CalendarDays, Coins, TrendingUp, CalendarRange,
  ChevronLeft, ChevronRight, Filter, AlertTriangle, LayoutGrid,
} from "lucide-react";
import {
  getAdminUserPointSummary,
  getAdminUserPointEvents,
  type AdminUserPointSummaryResponse,
  type AdminPointEventResponse,
  type AdminPointEventType,
  type PageResponse,
} from "../../../../../api/admin/adminPointService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Skeleton } from "../../../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { eventTypeMeta, formatDate, formatDateTime } from "./pointPresentation";

const PAGE_SIZE = 15;
const ALL_TYPES = "ALL";
const ALL_WORKSPACES = "ALL";

type WorkspaceOption = { id: string; name: string };

const EVENT_TYPE_OPTIONS: { value: AdminPointEventType; label: string }[] = [
  { value: "TASK_COMPLETED", label: "Hoàn thành task" },
  { value: "ROADMAP_STEP_COMPLETED", label: "Hoàn thành bước" },
  { value: "ROADMAP_COMPLETED", label: "Hoàn thành roadmap" },
  { value: "QUIZ_PASSED", label: "Quiz đạt" },
  { value: "QUIZ_EXCELLENT", label: "Quiz xuất sắc" },
  { value: "QUIZ_UPGRADE_BONUS", label: "Thưởng nâng hạng" },
  { value: "ADMIN_ADJUSTMENT", label: "Điều chỉnh thủ công" },
];

/* -------------------------------------------------------------------------- */
/*  Summary cards                                                             */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}14`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">
          {label}
          {sub ? <span className="text-slate-400"> · {sub}</span> : null}
        </p>
      </div>
    </div>
  );
}

function rankText(rank: number | null): string {
  return rank ? `Hạng #${rank}` : "Chưa xếp hạng";
}

function SummarySection({
  summary,
  loading,
}: {
  summary: AdminUserPointSummaryResponse | null;
  loading: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const initial = (summary.fullName || summary.email || "?").charAt(0).toUpperCase();
  const showImage = !!summary.avatarObjectKey && !errored;

  return (
    <div className="space-y-4">
      {/* User identity banner */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex items-center gap-4">
        {showImage ? (
          <img
            src={summary.avatarObjectKey ?? undefined}
            alt={summary.fullName}
            className="w-14 h-14 rounded-2xl object-cover shrink-0"
            onError={() => setErrored(true)}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}
          >
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-900 truncate">
            {summary.fullName || "Chưa cập nhật tên"}
          </h2>
          <p className="text-sm text-slate-500 truncate">{summary.email}</p>
          {summary.streakDays > 0 && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-600">
              <Flame size={12} className="fill-amber-400 text-amber-500" /> Chuỗi {summary.streakDays} ngày
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Coins size={18} />}
          label="Tổng điểm"
          value={summary.totalPoints.toLocaleString("vi-VN")}
          sub={rankText(summary.allTimeRank)}
          accent="#FF6B00"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Điểm tuần"
          value={summary.weeklyPoints.toLocaleString("vi-VN")}
          sub={rankText(summary.weeklyRank)}
          accent="#16A34A"
        />
        <StatCard
          icon={<CalendarRange size={18} />}
          label="Điểm tháng"
          value={summary.monthlyPoints.toLocaleString("vi-VN")}
          sub={rankText(summary.monthlyRank)}
          accent="#7C3AED"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminUserPointHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = id ?? "";

  const [summary, setSummary] = useState<AdminUserPointSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(ALL_WORKSPACES);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<PageResponse<AdminPointEventResponse> | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  // Accumulates every distinct workspace seen across fetches so the dropdown
  // keeps its full option list even after results are narrowed by a filter.
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>([]);

  // Summary (section 1)
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setSummaryLoading(true);
    getAdminUserPointSummary(userId)
      .then((res) => {
        if (active) setSummary(res);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSummary(null);
        toast.error(err instanceof Error ? err.message : "Không thể tải tổng quan điểm");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // History (section 2) — refetch on any filter / page change.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setEventsLoading(true);
    getAdminUserPointEvents(userId, {
      type: typeFilter === ALL_TYPES ? "" : (typeFilter as AdminPointEventType),
      from: from || undefined,
      to: to || undefined,
      workspaceId: selectedWorkspaceId === ALL_WORKSPACES ? undefined : selectedWorkspaceId,
      page,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (!active) return;
        setEvents(res);
        // Merge any newly-seen workspaces into the cumulative option list.
        setWorkspaceOptions((prev) => {
          const byId = new Map(prev.map((w) => [w.id, w]));
          for (const ev of res.items) {
            if (ev.workspaceId && ev.workspaceName && !byId.has(ev.workspaceId)) {
              byId.set(ev.workspaceId, { id: ev.workspaceId, name: ev.workspaceName });
            }
          }
          if (byId.size === prev.length) return prev;
          return Array.from(byId.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "vi"),
          );
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setEvents(null);
        toast.error(err instanceof Error ? err.message : "Không thể tải lịch sử điểm");
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, typeFilter, from, to, selectedWorkspaceId, page]);

  const items = events?.items ?? [];
  const totalPages = Math.max(1, events?.totalPages ?? 1);

  const handleTypeChange = (value: string): void => {
    setTypeFilter(value);
    setPage(0);
  };
  const handleWorkspaceChange = (value: string): void => {
    setSelectedWorkspaceId(value);
    setPage(0);
  };
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFrom(e.target.value);
    setPage(0);
  };
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTo(e.target.value);
    setPage(0);
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#F1F5F9", fontFamily: "'Inter',sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* Section 1 — overview */}
        <SummarySection summary={summary} loading={summaryLoading} />

        {/* Section 2 — history */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 flex flex-col md:flex-row md:items-end gap-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 md:mr-1 md:mb-2">
              <Filter size={13} /> Lọc
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500">Loại sự kiện</label>
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px] rounded-xl bg-slate-50">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TYPES}>Tất cả</SelectItem>
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500">Workspace</label>
              <Select value={selectedWorkspaceId} onValueChange={handleWorkspaceChange}>
                <SelectTrigger className="w-[200px] rounded-xl bg-slate-50">
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <LayoutGrid size={13} className="text-slate-400 shrink-0" />
                    <SelectValue placeholder="Tất cả Workspace" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_WORKSPACES}>Tất cả Workspace</SelectItem>
                  {workspaceOptions.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500">Từ ngày</label>
              <Input type="date" value={from} onChange={handleFromChange} max={to || undefined} className="w-[150px] rounded-xl bg-slate-50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500">Đến ngày</label>
              <Input type="date" value={to} onChange={handleToChange} min={from || undefined} className="w-[150px] rounded-xl bg-slate-50" />
            </div>
            {(typeFilter !== ALL_TYPES || selectedWorkspaceId !== ALL_WORKSPACES || from || to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter(ALL_TYPES);
                  setSelectedWorkspaceId(ALL_WORKSPACES);
                  setFrom("");
                  setTo("");
                  setPage(0);
                }}
                className="rounded-xl text-slate-500 md:mb-0.5"
              >
                Xóa lọc
              </Button>
            )}
          </div>

          {/* History table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại sự kiện</TableHead>
                <TableHead className="text-right">Điểm</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Workspace</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))}

              {!eventsLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm text-slate-400">
                    <AlertTriangle size={20} className="mx-auto mb-2 text-slate-300" />
                    Không có sự kiện điểm nào khớp bộ lọc.
                  </TableCell>
                </TableRow>
              )}

              {!eventsLoading &&
                items.map((event, idx) => {
                  const meta = eventTypeMeta(event.eventType);
                  const positive = event.points >= 0;
                  return (
                    <TableRow key={`${event.sourceId}-${event.createdAt}-${idx}`}>
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-slate-400" />
                          {formatDateTime(event.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-semibold ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-extrabold whitespace-nowrap">
                        <span style={{ color: positive ? "#16A34A" : "#DC2626" }}>
                          {positive ? "+" : "−"}
                          {Math.abs(event.points).toLocaleString("vi-VN")} XP
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[260px]">
                        <span className="block truncate" title={event.description}>{event.description || "—"}</span>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {event.workspaceName ? (
                          <span className="truncate block max-w-[160px]">{event.workspaceName}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 bg-slate-50/60">
            <span className="text-xs text-slate-500">
              Trang {page + 1} / {totalPages}
              {events ? ` · ${events.totalItems.toLocaleString("vi-VN")} sự kiện` : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0 || eventsLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg"
              >
                <ChevronLeft size={14} /> Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages || eventsLoading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg"
              >
                Tiếp <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
