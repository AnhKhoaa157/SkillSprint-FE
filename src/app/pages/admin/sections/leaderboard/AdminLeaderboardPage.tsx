import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Trophy, Search, Flame, ChevronLeft, ChevronRight, Medal, Crown } from "lucide-react";
import {
  getAdminLeaderboard,
  type AdminLeaderboardEntry,
  type AdminLeaderboardPeriod,
  type AdminLeaderboardResponse,
} from "../../../../../api/adminPointService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { Skeleton } from "../../../../components/ui/skeleton";
import { PERIOD_LABEL, formatDate } from "./pointPresentation";

const PERIODS: AdminLeaderboardPeriod[] = ["WEEKLY", "MONTHLY", "ALL_TIME"];
const PAGE_SIZE = 20;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} className="text-amber-500 fill-amber-400" />;
  if (rank === 2) return <Medal size={16} className="text-slate-400 fill-slate-200" />;
  if (rank === 3) return <Medal size={16} className="text-orange-400 fill-orange-200" />;
  return <span className="text-sm font-bold text-slate-400">{rank}</span>;
}

function EntryAvatar({ entry }: { entry: AdminLeaderboardEntry }) {
  const [errored, setErrored] = useState(false);
  const initial = (entry.fullName || entry.email || "?").charAt(0).toUpperCase();
  const showImage = !!entry.avatarObjectKey && !errored;

  if (showImage) {
    return (
      <img
        src={entry.avatarObjectKey ?? undefined}
        alt={entry.fullName}
        className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
      style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}
    >
      {initial}
    </div>
  );
}

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

  // Debounced search → resets to page 0 once the (trimmed) query settles.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearch(localSearch.trim());
      setPage(0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  // Fetch on every period / search / page change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminLeaderboard({ period, search, page, size: PAGE_SIZE })
      .then((res) => {
        if (active) setData(res);
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

  const entries = data?.entries.items ?? [];
  const totalPages = Math.max(1, data?.entries.totalPages ?? 1);
  const totalElements = data?.entries.totalItems ?? 0;

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
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Trophy size={22} className="text-[#FF6B00]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Bảng xếp hạng hệ thống</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Xếp hạng người dùng theo XP{periodRange ? ` · ${periodRange}` : ""}
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600">
          {totalElements.toLocaleString("vi-VN")} người dùng
        </span>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        {/* Period segmented control */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
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
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  activeTab ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm md:ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên người dùng…"
            className="pl-9 rounded-xl bg-slate-50"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-16 text-center">Hạng</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead className="text-right">Điểm</TableHead>
              <TableHead className="text-center">Chuỗi ngày</TableHead>
              <TableHead>Lần cuối nhận điểm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}

            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-sm text-slate-400">
                  Không có người dùng nào trên bảng xếp hạng.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              entries.map((entry) => {
                const topThree = entry.rank <= 3;
                return (
                  <TableRow
                    key={entry.userId}
                    onClick={() => navigate(`/admin/users/${encodeURIComponent(entry.userId)}/points`)}
                    className="cursor-pointer"
                    style={topThree ? { background: "rgba(255,107,0,0.05)" } : undefined}
                  >
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <RankBadge rank={entry.rank} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntryAvatar entry={entry} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">
                            {entry.fullName || "Chưa cập nhật tên"}
                          </p>
                          <p className="text-slate-500 text-xs truncate max-w-[220px]">{entry.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-slate-800">
                      {entry.points.toLocaleString("vi-VN")}
                      <span className="text-[10px] text-slate-400 ml-0.5">XP</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.streakDays > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-sm">
                          <Flame size={13} className="fill-amber-400 text-amber-500" />
                          {entry.streakDays}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(entry.lastPointDate)}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 bg-slate-50/60">
          <span className="text-xs text-slate-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg"
            >
              <ChevronLeft size={14} /> Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg"
            >
              Tiếp <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
