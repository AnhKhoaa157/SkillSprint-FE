import { ArrowUp, Trophy } from "lucide-react";
import { useMarketplaceLeaderboard } from "../../../api/marketplace/useMarketplaceLeaderboard";

type MarketplaceLeaderboardCardProps = {
  itemId?: string;
  versionId?: string;
  compact?: boolean;
  limit?: number;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function formatDuration(durationSeconds: number) {
  if (durationSeconds < 60) return `${durationSeconds} giây`;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  if (minutes < 60) return `${minutes} phút ${String(seconds).padStart(2, "0")} giây`;
  const hours = Math.floor(minutes / 60);
  return `${hours} giờ ${String(minutes % 60).padStart(2, "0")} phút`;
}

function RankBadge({ rank }: { rank: number }) {
  const styles = rank === 1
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : rank === 2
      ? "border-slate-300 bg-slate-100 text-slate-700"
      : rank === 3
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-slate-200 bg-white text-slate-600";
  return <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-black ${styles}`}>#{rank}</span>;
}

function SkeletonRows({ compact }: { compact: boolean }) {
  return <div className="space-y-2">{[1, 2, 3].map(row => <div key={row} className={`animate-pulse rounded-xl bg-slate-100 ${compact ? "h-12" : "h-16"}`} />)}</div>;
}

export default function MarketplaceLeaderboardCard({ itemId, versionId, compact = false, limit = 10 }: MarketplaceLeaderboardCardProps) {
  const id = versionId ?? itemId ?? "";
  const { entries, loading, error, refetch } = useMarketplaceLeaderboard(id, limit, versionId ? "version" : "item");
  const padding = compact ? "p-4" : "p-5 sm:p-6";
  const backToTop = () => {
    const dashboardScroll = document.querySelector<HTMLElement>("[data-dashboard-scroll]");
    if (dashboardScroll) dashboardScroll.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section className={`rounded-2xl border border-slate-200 bg-white ${padding}`} aria-label="Bảng xếp hạng Quiz Pack">
    <header className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><Trophy className="h-5 w-5" /></span>
      <div><h2 className="font-black text-slate-900">Bảng xếp hạng</h2><p className="mt-1 text-sm text-slate-500">Top 10 người học có thành tích cao nhất</p></div>
    </header>

    <div className="mt-5">
      {loading ? <SkeletonRows compact={compact} /> : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm font-bold text-rose-900">Không thể tải bảng xếp hạng.</p><button type="button" onClick={() => void refetch()} className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700">Thử lại</button></div> : entries.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center"><p className="text-sm font-bold text-slate-800">Chưa có lượt thi hợp lệ.</p><p className="mt-1 text-sm leading-6 text-slate-500">Hãy hoàn thành Full Pack Challenge để xuất hiện trên bảng xếp hạng.</p></div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-3">Hạng</th><th className="px-2 py-3">Người học</th><th className="px-2 py-3">Điểm</th><th className="px-2 py-3">Thời gian</th><th className="px-2 py-3">Hoàn thành</th></tr></thead><tbody>{entries.map(entry => <tr key={`${entry.rank}-${entry.userName}-${entry.completedAt}`} className="border-b border-slate-100 last:border-0"><td className="px-2 py-3"><RankBadge rank={entry.rank} /></td><td className="px-2 py-3 font-semibold text-slate-900">{entry.userName}</td><td className="px-2 py-3 font-bold text-slate-900">{entry.score} điểm</td><td className="px-2 py-3 text-slate-600">{formatDuration(entry.durationSeconds)}</td><td className="px-2 py-3 text-slate-500">{dateFormatter.format(new Date(entry.completedAt))}</td></tr>)}</tbody></table></div>
        <div className="space-y-3 md:hidden">{entries.map(entry => <article key={`${entry.rank}-${entry.userName}-${entry.completedAt}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><RankBadge rank={entry.rank} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{entry.userName}</p><p className="mt-1 text-xs text-slate-500">{dateFormatter.format(new Date(entry.completedAt))}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{entry.score} điểm</p><p className="mt-1 text-xs text-slate-500">{formatDuration(entry.durationSeconds)}</p></div></article>)}</div>
      </>}
    </div>
    <div className="mt-4 flex justify-end"><button type="button" onClick={backToTop} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-[#FF6B00] hover:bg-orange-50"><ArrowUp className="h-3.5 w-3.5" />Lên đầu trang</button></div>
  </section>;
}
