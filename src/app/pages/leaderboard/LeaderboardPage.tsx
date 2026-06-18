import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Trophy, Crown, Flame, Sparkles, AlertTriangle, RefreshCw, Medal } from "lucide-react";
import { getLeaderboard, getMeSummary } from "../../../api/pointService";
import { getMe } from "../../../api/meService";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  UserPointSummary,
} from "../../../api/skillSprintModels";

const OG = "#FF6B00";

const TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "weekly", label: "Tuần này" },
  { key: "monthly", label: "Tháng này" },
  { key: "all-time", label: "Mọi thời điểm" },
];

/** Resolve a usable <img> src from the BE avatar object key, else null → initials. */
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

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                    */
/* -------------------------------------------------------------------------- */

function Avatar({
  name,
  objectKey,
  size = 44,
  ring,
}: {
  name: string | null;
  objectKey: string | null;
  size?: number;
  ring?: string;
}) {
  const [errored, setErrored] = useState(false);
  const url = resolveAvatar(objectKey);
  const showImage = url !== null && !errored;
  const dimension = { width: size, height: size };

  return (
    <div
      className="shrink-0 rounded-2xl flex items-center justify-center overflow-hidden"
      style={{ ...dimension, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}
    >
      {showImage ? (
        <img
          src={url}
          alt={name || "Người dùng"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-black text-white"
          style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)", fontSize: size * 0.4 }}
        >
          {initialOf(name)}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Podium (Top 3)                                                            */
/* -------------------------------------------------------------------------- */

const PODIUM_THEME: Record<number, { ring: string; badge: string; label: string; order: string; lift: string }> = {
  1: { ring: "rgba(255,107,0,0.55)", badge: "linear-gradient(135deg,#FF6B00,#F59E0B)", label: "#B45309", order: "order-2", lift: "md:-translate-y-4" },
  2: { ring: "rgba(148,163,184,0.55)", badge: "linear-gradient(135deg,#CBD5E1,#94A3B8)", label: "#475569", order: "order-1", lift: "md:translate-y-2" },
  3: { ring: "rgba(180,120,70,0.5)", badge: "linear-gradient(135deg,#D9A066,#B45309)", label: "#92400E", order: "order-3", lift: "md:translate-y-4" },
};

function PodiumCard({
  entry,
  isMe,
  reduce,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  reduce: boolean;
}) {
  const theme = PODIUM_THEME[entry.rank] ?? PODIUM_THEME[3];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16, delay: reduce ? 0 : entry.rank * 0.05 }}
      className={`relative flex flex-col items-center ${theme.order} ${theme.lift}`}
    >
      <div
        className="relative w-full rounded-3xl border bg-white px-4 pt-8 pb-5 flex flex-col items-center text-center"
        style={{
          borderColor: isMe ? OG : "rgba(15,23,42,0.06)",
          boxShadow: entry.rank === 1
            ? "0 20px 50px -18px rgba(255,107,0,0.45)"
            : "0 14px 36px -20px rgba(15,23,42,0.30)",
        }}
      >
        {entry.rank === 1 && (
          <Crown
            size={26}
            className="absolute -top-3 left-1/2 -translate-x-1/2 fill-amber-400 text-amber-500 drop-shadow"
          />
        )}
        <div
          className="absolute -top-3.5 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-white shadow"
          style={{ background: theme.badge }}
        >
          {entry.rank}
        </div>

        <Avatar name={entry.fullName} objectKey={entry.avatarObjectKey} size={entry.rank === 1 ? 64 : 52} ring={theme.ring} />

        <p className="mt-3 font-extrabold text-slate-800 text-sm truncate max-w-[140px]">
          {entry.fullName || "Ẩn danh"}
          {isMe && <span className="ml-1 text-[10px] font-bold text-[#FF6B00]">(Bạn)</span>}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-lg font-black" style={{ color: theme.label }}>
          {entry.points.toLocaleString("vi-VN")}
          <span className="text-[10px] font-bold opacity-70">XP</span>
        </p>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Standard list row (rank 4+)                                               */
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
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(index * 0.025, 0.4) }}
      className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-transform hover:scale-[1.01] motion-reduce:hover:scale-100 motion-reduce:transition-none"
      style={{
        background: isMe ? "rgba(255,107,0,0.06)" : "#FFFFFF",
        borderColor: isMe ? "rgba(255,107,0,0.45)" : "rgba(15,23,42,0.06)",
        boxShadow: isMe
          ? "0 10px 30px -16px rgba(255,107,0,0.5)"
          : "0 8px 24px -20px rgba(15,23,42,0.35)",
      }}
    >
      <div className="w-8 text-center font-black text-slate-400 text-sm shrink-0">{entry.rank}</div>
      <Avatar name={entry.fullName} objectKey={entry.avatarObjectKey} size={40} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-800 text-sm truncate">
          {entry.fullName || "Ẩn danh"}
          {isMe && <span className="ml-1.5 text-[10px] font-bold text-[#FF6B00]">(Bạn)</span>}
        </p>
      </div>
      <div className="shrink-0 font-extrabold text-slate-700 text-sm">
        {entry.points.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400">XP</span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Your-rank summary banner                                                  */
/* -------------------------------------------------------------------------- */

function YourRankCard({
  period,
  summary,
  reduce,
}: {
  period: LeaderboardPeriod;
  summary: UserPointSummary | null;
  reduce: boolean;
}) {
  const rank = rankFor(period, summary);
  const points = pointsFor(period, summary);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[#FF6B00]/25 bg-gradient-to-br from-orange-50 to-white px-5 py-4 flex items-center justify-between gap-4"
      style={{ boxShadow: "0 16px 40px -22px rgba(255,107,0,0.5)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-white border border-[#FF6B00]/30 flex items-center justify-center shrink-0">
          <Trophy size={20} className="text-[#FF6B00]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">Vị trí của bạn</p>
          <p className="font-extrabold text-slate-800 text-lg leading-tight">
            {rank ? `#${rank}` : "Chưa xếp hạng"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Điểm</p>
          <p className="font-black text-slate-800 text-lg">{points.toLocaleString("vi-VN")}</p>
        </div>
        {summary && summary.streakDays > 0 && (
          <div className="hidden sm:flex flex-col items-center rounded-2xl bg-white border border-amber-200 px-3 py-1.5">
            <Flame size={16} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-extrabold text-amber-600">{summary.streakDays}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type LoadState = "loading" | "error" | "ready";

export default function LeaderboardPage() {
  const reduce = useReducedMotion() ?? false;
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<UserPointSummary | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  // Identify the current user once so we can highlight/pin their row.
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

  useEffect(() => load(period), [period, load]);

  const top3 = useMemo(() => entries.filter((e) => e.rank <= 3), [entries]);
  const rest = useMemo(() => entries.filter((e) => e.rank > 3), [entries]);
  const meInList = useMemo(
    () => (myUserId ? entries.some((e) => e.userId === myUserId) : false),
    [entries, myUserId],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Trophy size={22} className="text-[#FF6B00]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Bảng xếp hạng</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Sparkles size={11} className="text-[#FF6B00]" /> Tích lũy XP từ roadmap và quiz để leo top
            </p>
          </div>
        </div>
      </motion.div>

      {/* Your rank */}
      <YourRankCard period={period} summary={summary} reduce={reduce} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100/70 p-1.5">
        {TABS.map((tab) => {
          const activeTab = tab.key === period;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPeriod(tab.key)}
              className="relative flex-1 min-w-[96px] rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer"
              style={{ color: activeTab ? "#FFFFFF" : "#64748B" }}
            >
              {activeTab && (
                <motion.div
                  layoutId={reduce ? undefined : "lb-active-tab"}
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)", boxShadow: "0 8px 20px -10px rgba(255,107,0,0.7)" }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {state === "loading" ? (
          <motion.div
            key="loading"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3 pt-2"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse motion-reduce:animate-none" />
            ))}
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="rounded-3xl border border-red-100 bg-red-50/60 p-8 text-center mt-2"
          >
            <AlertTriangle size={26} className="mx-auto text-red-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Không thể tải bảng xếp hạng.</p>
            <button
              type="button"
              onClick={() => load(period)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={13} /> Thử lại
            </button>
          </motion.div>
        ) : entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="rounded-3xl border border-slate-100 bg-white p-12 text-center mt-2"
            style={{ boxShadow: "0 14px 36px -24px rgba(15,23,42,0.3)" }}
          >
            <Medal size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Chưa có ai trên bảng xếp hạng.</p>
            <p className="mt-1 text-xs text-slate-400">Hãy là người đầu tiên ghi điểm trong kỳ này!</p>
          </motion.div>
        ) : (
          <motion.div
            key={`ready-${period}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 pt-2"
          >
            {/* Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-4">
                {top3.map((entry) => (
                  <PodiumCard
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === myUserId}
                    reduce={reduce}
                  />
                ))}
              </div>
            )}

            {/* The rest */}
            {rest.length > 0 && (
              <div className="space-y-2.5">
                {rest.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === myUserId}
                    reduce={reduce}
                    index={i}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned current-user row when they're outside the visible ranking. */}
      {state === "ready" && myUserId && !meInList && summary && rankFor(period, summary) !== null && (
        <div className="sticky bottom-3 pt-2">
          <div
            className="flex items-center gap-3 rounded-2xl border border-[#FF6B00]/45 px-4 py-3 backdrop-blur"
            style={{ background: "rgba(255,247,237,0.95)", boxShadow: "0 16px 40px -18px rgba(255,107,0,0.55)" }}
          >
            <div className="w-8 text-center font-black text-[#FF6B00] text-sm shrink-0">
              #{rankFor(period, summary)}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#FF6B00]/30 flex items-center justify-center shrink-0">
              <Trophy size={16} className="text-[#FF6B00]" />
            </div>
            <p className="flex-1 font-bold text-slate-800 text-sm">
              Vị trí của bạn <span className="text-[10px] font-bold text-[#FF6B00]">(Bạn)</span>
            </p>
            <div className="shrink-0 font-extrabold text-slate-700 text-sm">
              {pointsFor(period, summary).toLocaleString("vi-VN")}{" "}
              <span className="text-[10px] text-slate-400">XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
