import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Trophy,
  Search,
  Flame,
  ChevronLeft,
  ChevronRight,
  Medal,
  Crown,
  Users,
  Calendar,
  Info,
  ArrowRight,
  User,
  Zap,
} from "lucide-react";
import {
  getAdminLeaderboard,
  type AdminLeaderboardEntry,
  type AdminLeaderboardPeriod,
  type AdminLeaderboardResponse,
} from "../../../../../api/admin/adminPointService";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { Skeleton } from "../../../../components/ui/skeleton";
import { PERIOD_LABEL, formatDate } from "./pointPresentation";

const PERIODS: AdminLeaderboardPeriod[] = ["WEEKLY", "MONTHLY", "ALL_TIME"];
const PAGE_SIZE = 20;

// High-fidelity Mock Data for Admin Bảng điểm Preview
const MOCK_DATA_WEEKLY: AdminLeaderboardEntry[] = [
  { rank: 1, userId: "u-1", fullName: "Nguyễn Văn Đạt", email: "dat.nguyen@skillsprint.vn", avatarObjectKey: null, points: 2850, streakDays: 14, lastPointDate: new Date(Date.now() - 3600000 * 2).toISOString() },
  { rank: 2, userId: "u-2", fullName: "Lê Thị Hồng Nhung", email: "nhung.le@skillsprint.vn", avatarObjectKey: null, points: 2420, streakDays: 7, lastPointDate: new Date(Date.now() - 3600000 * 5).toISOString() },
  { rank: 3, userId: "u-3", fullName: "Trần Minh Hoàng", email: "hoang.tran@skillsprint.vn", avatarObjectKey: null, points: 2100, streakDays: 9, lastPointDate: new Date(Date.now() - 3600000 * 12).toISOString() },
  { rank: 4, userId: "u-4", fullName: "Phạm Thanh Thảo", email: "thao.pham@skillsprint.vn", avatarObjectKey: null, points: 1850, streakDays: 5, lastPointDate: new Date(Date.now() - 3600000 * 18).toISOString() },
  { rank: 5, userId: "u-5", fullName: "Vũ Chí Bảo", email: "bao.vu@skillsprint.vn", avatarObjectKey: null, points: 1650, streakDays: 4, lastPointDate: new Date(Date.now() - 3600000 * 24).toISOString() },
  { rank: 6, userId: "u-6", fullName: "Hoàng Anh Đức", email: "duc.hoang@skillsprint.vn", avatarObjectKey: null, points: 1520, streakDays: 12, lastPointDate: new Date(Date.now() - 3600000 * 30).toISOString() },
  { rank: 7, userId: "u-7", fullName: "Vũ Thị Mai", email: "mai.vu@skillsprint.vn", avatarObjectKey: null, points: 1200, streakDays: 3, lastPointDate: new Date(Date.now() - 3600000 * 42).toISOString() },
  { rank: 8, userId: "u-8", fullName: "Đỗ Gia Bảo", email: "bao.do@skillsprint.vn", avatarObjectKey: null, points: 950, streakDays: 8, lastPointDate: new Date(Date.now() - 3600000 * 48).toISOString() },
  { rank: 9, userId: "u-9", fullName: "Nguyễn Thị Lan", email: "lan.nguyen@skillsprint.vn", avatarObjectKey: null, points: 880, streakDays: 2, lastPointDate: new Date(Date.now() - 3600000 * 60).toISOString() },
  { rank: 10, userId: "u-10", fullName: "Phạm Hồng Sơn", email: "son.pham@skillsprint.vn", avatarObjectKey: null, points: 820, streakDays: 6, lastPointDate: new Date(Date.now() - 3600000 * 72).toISOString() },
  { rank: 11, userId: "u-11", fullName: "Lê Minh Tuấn", email: "tuan.le@skillsprint.vn", avatarObjectKey: null, points: 760, streakDays: 1, lastPointDate: new Date(Date.now() - 3600000 * 80).toISOString() },
  { rank: 12, userId: "u-12", fullName: "Trần Thu Thủy", email: "thuy.tran@skillsprint.vn", avatarObjectKey: null, points: 700, streakDays: 11, lastPointDate: new Date(Date.now() - 3600000 * 96).toISOString() },
  { rank: 13, userId: "u-13", fullName: "Nguyễn Văn Hùng", email: "hung.nguyen@skillsprint.vn", avatarObjectKey: null, points: 640, streakDays: 0, lastPointDate: new Date(Date.now() - 3600000 * 100).toISOString() },
  { rank: 14, userId: "u-14", fullName: "Hoàng Minh Triết", email: "triet.hoang@skillsprint.vn", avatarObjectKey: null, points: 590, streakDays: 5, lastPointDate: new Date(Date.now() - 3600000 * 110).toISOString() },
  { rank: 15, userId: "u-15", fullName: "Phan Thanh Bình", email: "binh.phan@skillsprint.vn", avatarObjectKey: null, points: 530, streakDays: 3, lastPointDate: new Date(Date.now() - 3600000 * 120).toISOString() },
  { rank: 16, userId: "u-16", fullName: "Đặng Hoàng Giang", email: "giang.dang@skillsprint.vn", avatarObjectKey: null, points: 480, streakDays: 9, lastPointDate: new Date(Date.now() - 3600000 * 130).toISOString() },
  { rank: 17, userId: "u-17", fullName: "Bùi Thị Tuyết", email: "tuyet.bui@skillsprint.vn", avatarObjectKey: null, points: 420, streakDays: 2, lastPointDate: new Date(Date.now() - 3600000 * 140).toISOString() },
  { rank: 18, userId: "u-18", fullName: "Dương Minh Khoa", email: "khoa.duong@skillsprint.vn", avatarObjectKey: null, points: 370, streakDays: 7, lastPointDate: new Date(Date.now() - 3600000 * 150).toISOString() },
  { rank: 19, userId: "u-19", fullName: "Đỗ Thị Hạnh", email: "hanh.do@skillsprint.vn", avatarObjectKey: null, points: 310, streakDays: 4, lastPointDate: new Date(Date.now() - 3600000 * 160).toISOString() },
  { rank: 20, userId: "u-20", fullName: "Nguyễn Khánh Nam", email: "nam.nguyen@skillsprint.vn", avatarObjectKey: null, points: 260, streakDays: 0, lastPointDate: new Date(Date.now() - 3600000 * 170).toISOString() },
  { rank: 21, userId: "u-21", fullName: "Lâm Gia Huy", email: "huy.lam@skillsprint.vn", avatarObjectKey: null, points: 210, streakDays: 3, lastPointDate: new Date(Date.now() - 3600000 * 180).toISOString() },
  { rank: 22, userId: "u-22", fullName: "Vương Chí Đạt", email: "dat.vuong@skillsprint.vn", avatarObjectKey: null, points: 150, streakDays: 1, lastPointDate: new Date(Date.now() - 3600000 * 190).toISOString() },
];

const MOCK_DATA_MONTHLY: AdminLeaderboardEntry[] = MOCK_DATA_WEEKLY.map((item) => ({
  ...item,
  points: item.points * 3.5,
  streakDays: Math.min(30, Math.floor(item.streakDays * 1.8)),
  lastPointDate: new Date(new Date(item.lastPointDate || "").getTime() - 3600000 * 4).toISOString(),
})).sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));

const MOCK_DATA_ALL_TIME: AdminLeaderboardEntry[] = MOCK_DATA_WEEKLY.map((item) => ({
  ...item,
  points: item.points * 12.4,
  streakDays: Math.min(100, Math.floor(item.streakDays * 5.2)),
  lastPointDate: new Date(new Date(item.lastPointDate || "").getTime() - 3600000 * 24).toISOString(),
})).sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));

const MOCK_DATA: Record<AdminLeaderboardPeriod, AdminLeaderboardEntry[]> = {
  WEEKLY: MOCK_DATA_WEEKLY,
  MONTHLY: MOCK_DATA_MONTHLY,
  ALL_TIME: MOCK_DATA_ALL_TIME,
};

/* -------------------------------------------------------------------------- */
/*  RankBadge Component                                                       */
/* -------------------------------------------------------------------------- */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.25)] border border-amber-300/30">
        <Crown size={14} className="text-white fill-white/10" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-350 to-slate-500 flex items-center justify-center shadow-[0_4px_12px_rgba(148,163,184,0.25)] border border-slate-300/30">
        <Medal size={14} className="text-white fill-white/10" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.25)] border border-orange-300/30">
        <Medal size={14} className="text-white fill-white/10" />
      </div>
    );
  }
  return (
    <span className="text-xs font-black text-slate-500 w-8 h-8 rounded-xl bg-slate-50/80 border border-slate-200/50 flex items-center justify-center shadow-inner">
      {rank}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  EntryAvatar Component                                                     */
/* -------------------------------------------------------------------------- */
function EntryAvatar({ entry }: { entry: AdminLeaderboardEntry }) {
  const [errored, setErrored] = useState(false);
  const initial = (entry.fullName || entry.email || "?").charAt(0).toUpperCase();
  const showImage = !!entry.avatarObjectKey && !errored;

  if (showImage) {
    return (
      <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#FF6B00]/30 to-blue-500/10">
        <img
          src={entry.avatarObjectKey ?? undefined}
          alt={entry.fullName}
          className="w-10 h-10 rounded-xl object-cover border border-white bg-white shrink-0"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
      style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}
    >
      {initial}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StatCard Sub-Component                                                    */
/* -------------------------------------------------------------------------- */
function StatCard({
  icon,
  label,
  value,
  subtext,
  glowColor,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  glowColor: string;
  accentClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.008 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="relative overflow-hidden rounded-[24px] border border-white bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)] h-32"
    >
      {/* Decorative inner mesh light */}
      <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-60 ${glowColor}`} />
      
      <div className="flex items-center justify-between gap-4 z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shadow-slate-100 shrink-0 ${accentClass}`}>
          {icon}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-bold z-10 flex items-center gap-1 mt-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {subtext}
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */
export default function AdminLeaderboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<AdminLeaderboardPeriod>("WEEKLY");
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  // Debounced search
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearch(localSearch.trim());
      setPage(0);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  // Fetch from backend API
  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminLeaderboard({ period, search, page, size: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setData(null);
        toast.error(err instanceof Error ? err.message : "Không thể tải bảng xếp hạng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, search, page]);

  // Resolved list and values
  const entries = data?.entries.items ?? [];
  const totalPages = Math.max(1, data?.entries.totalPages ?? 1);
  const totalElements = data?.entries.totalItems ?? 0;

  // Summary statistics for dashboard cards
  const stats = useMemo(() => {
    const currentFullList = data?.entries.items ?? [];
    const maxPoints = currentFullList.length > 0 ? Math.max(...currentFullList.map((e) => e.points)) : 0;
    const maxStreak = currentFullList.length > 0 ? Math.max(...currentFullList.map((e) => e.streakDays)) : 0;
    return {
      totalUsers: totalElements,
      maxPoints,
      maxStreak,
    };
  }, [data, totalElements]);

  const periodRange = useMemo(() => {
    if (!data?.periodStart) return null;
    return data.periodEnd ? `${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}` : formatDate(data.periodStart);
  }, [data]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalSearch(e.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 relative pb-16 px-4 md:px-0"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      {/* Background glowing rings */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[32px]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <div className="absolute top-0 right-10 w-[450px] h-[450px] rounded-full bg-blue-500/[0.04] blur-[130px] opacity-70" />
        <div className="absolute bottom-20 left-10 w-[450px] h-[450px] rounded-full bg-orange-500/[0.03] blur-[130px] opacity-70" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00]/10 to-orange-500/[0.03] border border-[#FF6B00]/20 flex items-center justify-center shadow-md shadow-orange-100/10 shrink-0">
            <Trophy size={22} className="text-[#FF6B00] fill-orange-200/10" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Quản lý bảng điểm
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Hệ thức xếp hạng học viên{periodRange ? ` · ${periodRange}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Tổng học viên xếp hạng"
          value={`${stats.totalUsers.toLocaleString("vi-VN")} người dùng`}
          subtext="Tích lũy từ dữ liệu hệ thống"
          glowColor="bg-blue-500"
          accentClass="bg-blue-50/80 text-blue-600 border border-blue-200/30"
        />
        <StatCard
          icon={<Crown className="w-5 h-5 fill-amber-500/10" />}
          label="Điểm tích lũy cao nhất"
          value={`${stats.maxPoints.toLocaleString("vi-VN")} XP`}
          subtext="Học viên xuất sắc dẫn đầu"
          glowColor="bg-amber-400"
          accentClass="bg-amber-50 text-amber-600 border border-amber-200/50"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 fill-orange-500/10" />}
          label="Chuỗi học liên tục kỷ lục"
          value={`${stats.maxStreak} ngày`}
          subtext="Học tập đều đặn hàng ngày"
          glowColor="bg-orange-500"
          accentClass="bg-orange-50 text-orange-600 border border-orange-200/50"
        />
      </div>

      {/* Toolbar inside clean glass capsule */}
      <div className="rounded-[28px] bg-white/80 border border-slate-200/50 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        {/* Period tabs */}
        <div className="flex gap-1 rounded-full border border-slate-200/70 bg-slate-50/50 p-1 w-max shrink-0">
          {PERIODS.map((p) => {
            const activeTab = p === period;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  setPage(0);
                }}
                className={`relative rounded-full px-5 py-2 text-xs font-black transition-all duration-200 cursor-pointer ${
                  activeTab ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100/40"
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm md:ml-auto w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên học viên hoặc email..."
            className="pl-10 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50/80 focus:bg-white text-xs font-semibold py-5.5 shadow-inner"
          />
        </div>
      </div>

      {/* Floating Card List UI (Replaces plain flat table) */}
      <div className="space-y-3.5">
        {/* Header row descriptor */}
        <div className="flex items-center gap-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400/80">
          <div className="w-10 text-center">Hạng</div>
          <div className="flex-1 min-w-0">Học viên</div>
          <div className="w-28 text-right hidden sm:block">XP Tích lũy</div>
          <div className="w-24 text-center hidden sm:block">Chuỗi ngày</div>
          <div className="w-40 hidden md:block">Lần cuối nhận điểm</div>
          <div className="w-12"></div>
        </div>

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-${i}`} className="h-20 rounded-2xl bg-white/70 border border-slate-100 animate-pulse flex items-center justify-between px-6 gap-4">
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-2.5 w-40 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-20 h-6 bg-slate-100 rounded-xl" />
              <div className="w-14 h-6 bg-slate-100 rounded-lg" />
              <div className="w-24 h-4 bg-slate-100 rounded" />
              <div className="w-8 h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}

        {!loading && entries.length === 0 && (
          <div className="rounded-3xl bg-white border border-slate-150 p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
            <User size={32} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-extrabold text-slate-700 mt-2">Không tìm thấy kết quả</h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">Không có học viên nào khớp với từ khóa tìm kiếm hiện tại.</p>
          </div>
        )}

        {!loading &&
          entries.map((entry) => {
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/admin/users/${encodeURIComponent(entry.userId)}/points`)}
                className="group flex items-center justify-between gap-4 px-6 py-4.5 rounded-[22px] border border-slate-200/60 bg-white/85 backdrop-blur-sm hover:bg-white hover:border-orange-200/80 hover:shadow-[0_12px_35px_-12px_rgba(255,107,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                {/* Rank column */}
                <div className="w-10 flex items-center justify-center shrink-0">
                  <RankBadge rank={entry.rank} />
                </div>

                {/* User Info Column */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <EntryAvatar entry={entry} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-800 text-sm truncate max-w-[200px]">
                        {entry.fullName || "Học viên ẩn danh"}
                      </p>
                      <span className="shrink-0 bg-slate-50 border border-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider">
                        HỌC VIÊN
                      </span>
                    </div>
                    <p className="text-slate-400 font-semibold text-xs truncate max-w-[200px] mt-0.5">{entry.email}</p>
                  </div>
                </div>

                {/* XP Column */}
                <div className="w-28 text-right shrink-0 sm:block hidden">
                  <span className="inline-flex items-center gap-1 font-extrabold text-blue-600 text-xs bg-blue-50/60 px-3.5 py-1.5 rounded-xl border border-blue-100/30 shadow-sm shadow-blue-50/40">
                    <Zap size={11.5} className="fill-blue-500/10 text-blue-500" />
                    {entry.points.toLocaleString("vi-VN")} <span className="text-[9px] font-bold text-blue-400">XP</span>
                  </span>
                </div>

                {/* Streak Column */}
                <div className="w-24 text-center shrink-0 sm:block hidden">
                  {entry.streakDays > 0 ? (
                    <span className="inline-flex items-center justify-center gap-1 text-orange-600 font-bold text-xs bg-orange-50/50 border border-orange-100/30 px-3 py-1 rounded-xl shadow-sm shadow-orange-50/40">
                      <Flame size={12.5} className="fill-orange-400 text-orange-500" />
                      {entry.streakDays} ngày
                    </span>
                  ) : (
                    <span className="text-slate-300 font-bold text-xs">—</span>
                  )}
                </div>

                {/* Last point date column */}
                <div className="w-40 text-slate-500 text-xs font-semibold md:block hidden shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-450">
                    <Calendar size={12.5} className="text-slate-400" />
                    {formatDate(entry.lastPointDate)}
                  </div>
                </div>

                {/* Action Column */}
                <div className="w-12 flex justify-end shrink-0">
                  <div className="w-8.5 h-8.5 rounded-xl bg-slate-50/80 border border-slate-100 text-slate-400 group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00] group-hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-sm">
                    <ArrowRight size={13.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Pagination inside floating glass wrapper */}
      <div className="rounded-[22px] bg-white/80 border border-slate-200/50 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap mt-6">
        <span className="text-xs font-bold text-slate-500">
          Trang {page + 1} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-xl text-xs font-bold border-slate-200 text-slate-650 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={14} /> Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl text-xs font-bold border-slate-200 text-slate-650 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            Tiếp <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
