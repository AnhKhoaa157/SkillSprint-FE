import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Trophy,
  Flame,
  Zap,
  AlertTriangle,
  RefreshCw,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Award,
  History,
  BookOpen,
  User,
} from "lucide-react";
import { getLeaderboard, getMeSummary, getMyPointEvents } from "../../../api/learning/pointService";
import { getMe } from "../../../api/utilities/meService";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  UserPointSummary,
  MyPointEvent,
} from "../../../api/core/skillSprintModels";

const TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "weekly", label: "Tuần này" },
  { key: "monthly", label: "Tháng này" },
  { key: "all-time", label: "Tất cả" },
];

function resolveAvatar(objectKey: string | null): string | null {
  if (!objectKey) return null;
  const key = objectKey.trim();
  if (!key || key.toLowerCase() === "null" || key.toLowerCase() === "undefined") return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return null;
}

function initialOf(name: string | null, fallback = "?"): string {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : fallback;
}

function rankFor(period: LeaderboardPeriod, summary: UserPointSummary | null): number | null {
  if (!summary) return null;
  if (period === "weekly") return summary.weeklyRank;
  if (period === "monthly") return summary.monthlyRank;
  return summary.allTimeRank;
}

function pointsFor(period: LeaderboardPeriod, summary: UserPointSummary | null): number {
  if (!summary) return 0;
  if (period === "weekly") return summary.weeklyPoints;
  if (period === "monthly") return summary.monthlyPoints;
  return summary.totalPoints;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return `Hôm qua`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  Circle Avatar Component                                                   */
/* -------------------------------------------------------------------------- */
function CircleAvatar({
  name,
  objectKey,
  sizeClass,
  gradient,
}: {
  name: string | null;
  objectKey: string | null;
  sizeClass: string;
  gradient: string;
}) {
  const [errored, setErrored] = useState(false);
  const url = resolveAvatar(objectKey);
  const showImage = url !== null && !errored;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200/50 shadow-inner relative z-10`}>
      {showImage ? (
        <img
          src={url}
          alt={name || "User"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-extrabold text-white"
          style={{ background: gradient }}
        >
          {initialOf(name)}
        </div>
      )}
    </div>
  );
}

const TOP3_GRADIENTS = [
  "linear-gradient(135deg, #FBBF24, #D97706)", // Gold
  "linear-gradient(135deg, #CBD5E1, #475569)", // Silver
  "linear-gradient(135deg, #F97316, #9A3412)", // Bronze
];
const REST_GRADIENT = "linear-gradient(135deg, #64748B, #334155)";

/* -------------------------------------------------------------------------- */
/*  Leaderboard Row Card (Ranks 4+)                                           */
/* -------------------------------------------------------------------------- */
function LeaderboardRow({
  entry,
  isMe,
  reduce,
  index,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  reduce: boolean;
  index: number;
}) {
  const trend = index % 3 === 0 ? "up" : index % 3 === 1 ? "down" : "same";

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: reduce ? 0 : Math.min(index * 0.02, 0.2) }}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-205 ${
        isMe
          ? "border-[#FF6B00] bg-orange-50/20 shadow-[0_4px_15px_rgba(255,107,0,0.05)]"
          : "border-slate-100 bg-white/80 backdrop-blur-sm hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      {/* Rank Indicator */}
      <div className="w-10 shrink-0 flex flex-col items-center">
        <span className={`text-slate-800 font-extrabold text-xs w-7 h-7 rounded-xl flex items-center justify-center border ${
          isMe ? "bg-[#FF6B00]/10 border-[#FF6B00]/20 text-[#FF6B00]" : "bg-slate-50 border-slate-100"
        }`}>
          {entry.rank}
        </span>
        <span className="mt-1 flex justify-center">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-rose-500" />}
          {trend === "same" && <Minus className="w-3 h-3 text-slate-300" />}
        </span>
      </div>

      {/* User Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CircleAvatar
          name={entry.fullName}
          objectKey={entry.avatarObjectKey}
          sizeClass="w-10 h-10 text-sm font-bold"
          gradient={REST_GRADIENT}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-bold text-slate-800 text-sm truncate ${isMe ? "text-slate-900 font-extrabold" : ""}`}>
              {entry.fullName || "Học viên ẩn danh"}
            </span>
            {isMe && (
              <span className="shrink-0 bg-gradient-to-r from-[#FF6B00] to-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider">
                BẠN
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Học viên SkillSprint</span>
        </div>
      </div>

      {/* Streak */}
      <div className="w-20 text-right shrink-0">
        <span className="inline-flex items-center justify-end gap-1 font-bold text-slate-700 text-xs bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg">
          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500 shrink-0" />
          {entry.streakDays}
        </span>
      </div>

      {/* Score */}
      <div className="w-24 text-right shrink-0">
        <span className="inline-flex items-center justify-end gap-1 font-extrabold text-[#FF6B00] text-xs bg-orange-50/70 px-2.5 py-1 rounded-xl border border-orange-200/50">
          <Zap className="w-3 h-3 fill-orange-500/10 text-[#FF6B00] shrink-0" />
          {entry.points.toLocaleString("vi-VN")} <span className="text-[9px] font-bold text-orange-400">XP</span>
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats Grid Widget                                                         */
/* -------------------------------------------------------------------------- */
function StatsDashboard({
  period,
  summary,
}: {
  period: LeaderboardPeriod;
  summary: UserPointSummary | null;
}) {
  const rank = rankFor(period, summary);
  const points = pointsFor(period, summary);
  const streak = summary?.streakDays ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1: Current Rank */}
      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#FF6B00] to-orange-500" />
        <div className="space-y-1 pl-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng của bạn</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
            {rank ? `#${rank}` : "—"}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold">Bảng xếp hạng hệ thống</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center shadow-sm text-[#FF6B00] shrink-0">
          <Trophy className="w-5 h-5 fill-[#FF6B00]/10" />
        </div>
      </motion.div>

      {/* Card 2: Streak Days */}
      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-amber-600" />
        <div className="space-y-1 pl-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chuỗi liên tục</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {streak} <span className="text-xs font-bold text-slate-500">ngày</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold">Học tập đều đặn mỗi ngày</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm text-amber-600 shrink-0">
          <Flame className="w-5 h-5 fill-amber-500/10" />
        </div>
      </motion.div>

      {/* Card 3: Total XP */}
      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#FF6B00] to-orange-500" />
        <div className="space-y-1 pl-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kinh nghiệm</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {points.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-500">XP</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold">Tích lũy từ bài học & quiz</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-orange-50/80 border border-orange-200/50 flex items-center justify-center shadow-sm text-[#FF6B00] shrink-0">
          <Zap className="w-5 h-5 fill-orange-500/10" />
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Podium for Top 3                                                          */
/* -------------------------------------------------------------------------- */
function LeaderboardPodium({
  top3,
  myUserId,
  reduce,
}: {
  top3: (LeaderboardEntry | null)[];
  myUserId: string | null;
  reduce: boolean;
}) {
  const [second, first, third] = top3;

  return (
    <div className="relative overflow-hidden flex items-end justify-center gap-2 sm:gap-6 px-2.5 sm:px-4 pt-16 pb-8 bg-gradient-to-b from-white/95 via-white/80 to-slate-50/70 backdrop-blur-md rounded-3xl border border-white/85 shadow-[0_15px_40px_-20px_rgba(255,107,0,0.04)] max-w-2xl mx-auto w-full">
      {/* Accent line on top */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-orange-400 via-[#FF6B00] to-amber-500" />
      
      {/* Spotlight behind first place */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-full bg-gradient-to-b from-amber-400/10 via-amber-500/[0.01] to-transparent blur-2xl pointer-events-none z-0" />

      {/* Hạng 2 (Silver) */}
      <div className="flex flex-col items-center w-[30%] max-w-[130px] min-w-0 text-center z-10">
        {second ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative mb-3 group">
              <div className="absolute inset-0 rounded-full bg-slate-400/20 blur-md opacity-25" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 border-slate-300 shadow-[0_4px_15px_rgba(148,163,184,0.2)] bg-white shrink-0 relative z-10">
                <CircleAvatar
                  name={second.fullName}
                  objectKey={second.avatarObjectKey}
                  sizeClass="w-full h-full text-base font-bold"
                  gradient={TOP3_GRADIENTS[1]}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center shadow z-20">
                <Medal className="w-3.5 h-3.5 text-white fill-slate-200/50" />
              </div>
            </div>

            <div className="px-1.5 w-full bg-white/95 rounded-2xl p-2 shadow-sm border border-slate-200/70 mb-3 z-10">
              <p className="font-bold text-slate-800 text-[10px] sm:text-xs truncate w-full flex items-center justify-center gap-0.5">
                {second.fullName}
                {second.userId === myUserId && (
                  <span className="bg-[#FF6B00] text-white text-[7px] font-black px-1 rounded-sm shrink-0">BẠN</span>
                )}
              </p>
              <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-black text-[#FF6B00] bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 mx-auto max-w-full">
                <Zap className="w-2.5 h-2.5 fill-orange-500/10 text-[#FF6B00]" />
                {second.points.toLocaleString("vi-VN")} XP
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full opacity-40">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 text-[10px] font-bold bg-white mb-3">
              Trống
            </div>
          </div>
        )}

        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.15 }}
          style={{ originY: 1 }}
          className="w-full bg-gradient-to-b from-slate-100/70 via-white/50 to-slate-400/15 border-t-4 border-t-slate-300 h-16 sm:h-20 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_24px_-10px_rgba(71,85,105,0.22)] border border-slate-300/25 border-b-0 relative"
        >
          <div className="w-7 h-7 rounded-full bg-slate-500/10 border border-slate-300/40 flex items-center justify-center text-xs font-black text-slate-500 shadow-sm">
            2
          </div>
        </motion.div>
      </div>

      {/* Hạng 1 (Gold) */}
      <div className="flex flex-col items-center w-[35%] max-w-[140px] min-w-0 text-center z-20">
        {first ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative mb-3 group -translate-y-3">
              <div className="absolute inset-0 rounded-full bg-amber-400 blur-md opacity-25 animate-pulse" />
              <motion.div
                animate={{ y: [0, -3, 0], rotate: [0, -2, 2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-7.5 left-1/2 -translate-x-1/2 z-20"
              >
                <Crown className="w-7 h-7 text-amber-500 fill-amber-300 drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]" />
              </motion.div>
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden border-4 border-amber-400 shadow-[0_5px_18px_rgba(245,158,11,0.3)] bg-white shrink-0 relative z-10">
                <CircleAvatar
                  name={first.fullName}
                  objectKey={first.avatarObjectKey}
                  sizeClass="w-full h-full text-lg font-bold"
                  gradient={TOP3_GRADIENTS[0]}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg z-20">
                <Trophy className="w-3.5 h-3.5 text-white fill-amber-200" />
              </div>
            </div>

            <div className="px-1.5 w-full bg-white/95 rounded-2xl p-2 shadow-md border border-amber-100/50 mb-3 z-10 -mt-2">
              <p className="font-extrabold text-slate-800 text-xs truncate w-full flex items-center justify-center gap-0.5">
                {first.fullName}
                {first.userId === myUserId && (
                  <span className="bg-[#FF6B00] text-white text-[7px] font-black px-1 rounded-sm shrink-0">BẠN</span>
                )}
              </p>
              <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-black text-[#FF6B00] bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 mx-auto max-w-full shadow-sm">
                <Zap className="w-2.5 h-2.5 fill-orange-500/10 text-[#FF6B00]" />
                {first.points.toLocaleString("vi-VN")} XP
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full opacity-40">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-500 text-xs font-bold bg-white mb-3">
              Trống
            </div>
          </div>
        )}

        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
          style={{ originY: 1 }}
          className="w-full bg-gradient-to-b from-amber-100/70 via-white/50 to-amber-500/15 border-t-4 border-t-amber-400 h-24 sm:h-28 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_30px_-12px_rgba(245,158,11,0.3)] border border-amber-400/25 border-b-0 relative"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-sm font-black text-amber-600 shadow-inner">
            1
          </div>
        </motion.div>
      </div>

      {/* Hạng 3 (Bronze) */}
      <div className="flex flex-col items-center w-[30%] max-w-[130px] min-w-0 text-center z-10">
        {third ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative mb-3 group">
              <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-md opacity-25" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 border-orange-300 shadow-[0_4px_15px_rgba(249,115,22,0.18)] bg-white shrink-0 relative z-10">
                <CircleAvatar
                  name={third.fullName}
                  objectKey={third.avatarObjectKey}
                  sizeClass="w-full h-full text-base font-bold"
                  gradient={TOP3_GRADIENTS[2]}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center shadow z-20">
                <Medal className="w-3.5 h-3.5 text-white fill-orange-200/50" />
              </div>
            </div>

            <div className="px-1.5 w-full bg-white/95 rounded-2xl p-2 shadow-sm border border-orange-200/60 mb-3 z-10">
              <p className="font-bold text-slate-800 text-[10px] sm:text-xs truncate w-full flex items-center justify-center gap-0.5">
                {third.fullName}
                {third.userId === myUserId && (
                  <span className="bg-[#FF6B00] text-white text-[7px] font-black px-1 rounded-sm shrink-0">BẠN</span>
                )}
              </p>
              <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-black text-[#FF6B00] bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 mx-auto max-w-full">
                <Zap className="w-2.5 h-2.5 fill-orange-500/10 text-[#FF6B00]" />
                {third.points.toLocaleString("vi-VN")} XP
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full opacity-40">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-orange-300 flex items-center justify-center text-orange-500 text-[10px] font-bold bg-white mb-3">
              Trống
            </div>
          </div>
        )}

        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
          style={{ originY: 1 }}
          className="w-full bg-gradient-to-b from-orange-100/70 via-white/50 to-orange-400/15 border-t-4 border-t-orange-300 h-12 sm:h-15 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_22px_-12px_rgba(249,115,22,0.25)] border border-orange-300/25 border-b-0 relative"
        >
          <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-300/40 flex items-center justify-center text-xs font-black text-orange-600 shadow-sm">
            3
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar: Lịch sử nhận XP                                                  */
/* -------------------------------------------------------------------------- */
function TimelineHistoryPanel({ events }: { events: MyPointEvent[] }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <History size={16} className="text-blue-500" />
        <h3 className="text-sm font-black text-slate-800 tracking-tight">Lịch sử nhận XP</h3>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs font-semibold">
          Chưa có hoạt động tích điểm nào gần đây.
        </div>
      ) : (
        <div className="relative pl-4 border-l-2 border-slate-100 space-y-5">
          {events.slice(0, 5).map((event, i) => {
            let icon = <Zap className="w-3 h-3" />;
            let iconBg = "bg-orange-50 border-orange-200 text-[#FF6B00]";
            
            if (event.eventType.includes("ROADMAP")) {
              icon = <Award className="w-3 h-3" />;
              iconBg = "bg-purple-50 border-purple-200 text-purple-600";
            } else if (event.eventType.includes("STREAK")) {
              icon = <Flame className="w-3 h-3 fill-orange-400" />;
              iconBg = "bg-amber-50 border-amber-200 text-amber-600";
            } else if (event.eventType.includes("LECTURE")) {
              icon = <BookOpen className="w-3 h-3" />;
              iconBg = "bg-emerald-50 border-emerald-200 text-emerald-600";
            }

            return (
              <div key={i} className="relative space-y-1">
                <div className={`absolute -left-[25px] top-0.5 w-[18px] h-[18px] rounded-full border flex items-center justify-center shadow-sm ${iconBg}`}>
                  {icon}
                </div>
                
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 leading-tight truncate">
                      {event.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 bg-orange-50 text-[#FF6B00] text-[10px] font-black px-2 py-0.5 rounded-lg border border-orange-100/50">
                    +{event.points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar: Hướng dẫn tích điểm                                              */
/* -------------------------------------------------------------------------- */
function RulesGuidePanel() {
  const rules = [
    {
      title: "Hoàn thành Lộ trình học",
      desc: "Học xong một lộ trình học tập hoàn thành nhận +500 XP.",
      badge: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm",
      points: "+500 XP",
    },
    {
      title: "Luyện trắc nghiệm (Quiz)",
      desc: "Đạt điểm tối đa bài thi kiểm tra nhanh tích lũy ngay +150 XP.",
      badge: "bg-slate-100 text-slate-700 border border-slate-200 shadow-sm",
      points: "+150 XP",
    },
    {
      title: "Xem video & Đọc bài lý thuyết",
      desc: "Học hết một video hoặc một bài đọc lý thuyết ngắn nhận +20 XP.",
      badge: "bg-orange-50 text-orange-700 border border-orange-200/60 shadow-sm",
      points: "+20 XP",
    },
    {
      title: "Duy trì Chuỗi liên tục (Streak)",
      desc: "Vào học đều đặn hàng ngày để nâng điểm thưởng của bạn.",
      badge: "bg-slate-50 text-slate-500 border border-slate-200/50",
      points: "Thưởng hàng ngày",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Info size={16} className="text-slate-500" />
        <h3 className="text-sm font-black text-slate-800 tracking-tight">Hướng dẫn tích điểm</h3>
      </div>

      <div className="space-y-4.5">
        {rules.map((rule, index) => (
          <div key={index} className="flex gap-3">
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${rule.badge}`}>
              {index + 1}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs font-extrabold text-slate-800 leading-snug">
                {rule.title}
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                {rule.desc.split(rule.points)[0]}
                <span className="text-[#FF6B00] font-black">{rule.points}</span>
                {rule.desc.split(rule.points)[1]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page Component                                                       */
/* -------------------------------------------------------------------------- */
type LoadState = "loading" | "error" | "ready";

export default function LeaderboardPage() {
  const reduce = useReducedMotion() ?? false;
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<UserPointSummary | null>(null);
  const [pointEvents, setPointEvents] = useState<MyPointEvent[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;
    
    getMe()
      .then((me) => {
        if (active) setMyUserId(me.userId);
      })
      .catch(() => {
        if (active) setMyUserId(null);
      });

    getMeSummary()
      .then((s) => {
        if (active) setSummary(s);
      })
      .catch(() => {
        if (active) setSummary(null);
      });

    getMyPointEvents()
      .then((events) => {
        if (active) setPointEvents(events);
      })
      .catch(() => {
        if (active) setPointEvents([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const load = useCallback((scope: LeaderboardPeriod) => {
    let active = true;
    setState("loading");
    getLeaderboard(scope, 50)
      .then((res) => {
        if (!active) return;
        setEntries(res.entries ?? []);
        setState("ready");
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const meInList = useMemo(() => {
    if (!myUserId) return false;
    return entries.some((e) => e.userId === myUserId);
  }, [entries, myUserId]);

  const meEntry = useMemo(() => {
    if (!myUserId) return null;
    return entries.find((e) => e.userId === myUserId) ?? null;
  }, [entries, myUserId]);

  const top3 = useMemo(() => {
    const t1 = entries.find((e) => e.rank === 1) ?? null;
    const t2 = entries.find((e) => e.rank === 2) ?? null;
    const t3 = entries.find((e) => e.rank === 3) ?? null;
    return [t2, t1, t3];
  }, [entries]);

  const listEntries = useMemo(() => {
    return entries.filter((e) => e.rank > 3);
  }, [entries]);

  const displayName = useMemo(() => meEntry?.fullName ?? null, [meEntry]);

  return (
    <div className="max-w-6xl mx-auto space-y-7 py-2 pb-16 px-4 md:px-0 relative" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      
      {/* Background Decorative Grid and Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[32px]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        
        {/* Ambient mesh glows */}
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full bg-[#FF6B00]/7 blur-[100px] opacity-70" />
        <div className="absolute top-60 right-10 w-96 h-96 rounded-full bg-blue-500/[0.04] blur-[120px] opacity-50" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 rounded-full bg-amber-50/[0.03] blur-[120px] opacity-60" />
      </div>

      {/* Section 1 — Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00]/10 to-orange-500/[0.03] border border-[#FF6B00]/20 flex items-center justify-center shadow-sm shrink-0">
            <Trophy size={22} className="text-[#FF6B00] fill-orange-200/10" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              Bảng xếp hạng
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">Cạnh tranh cùng bạn bè và duy trì chuỗi học tập của bạn.</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period switcher */}
          <div className="relative flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-sm">
            {TABS.map((tab) => {
              const activeTab = tab.key === period;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPeriod(tab.key)}
                  className={`relative z-10 rounded-full px-4 py-1.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                    activeTab ? "text-white" : "text-slate-500 hover:bg-slate-100/50"
                  }`}
                >
                  {activeTab && (
                    <motion.div
                      layoutId="activeLeaderboardTab"
                      className="absolute inset-0 bg-[#FF6B00] rounded-full -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Section 2 — Stats Dashboard */}
      <StatsDashboard
        period={period}
        summary={summary}
      />

      {/* Section 3 — Two-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Podium & List (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Podium */}
          {state === "ready" && entries.length > 0 && (
            <LeaderboardPodium top3={top3} myUserId={myUserId} reduce={reduce} />
          )}

          {/* Ranks 4+ List */}
          <div className="space-y-3.5">
            {state === "loading" && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-white/70 border border-slate-100 animate-pulse" />
                ))}
              </div>
            )}

            {state === "error" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                <AlertTriangle size={28} className="mx-auto text-red-500" />
                <h3 className="mt-3 text-sm font-extrabold text-slate-800">Không thể tải danh sách</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Đã có lỗi hệ thống xảy ra khi kết nối máy chủ.</p>
                <button
                  onClick={() => load(period)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  <RefreshCw size={13} /> Thử lại
                </button>
              </div>
            )}

            {state === "ready" && entries.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
                <User size={30} className="mx-auto text-slate-300" />
                <h3 className="mt-3 text-sm font-extrabold text-slate-800">Chưa có ai xếp hạng</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Hãy là người đầu tiên học tập và tích lũy XP trong giai đoạn này!</p>
              </div>
            )}

            {state === "ready" && entries.length > 0 && (
              <div className="space-y-3">
                {/* Column header */}
                <div className="flex items-center gap-3 px-5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="w-10 shrink-0 text-center">Hạng</div>
                  <div className="flex-1 min-w-0">Học viên</div>
                  <div className="w-20 text-right shrink-0">Chuỗi</div>
                  <div className="w-24 text-right shrink-0">XP Tích lũy</div>
                </div>

                {/* Rows map */}
                {listEntries.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === myUserId}
                    reduce={reduce}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History & Guide Sidebar (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <TimelineHistoryPanel events={pointEvents} />
          <RulesGuidePanel />
        </div>

      </div>

      {/* Pinned current-user row when they're outside the visible ranking */}
      {state === "ready" && myUserId && !meInList && summary && rankFor(period, summary) !== null && (
        <div className="sticky bottom-4 z-40 max-w-5xl mx-auto">
          <div
            className="flex items-center justify-between gap-4 rounded-3xl border-2 border-[#FF6B00] bg-white/95 backdrop-blur-md px-6 py-4.5 shadow-[0_16px_40px_-18px_rgba(255,107,0,0.4)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] font-black text-sm flex items-center justify-center shrink-0">
                #{rankFor(period, summary)}
              </div>
              <div className="flex items-center gap-3.5">
                <CircleAvatar
                  name={displayName}
                  objectKey={meEntry?.avatarObjectKey ?? null}
                  sizeClass="w-10 h-10 text-sm font-bold"
                  gradient={TOP3_GRADIENTS[0]}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-800 text-sm">
                      {displayName ? `${displayName} (Bạn)` : "Bạn"}
                    </span>
                    <span className="shrink-0 bg-gradient-to-r from-[#FF6B00] to-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                      BẠN
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Bảng xếp hạng hệ thống</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-bold text-slate-700 text-xs bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg">
                  <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500 shrink-0" />
                  {summary.streakDays}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-extrabold text-[#FF6B00] text-xs bg-orange-50/70 px-2.5 py-1 rounded-xl border border-orange-200/50">
                  <Zap className="w-3 h-3 fill-orange-500/10 text-[#FF6B00] shrink-0" />
                  {pointsFor(period, summary).toLocaleString("vi-VN")} <span className="text-[9px] font-bold text-orange-400">XP</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
