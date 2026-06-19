import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  TrendingUp,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  LayoutGrid,
  Sparkles,
  Info,
  Check,
  Flag,
  Award,
  ShieldCheck,
  ArrowUpRight,
  Settings,
  Zap,
  Flame,
  type LucideIcon,
} from "lucide-react";
import {
  getAdminUserPointSummary,
  getAdminUserPointEvents,
  type AdminUserPointSummaryResponse,
  type AdminPointEventResponse,
  type AdminPointEventType,
  type PageResponse,
} from "../../../../../api/admin/adminPointService";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Badge } from "../../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { formatDate } from "./pointPresentation";

const PAGE_SIZE = 15;
const ALL_TYPES = "ALL";
const ALL_WORKSPACES = "ALL";

type WorkspaceOption = { id: string; name: string };

const EVENT_TYPE_OPTIONS: { value: AdminPointEventType; label: string }[] = [
  { value: "TASK_COMPLETED", label: "Hoàn thành task" },
  { value: "ROADMAP_STEP_COMPLETED", label: "Hoàn thành bước" },
  { value: "ROADMAP_COMPLETED", label: "Hoàn thành lộ trình" },
  { value: "QUIZ_PASSED", label: "Quiz đạt" },
  { value: "QUIZ_EXCELLENT", label: "Quiz xuất sắc" },
  { value: "ADMIN_ADJUSTMENT", label: "Điều chỉnh thủ công" },
];

type EventVisuals = {
  label: string;
  badgeClass: string;
  icon: LucideIcon;
  iconClass: string;
  nodeClass: string;
  cardClass: string;
  stripeClass: string;
  pointsClass: string;
};

const EVENT_VISUALS: Record<string, EventVisuals> = {
  TASK_COMPLETED: {
    label: "Hoàn thành task",
    badgeClass: "bg-blue-50/70 text-blue-700 border-blue-200/40",
    icon: Check,
    iconClass: "text-blue-500",
    nodeClass: "bg-white border-2 border-blue-500 text-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.1)]",
    cardClass: "bg-gradient-to-r from-blue-50/20 via-slate-50/5 to-white hover:from-blue-50/40 hover:via-slate-50/10 hover:to-white border-slate-200/60 hover:border-blue-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.03)]",
    stripeClass: "bg-blue-500/80",
    pointsClass: "text-blue-700 bg-blue-50/70 border border-blue-200/50",
  },
  ROADMAP_STEP_COMPLETED: {
    label: "Hoàn thành bước",
    badgeClass: "bg-violet-50/70 text-violet-750 border-violet-200/40",
    icon: Flag,
    iconClass: "text-violet-500",
    nodeClass: "bg-white border-2 border-violet-500 text-violet-500 shadow-[0_2px_8px_rgba(139,92,246,0.1)]",
    cardClass: "bg-gradient-to-r from-violet-50/20 via-slate-50/5 to-white hover:from-violet-50/40 hover:via-slate-50/10 hover:to-white border-slate-200/60 hover:border-violet-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(139,92,246,0.03)]",
    stripeClass: "bg-violet-500/80",
    pointsClass: "text-violet-700 bg-violet-50/70 border border-violet-200/50",
  },
  ROADMAP_COMPLETED: {
    label: "Hoàn thành lộ trình",
    badgeClass: "bg-orange-50 text-orange-850 border-orange-200/50",
    icon: Award,
    iconClass: "text-white",
    nodeClass: "bg-gradient-to-br from-[#FF6B00] to-orange-500 border border-orange-400 text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)] animate-pulse",
    cardClass: "bg-gradient-to-r from-orange-50/40 via-amber-50/25 to-white border-orange-250 hover:border-orange-350 shadow-[0_4px_20px_rgba(255,107,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)]",
    stripeClass: "bg-gradient-to-b from-[#FF6B00] to-orange-500 shadow-[0_0_8px_rgba(255,107,0,0.2)]",
    pointsClass: "text-white bg-gradient-to-r from-[#FF6B00] to-orange-500 border border-orange-400 shadow-sm",
  },
  QUIZ_PASSED: {
    label: "Quiz đạt",
    badgeClass: "bg-emerald-50/70 text-emerald-700 border-emerald-200/40",
    icon: ShieldCheck,
    iconClass: "text-emerald-500",
    nodeClass: "bg-white border-2 border-emerald-500 text-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.1)]",
    cardClass: "bg-gradient-to-r from-emerald-50/20 via-slate-50/5 to-white hover:from-emerald-50/40 hover:via-slate-50/10 hover:to-white border-slate-200/60 hover:border-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.03)]",
    stripeClass: "bg-emerald-500/80",
    pointsClass: "text-emerald-700 bg-emerald-50/70 border border-emerald-200/50",
  },
  QUIZ_EXCELLENT: {
    label: "Quiz xuất sắc",
    badgeClass: "bg-amber-50 text-amber-850 border-amber-200/50",
    icon: Zap,
    iconClass: "text-white",
    nodeClass: "bg-gradient-to-br from-amber-500 to-yellow-500 border border-amber-400 text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
    cardClass: "bg-gradient-to-r from-amber-50/40 via-yellow-50/25 to-white border-amber-250 hover:border-amber-350 shadow-[0_4px_20px_rgba(245,158,11,0.03)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]",
    stripeClass: "bg-gradient-to-b from-amber-500 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
    pointsClass: "text-white bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-400 shadow-sm",
  },
  QUIZ_UPGRADE_BONUS: {
    label: "Thưởng nâng hạng",
    badgeClass: "bg-violet-50/70 text-violet-750 border-violet-200/40",
    icon: ArrowUpRight,
    iconClass: "text-indigo-500",
    nodeClass: "bg-white border-2 border-indigo-500 text-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.1)]",
    cardClass: "bg-gradient-to-r from-indigo-50/20 via-slate-50/5 to-white hover:from-indigo-50/40 hover:via-slate-50/10 hover:to-white border-slate-200/60 hover:border-indigo-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.03)]",
    stripeClass: "bg-indigo-500/80",
    pointsClass: "text-indigo-700 bg-indigo-50/70 border border-indigo-200/50",
  },
  ADMIN_ADJUSTMENT: {
    label: "Điều chỉnh",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    icon: Settings,
    iconClass: "text-slate-500",
    nodeClass: "bg-white border-2 border-slate-400 text-slate-400 shadow-[0_2px_8px_rgba(100,116,139,0.1)]",
    cardClass: "bg-gradient-to-r from-slate-50/20 via-slate-50/5 to-white hover:from-slate-50/40 hover:via-slate-50/10 hover:to-white border-slate-200/60 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(100,116,139,0.02)]",
    stripeClass: "bg-slate-400/80",
    pointsClass: "text-slate-700 bg-slate-50 border border-slate-250",
  },
};

function getEventVisuals(type: string): EventVisuals {
  return EVENT_VISUALS[type] ?? {
    label: type,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    icon: Zap,
    iconClass: "text-slate-500",
    nodeClass: "bg-white border-2 border-slate-400 text-slate-400",
    cardClass: "bg-slate-50/20 hover:bg-slate-100/20 border-slate-200",
    stripeClass: "bg-slate-400/80",
    pointsClass: "text-slate-700 bg-slate-50 border border-slate-250",
  };
}



function formatTimeOnly(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function rankText(rank: number | null): string {
  return rank ? `Hạng #${rank}` : "Chưa xếp hạng";
}

/* -------------------------------------------------------------------------- */
/*  StatCard Sub-Component                                                    */
/* -------------------------------------------------------------------------- */
function StatCard({
  icon,
  label,
  value,
  sub,
  glowColor,
  accentClass,
  statusDotClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  glowColor: string;
  accentClass: string;
  statusDotClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="relative overflow-hidden rounded-[26px] border border-slate-100 bg-white/80 backdrop-blur-md p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.015)] h-full min-h-[144px]"
    >
      <div className={`absolute -right-12 -bottom-12 w-28 h-28 rounded-full blur-3xl opacity-40 ${glowColor}`} />
      
      <div className="flex items-start justify-between gap-4 z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-3">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm shrink-0 ${accentClass}`}>
          {icon}
        </div>
      </div>

      <div className="z-10 mt-6 pt-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-extrabold shadow-inner">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusDotClass}`} />
          {sub}
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
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
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>([]);

  const [avatarErrored, setAvatarErrored] = useState(false);

  // Fetch summary
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

  // Fetch events
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
        setWorkspaceOptions((prev) => {
          const byId = new Map(prev.map((w) => [w.id, w]));
          for (const ev of res.items) {
            if (ev.workspaceId && ev.workspaceName && !byId.has(ev.workspaceId)) {
              byId.set(ev.workspaceId, { id: ev.workspaceId, name: ev.workspaceName });
            }
          }
          if (byId.size === prev.length) return prev;
          return Array.from(byId.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "vi")
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

  // Resolved list and values
  const activeSummary = summary;
  const items = events?.items ?? [];
  const totalPages = Math.max(1, events?.totalPages ?? 1);
  const totalElements = events?.totalItems ?? 0;
  const activeWorkspaceOptions = workspaceOptions;
  const activeLoading = eventsLoading || summaryLoading;

  // Event filter handlers
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

  const initial = activeSummary ? (activeSummary.fullName || activeSummary.email || "?").charAt(0).toUpperCase() : "?";
  const showImage = activeSummary && !!activeSummary.avatarObjectKey && !avatarErrored;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 relative pb-16 px-4 md:px-0 mt-6"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      {/* Background glowing rings */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[32px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <div className="absolute top-0 right-10 w-[450px] h-[450px] rounded-full bg-orange-500/[0.02] blur-[130px] opacity-60" />
        <div className="absolute bottom-20 left-10 w-[450px] h-[450px] rounded-full bg-blue-500/[0.03] blur-[130px] opacity-60" />
      </div>

      {/* Header Navigation Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group w-11 h-11 rounded-2xl bg-white border border-slate-200 hover:border-slate-350 flex items-center justify-center shadow-sm hover:shadow hover:bg-slate-50 transition-all duration-200 shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={16} className="text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Lịch sử tích lũy điểm
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Chi tiết nhật ký điểm thưởng của học viên
            </p>
          </div>
        </div>
      </div>

      {/* Info notice banner for empty real data */}
      {!activeLoading && (!activeSummary || items.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-50/70 border border-amber-200/50 p-5 rounded-3xl shadow-[0_4px_25px_-8px_rgba(245,158,11,0.15)]"
        >
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-amber-800">Không tìm thấy dữ liệu thực tế</h4>
            <p className="text-xs text-amber-700 font-semibold leading-relaxed">
              Học viên này chưa có dữ liệu điểm thực tế trong cơ sở dữ liệu hệ thống.
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid Dashboard Header: Profile Card + 3 Stats Cards */}
      {!activeLoading && activeSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Profile Card (Left 1/3) */}
          <div className="md:col-span-1 relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between min-h-[144px]">
            <div className="flex items-center gap-4">
              {showImage ? (
                <div className="relative p-[2px] rounded-[22px] bg-gradient-to-br from-[#FF6B00]/30 to-blue-500/10 shrink-0">
                  <img
                    src={activeSummary.avatarObjectKey ?? undefined}
                    alt={activeSummary.fullName}
                    className="w-16 h-16 rounded-[20px] object-cover border border-white bg-white shrink-0"
                    onError={() => setAvatarErrored(true)}
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-2xl text-white shrink-0 relative overflow-hidden shadow-[0_8px_20px_-4px_rgba(15,23,42,0.15)] border border-slate-100"
                  style={{
                    background: "linear-gradient(135deg, #334155, #1e293b)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                  {initial}
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-slate-800 tracking-tight truncate max-w-[180px]">
                    {activeSummary.fullName || "Chưa cập nhật tên"}
                  </h2>
                  <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider">
                    HỌC VIÊN
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold truncate max-w-[180px]">{activeSummary.email}</p>
              </div>
            </div>

            {activeSummary.streakDays > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-[10px] font-black text-[#FF6B00] px-3 py-1 rounded-xl w-max mt-4 shadow-inner">
                <Flame size={13} className="fill-orange-400 text-[#FF6B00] animate-pulse" />
                <span>Chuỗi {activeSummary.streakDays} ngày liên tục</span>
              </div>
            )}
          </div>

          {/* Stat Cards (Right 2/3) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Coins size={20} className="text-blue-500" />}
              label="Tổng điểm tích lũy"
              value={`${activeSummary.totalPoints.toLocaleString("vi-VN")} XP`}
              sub={rankText(activeSummary.allTimeRank)}
              glowColor="bg-blue-500"
              accentClass="bg-blue-50 text-blue-600 border border-blue-200/30"
              statusDotClass="bg-blue-500"
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-[#FF6B00]" />}
              label="Điểm tích lũy tuần"
              value={`${activeSummary.weeklyPoints.toLocaleString("vi-VN")} XP`}
              sub={rankText(activeSummary.weeklyRank)}
              glowColor="bg-orange-500"
              accentClass="bg-orange-50 text-[#FF6B00] border border-orange-200/50"
              statusDotClass="bg-orange-500"
            />
            <StatCard
              icon={<CalendarRange size={20} className="text-violet-500" />}
              label="Điểm tích lũy tháng"
              value={`${activeSummary.monthlyPoints.toLocaleString("vi-VN")} XP`}
              sub={rankText(activeSummary.monthlyRank)}
              glowColor="bg-violet-500"
              accentClass="bg-violet-50 text-violet-600 border border-violet-200/40"
              statusDotClass="bg-violet-500"
            />
          </div>
        </div>
      )}

      {/* Skeletons when Loading */}
      {activeLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="md:col-span-1 h-[144px] rounded-[28px]" />
          <div className="md:col-span-2 grid grid-cols-3 gap-5">
            <Skeleton className="h-[144px] rounded-[26px]" />
            <Skeleton className="h-[144px] rounded-[26px]" />
            <Skeleton className="h-[144px] rounded-[26px]" />
          </div>
        </div>
      )}

      {/* Unified Activity Logs Panel Container */}
      <div className="rounded-[28px] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.01)] p-6">
        
        {/* Filters Capsule */}
        <div className="flex flex-wrap items-end gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 mr-2 mb-2.5 shrink-0">
            <Filter size={13} className="text-[#FF6B00]" /> Lọc sự kiện
          </div>
          
          <div className="flex flex-col gap-1 min-w-[170px] flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Loại sự kiện</label>
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-xs font-semibold h-10 px-3.5 cursor-pointer shadow-sm">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border border-slate-150">
                <SelectItem value={ALL_TYPES}>Tất cả loại sự kiện</SelectItem>
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-w-[195px] flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Workspace</label>
            <Select value={selectedWorkspaceId} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-xs font-semibold h-10 px-3.5 cursor-pointer shadow-sm">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <LayoutGrid size={13} className="text-slate-400 shrink-0" />
                  <SelectValue placeholder="Tất cả Workspace" />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border border-slate-150">
                <SelectItem value={ALL_WORKSPACES}>Tất cả Workspace</SelectItem>
                {activeWorkspaceOptions.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 w-[145px] shrink-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Từ ngày</label>
            <Input type="date" value={from} onChange={handleFromChange} max={to || undefined} className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-xs font-semibold h-10 px-3.5 cursor-pointer shadow-sm" />
          </div>

          <div className="flex flex-col gap-1 w-[145px] shrink-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Đến ngày</label>
            <Input type="date" value={to} onChange={handleToChange} min={from || undefined} className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-xs font-semibold h-10 px-3.5 cursor-pointer shadow-sm" />
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
              className="rounded-xl text-xs font-black text-slate-500 hover:text-red-500 hover:bg-red-50/50 mb-0.5 border border-transparent hover:border-red-100 cursor-pointer h-10 px-3.5"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Timeline Event Feed Stream */}
        <div className="relative mt-8">
          <div className="space-y-6 z-10 relative">
            {activeLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`sk-${i}`} className="flex flex-row gap-4 items-stretch group relative">
                  {/* Left Column Skeleton */}
                  <div className="hidden md:flex w-24 flex-col items-end pr-2 pt-3 shrink-0 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                  {/* Middle Column Skeleton */}
                  <div className="w-8 flex flex-col items-center shrink-0 relative">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-100" />
                    <Skeleton className="w-7 h-7 rounded-full z-10 border-2 border-white" />
                  </div>
                  {/* Right Column Skeleton */}
                  <div className="flex-1 pb-6">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-20 rounded" />
                          <Skeleton className="h-4 w-32 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-7 w-16 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}

            {!activeLoading && items.length === 0 && (
              <div className="py-16 text-center">
                <AlertTriangle size={32} className="mx-auto text-slate-300" />
                <h4 className="text-sm font-extrabold text-slate-700 mt-2">Không tìm thấy lịch sử điểm</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">Không có sự kiện tích lũy điểm nào khớp với bộ lọc hiện tại.</p>
              </div>
            )}

            {!activeLoading &&
              items.map((event, idx) => {
                const visuals = getEventVisuals(event.eventType);
                const positive = event.points >= 0;
                
                // Determine if this specific event is a major milestone
                const isMilestone = event.eventType === "ROADMAP_COMPLETED" || event.eventType === "QUIZ_EXCELLENT" || Math.abs(event.points) >= 250;
                
                // Dynamic visual styling classes depending on milestone status
                const cardClass = isMilestone
                  ? "bg-gradient-to-r from-orange-50/40 via-amber-50/25 to-white border-orange-250 hover:border-orange-350 shadow-[0_4px_20px_rgba(255,107,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)]"
                  : visuals.cardClass;

                const stripeClass = isMilestone
                  ? "bg-gradient-to-b from-[#FF6B00] to-orange-500 shadow-[0_0_8px_rgba(255,107,0,0.2)]"
                  : visuals.stripeClass;

                const pointsClass = isMilestone
                  ? (positive
                      ? "text-white bg-gradient-to-r from-[#FF6B00] to-orange-500 border border-orange-400 shadow-sm"
                      : "text-white bg-rose-600 border border-rose-500 shadow-sm")
                  : (positive
                      ? visuals.pointsClass
                      : "text-rose-700 bg-rose-50 border border-rose-200/50");

                const nodeClass = isMilestone
                  ? "bg-gradient-to-br from-[#FF6B00] to-orange-500 border border-orange-400 text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)] scale-110"
                  : visuals.nodeClass;

                const iconClass = isMilestone
                  ? "text-white"
                  : visuals.iconClass;

                const nodeIcon = isMilestone
                  ? (event.eventType === "ROADMAP_COMPLETED" ? Award : Sparkles)
                  : visuals.icon;

                const NodeIcon = nodeIcon;

                return (
                  <motion.div
                    key={`${event.sourceId}-${event.createdAt}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                    className="flex flex-row items-stretch gap-4 group relative"
                  >
                    {/* Left Column: Time & Date (Desktop) */}
                    <div className="hidden md:flex w-24 flex-col items-end justify-start pt-3 pr-2 text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-500">{formatDate(event.createdAt)}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{formatTimeOnly(event.createdAt)}</span>
                    </div>

                    {/* Middle Column: Timeline node and connector line */}
                    <div className="w-8 flex flex-col items-center justify-start shrink-0 relative">
                      {/* Vertical connector line */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-200 group-first:top-3 group-last:bottom-auto group-last:h-6 pointer-events-none" />
                      {/* Circular icon node */}
                      <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center z-10 shadow-sm transition-transform duration-200 group-hover:scale-110 shrink-0 ${nodeClass}`}>
                        <NodeIcon size={11} className={iconClass} />
                      </div>
                    </div>

                    {/* Right Column: Main Activity Card */}
                    <div className="flex-1 pb-6">
                      <div 
                        className={`relative overflow-hidden transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 pl-6 rounded-2xl border ${cardClass}`}
                      >
                        {/* Left vertical accent stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${stripeClass}`} />

                        {/* Event Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Date & Time stack (Mobile only) */}
                          <div className="flex md:hidden items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <CalendarDays size={11} className="text-slate-350 shrink-0" />
                            <span>{formatDate(event.createdAt)}</span>
                            <span className="text-slate-300">•</span>
                            <span>{formatTimeOnly(event.createdAt)}</span>
                          </div>

                          {/* Event description */}
                          <h4 className={`tracking-tight leading-relaxed group-hover:text-slate-900 transition-colors flex items-center gap-1.5 flex-wrap ${
                            isMilestone
                              ? "text-slate-900 text-[14px] font-black"
                              : "text-slate-800 text-xs sm:text-sm font-semibold"
                          }`}>
                            {isMilestone && (
                              <Sparkles size={14} className="text-[#FF6B00] animate-pulse shrink-0 mr-0.5" />
                            )}
                            <span>{event.description || "—"}</span>
                          </h4>

                          {/* Badge Meta-row */}
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {/* Event Type Badge */}
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isMilestone
                                ? "bg-orange-50 text-[#FF6B00] border-orange-200/40"
                                : visuals.badgeClass
                            }`}>
                              <NodeIcon size={9} className="shrink-0" />
                              {visuals.label}
                            </span>

                            {/* Workspace Badge */}
                            {event.workspaceName && (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                <LayoutGrid size={9} className="text-slate-400 shrink-0" />
                                {event.workspaceName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Points Column */}
                        <div className="shrink-0 flex items-center justify-end sm:pl-4">
                          <span
                            className={`inline-flex items-center gap-0.5 font-black text-xs px-3.5 py-1.5 rounded-xl shrink-0 ${pointsClass}`}
                          >
                            {positive ? "+" : "−"}
                            {Math.abs(event.points).toLocaleString("vi-VN")}{" "}
                            <span className={`text-[9px] font-bold ml-0.5 ${isMilestone ? "text-orange-100" : "text-slate-400"}`}>XP</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Pagination wrapper inside feed */}
        {!activeLoading && items.length > 0 && (
          <div className="flex items-center justify-between gap-4 flex-wrap mt-6 pt-4 border-t border-slate-100 bg-white">
            <span className="text-xs font-bold text-slate-500">
              Trang {page + 1} / {totalPages} · {totalElements.toLocaleString("vi-VN")} sự kiện
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0 || activeLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-xl text-xs font-bold border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft size={14} /> Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages || activeLoading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl text-xs font-bold border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                Tiếp <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
