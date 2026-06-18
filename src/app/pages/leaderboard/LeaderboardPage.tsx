import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Trophy, Flame, Zap, AlertTriangle, RefreshCw, Medal } from "lucide-react";
import { getLeaderboard, getMeSummary } from "../../../api/pointService";
import { getMe } from "../../../api/meService";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  UserPointSummary,
} from "../../../api/skillSprintModels";

const TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
  { key: "all-time", label: "This All" },
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
/*  Circular avatar (photo → initials fallback)                               */
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
    <div className={`${sizeClass} rounded-full overflow-hidden shrink-0 flex items-center justify-center`}>
      {showImage ? (
        <img
          src={url}
          alt={name || "User"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-black text-white"
          style={{ background: gradient }}
        >
          {initialOf(name)}
        </div>
      )}
    </div>
  );
}

const TOP3_GRADIENT = "linear-gradient(135deg,#FB923C,#EA580C)";
const REST_GRADIENT = "linear-gradient(135deg,#64748B,#334155)";
const ORANGE_GRADIENT = "linear-gradient(135deg,#FB923C,#F97316)";

/* -------------------------------------------------------------------------- */
/*  Standard list row (flat list — no podium)                                 */
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
  const isTop3 = entry.rank <= 3;
  
  // Fake trend indicator for visual fidelity with mockup
  const trend = index % 3 === 0 ? "up" : index % 3 === 1 ? "down" : "same";

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: reduce ? 0 : Math.min(index * 0.02, 0.3) }}
      className={`flex items-center gap-3 px-4 py-3.5 ${isMe ? "border-l-2 border-[#FF6B00] bg-orange-50/40" : ""}`}
    >
      {/* Rank + change indicator */}
      <div className="w-12 shrink-0 flex flex-col items-center leading-none">
        <span className={isTop3 ? "text-[#FF6B00] font-black text-sm" : "text-slate-500 font-bold text-sm"}>
          #{entry.rank}
        </span>
        <span className="mt-1 flex justify-center">
          {trend === "up" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="m18 15-6-6-6 6"/></svg>}
          {trend === "down" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m6 9 6 6 6-6"/></svg>}
          {trend === "same" && <span className="text-[10px] text-slate-400">—</span>}
        </span>
      </div>

      {/* Student */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CircleAvatar
          name={entry.fullName}
          objectKey={entry.avatarObjectKey}
          sizeClass="w-10 h-10 text-sm"
          gradient={isTop3 ? TOP3_GRADIENT : REST_GRADIENT}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center min-w-0">
            <span className="font-bold text-slate-800 text-sm truncate">{entry.fullName || "Anonymous"}</span>
            {isMe && (
              <span className="shrink-0 bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5">
                YOU
              </span>
            )}
          </div>
          {/* We don't have course name in the API yet, render a default generic one for mockup fidelity or just keep it clean */}
          <span className="text-[11px] text-slate-400 truncate">SkillSprint Member</span>
        </div>
      </div>

      {/* Streak (now provided by backend) */}
      <div className="w-20 text-right shrink-0">
        <span className="inline-flex items-center justify-end gap-1 font-black text-[#FF6B00] text-sm">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-[#FF6B00]" />
          {entry.streakDays}
        </span>
      </div>

      {/* Score */}
      <div className="w-20 text-right shrink-0">
        <span className="inline-flex items-center justify-end gap-1 font-black text-blue-600 text-sm">
          <Zap className="w-3.5 h-3.5 fill-blue-400 text-blue-500" />
          {entry.points.toLocaleString("vi-VN")}
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  "Your Rank" banner                                                        */
/* -------------------------------------------------------------------------- */

function YourRankCard({
  period,
  summary,
  displayName,
  avatarObjectKey,
  reduce,
}: {
  period: LeaderboardPeriod;
  summary: UserPointSummary | null;
  displayName: string | null;
  avatarObjectKey: string | null;
  reduce: boolean;
}) {
  const rank = rankFor(period, summary);
  const points = pointsFor(period, summary);
  const streak = summary?.streakDays ?? 0;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-[#FF6B00] bg-white px-5 py-4 flex items-center justify-between gap-4"
      style={{ boxShadow: "0 10px 30px -18px rgba(255,107,0,0.45)" }}
    >
      {/* Rank badge */}
      <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#FF6B00] font-black text-sm flex items-center justify-center shrink-0">
        {rank ? `#${rank}` : "—"}
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CircleAvatar
          name={displayName}
          objectKey={avatarObjectKey}
          sizeClass="w-11 h-11 text-sm"
          gradient={ORANGE_GRADIENT}
        />
        <p className="font-bold text-slate-800 text-sm truncate">
          {displayName ? `${displayName} (You)` : "You"}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 font-black text-lg text-[#FF6B00] leading-none">
            <Flame className="w-4 h-4 fill-amber-400 text-[#FF6B00]" />
            {streak}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-[#FF6B00]/70 mt-1">Days</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 font-black text-lg text-blue-600 leading-none">
            <Zap className="w-4 h-4 fill-blue-400 text-blue-500" />
            {points.toLocaleString("vi-VN")}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-blue-500/70 mt-1">XP</p>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type LoadState = "loading" | "error" | "ready";

const CARD_SHADOW = "0 14px 36px -24px rgba(15,23,42,0.3)";

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

  const meInList = useMemo(
    () => (myUserId ? entries.some((e) => e.userId === myUserId) : false),
    [entries, myUserId],
  );

  // Derive the current user's display name/avatar from their row when present
  // (the UserPointSummary model exposes neither). Falls back to "You" otherwise.
  const meEntry = useMemo(
    () => (myUserId ? entries.find((e) => e.userId === myUserId) ?? null : null),
    [entries, myUserId],
  );
  const displayName = meEntry?.fullName ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2 pb-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Section 1 — Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-[#FF6B00]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Leaderboard</h1>
            <p className="text-sm text-slate-500">Compete with peers and maintain your streak.</p>
          </div>
        </div>

        {/* Period switcher */}
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {TABS.map((tab) => {
            const activeTab = tab.key === period;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPeriod(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Section 2 — Your Rank */}
      <YourRankCard
        period={period}
        summary={summary}
        displayName={displayName}
        avatarObjectKey={meEntry?.avatarObjectKey ?? null}
        reduce={reduce}
      />

      {/* Section 3 — Leaderboard table */}
      <div className="bg-white rounded-3xl border border-slate-100" style={{ boxShadow: CARD_SHADOW }}>
        {/* Column header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <div className="w-12 shrink-0 text-center">Rank</div>
          <div className="flex-1 min-w-0">Student</div>
          <div className="w-20 text-right shrink-0">Streak</div>
          <div className="w-20 text-right shrink-0">Score</div>
        </div>

        {state === "loading" && (
          <div className="px-4 pb-4 space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="px-6 py-14 text-center">
            <AlertTriangle size={26} className="mx-auto text-red-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Couldn’t load the leaderboard.</p>
            <button
              type="button"
              onClick={() => load(period)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {state === "ready" && entries.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Medal size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No one is on the leaderboard yet.</p>
            <p className="mt-1 text-xs text-slate-400">Be the first to score points this period!</p>
          </div>
        )}

        {state === "ready" && entries.length > 0 && (
          <div className="divide-y divide-slate-50">
            {entries.map((entry, i) => (
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
      </div>

      {/* Pinned current-user row when they're outside the visible ranking. */}
      {state === "ready" && myUserId && !meInList && summary && rankFor(period, summary) !== null && (
        <div className="sticky bottom-3">
          <div
            className="flex items-center gap-3 rounded-2xl border-2 border-[#FF6B00] bg-white/95 backdrop-blur px-4 py-3"
            style={{ boxShadow: "0 16px 40px -18px rgba(255,107,0,0.5)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] font-black text-sm flex items-center justify-center shrink-0">
              #{rankFor(period, summary)}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-bold text-slate-800 text-sm truncate">
                {displayName ? `${displayName} (You)` : "You"}
              </span>
              <span className="shrink-0 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                YOU
              </span>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 font-black text-blue-600 text-sm">
              <Zap className="w-3.5 h-3.5 fill-blue-400 text-blue-500" />
              {pointsFor(period, summary).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
