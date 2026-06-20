import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { getMeSummary } from "../../../api/learning/pointService";

/**
 * Compact XP indicator pinned to the dashboard header. Clicking it jumps to the
 * leaderboard. Refetches when any part of the app dispatches the
 * `skillSprint:points-updated` window event (e.g. after earning XP).
 *
 * Micro-interaction (hover:scale) is automatically disabled for users with the
 * reduced-motion OS setting via Tailwind's `motion-reduce:` variants.
 */
export function PointsPill() {
  const navigate = useNavigate();
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = (): void => {
      getMeSummary()
        .then((summary) => {
          if (active) setPoints(summary.totalPoints);
        })
        .catch(() => {
          if (active) setPoints(null);
        });
    };

    load();
    const onUpdate = (): void => load();
    window.addEventListener("skillSprint:points-updated", onUpdate);
    return () => {
      active = false;
      window.removeEventListener("skillSprint:points-updated", onUpdate);
    };
  }, []);

  // Hide entirely until we have a real value — avoids a flash of "0 XP".
  if (points === null) return null;

  const isUltimate = points >= 500000;
  const isMaster = points >= 50000 && points < 500000;
  const isPro = points >= 5000 && points < 50000;

  let className = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:transition-none motion-reduce:hover:scale-100";
  let iconClass = "shrink-0";

  if (isUltimate) {
    className += " xp-ultimate-bg text-white border-transparent shadow-[0_0_15px_rgba(255,107,0,0.5)]";
    iconClass += " fill-white animate-pulse";
  } else if (isMaster) {
    className += " bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-700 border border-blue-200 shadow-md";
    iconClass += " fill-blue-500";
  } else if (isPro) {
    className += " bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-300";
    iconClass += " fill-amber-500";
  } else {
    className += " bg-orange-50 border border-[#FF6B00]/25 text-[#FF6B00]";
    iconClass += " fill-[#FF6B00]";
  }

  return (
    <>
      {isUltimate && (
        <style>
          {`
            @keyframes gradientShimmerXP {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .xp-ultimate-bg {
              background: linear-gradient(90deg, #FF6B00, #F59E0B, #EC4899, #FF6B00);
              background-size: 300% 300%;
              animation: gradientShimmerXP 3s ease infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .xp-ultimate-bg {
                animation: none;
              }
              .animate-pulse {
                animation: none;
              }
            }
          `}
        </style>
      )}
      <button
        type="button"
        onClick={() => navigate("/app/leaderboard")}
        title="Xem bảng xếp hạng"
        aria-label={`${points} điểm XP — mở bảng xếp hạng`}
        className={className}
      >
        <Zap size={12} className={iconClass} />
        {points.toLocaleString("vi-VN")} XP
      </button>
    </>
  );
}

export default PointsPill;
