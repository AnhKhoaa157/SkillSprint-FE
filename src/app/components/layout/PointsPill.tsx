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

  return (
    <button
      type="button"
      onClick={() => navigate("/app/leaderboard")}
      title="Xem bảng xếp hạng"
      aria-label={`${points} điểm XP — mở bảng xếp hạng`}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00]/25 bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-[#FF6B00] shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <Zap size={12} className="shrink-0 fill-[#FF6B00]" />
      {points.toLocaleString("vi-VN")} XP
    </button>
  );
}

export default PointsPill;
