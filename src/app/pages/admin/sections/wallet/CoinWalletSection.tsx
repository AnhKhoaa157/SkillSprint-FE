import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, RefreshCw, Search, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getAdminUsers, type AdminUserSummary } from "../../../../../api/admin/adminUserService";
import { CoinWalletAuditSection } from "../../userDetail/CoinWalletAuditSection";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";

export default function CoinWalletSection() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const reduceMotion = useReducedMotion();
  const pageSize = 20;

  const load = useCallback(async (nextPage = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
      setLoadMoreError("");
    } else {
      setLoading(true);
      setError("");
    }
    try {
      const response = await getAdminUsers(appliedQuery || undefined, nextPage, pageSize);
      setUsers(current => append ? [...current, ...response.content] : response.content);
      setTotalUsers(response.totalElements);
      setPage(nextPage);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không thể tải danh sách người dùng.";
      if (append) setLoadMoreError(message);
      else setError(message);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [appliedQuery, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mx-auto w-full max-w-5xl">
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 190, damping: 24 }} className="relative overflow-hidden rounded-[2rem] border border-orange-200/80 bg-[linear-gradient(135deg,#FFF9F3_0%,#FFFFFF_52%,#FFF2E3_100%)] p-6 shadow-[0_18px_45px_rgba(194,65,12,0.09)] sm:p-8">
        <motion.div aria-hidden="true" className="pointer-events-none absolute -right-24 top-8 h-28 w-[32rem] -rotate-[18deg] bg-gradient-to-r from-transparent via-orange-200/60 to-transparent blur-xl" animate={reduceMotion ? undefined : { x: ["-10%", "12%", "-10%"], opacity: [0.18, 0.72, 0.18] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-10 hidden sm:block"><motion.span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-orange-200" animate={reduceMotion ? undefined : { y: [0, -10, 0], opacity: [0.28, 1, 0.28] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} /><motion.span className="absolute right-10 top-8 h-2 w-2 rounded-full bg-[#FF9A3C]" animate={reduceMotion ? undefined : { y: [0, 10, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} /><motion.span className="absolute right-4 top-20 h-5 w-5 rounded-full border border-orange-200" animate={reduceMotion ? undefined : { scale: [0.72, 1.12, 0.72], opacity: [0.15, 0.65, 0.15] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }} /></div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-2xl gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#FF6B00,#FF9A3C)] text-white shadow-[0_10px_22px_rgba(255,107,0,0.22)]">
              <WalletCards size={20} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Ví người dùng</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Quản lý Coin</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Tra cứu số dư, lịch sử và điều chỉnh Coin có lưu audit.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white/85 px-3 text-xs font-bold text-[#FF6B00] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        <form
          className="relative mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQuery(query.trim());
          }}
        >
          <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 text-sm shadow-[0_6px_20px_rgba(15,23,42,0.05)] transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
            <Search size={17} className="text-[#FF6B00]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên, email hoặc mã người dùng"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#FF6B00,#FF9137)] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.99]">
            <Search size={16} /> Tìm người dùng
          </button>
        </form>
      </motion.div>

      {loading ? (
        <div className="grid min-h-56 place-items-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#FF6B00]" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 font-bold underline underline-offset-4">Thử lại</button>
        </div>
      ) : users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Không tìm thấy người dùng phù hợp.
        </div>
      ) : (
        <section className="mt-7"><div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FF6B00]">Kết quả tìm kiếm</p><h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">Chọn một ví để quản lý</h3></div><span className="rounded-xl border border-orange-100 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">Đang hiển thị {users.length}/{totalUsers} người dùng</span></div><div className="grid gap-3 sm:grid-cols-2">
          {users.map((user, index) => (
            <motion.article key={user.id} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, type: "spring", stiffness: 220, damping: 22 }} whileHover={reduceMotion ? undefined : { y: -4 }} className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-orange-200 hover:shadow-[0_18px_34px_rgba(194,65,12,0.1)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-[#FF6B00] transition group-hover:scale-105 group-hover:bg-[#FF6B00] group-hover:text-white">
                <WalletCards size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{user.fullName || "Chưa đặt tên"}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(user)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-transparent px-2.5 py-2 text-xs font-bold text-[#FF6B00] transition hover:border-orange-100 hover:bg-orange-50"
              >
                Mở ví <ArrowRight size={14} />
              </button>
            </motion.article>
          ))}
        </div>
          {users.length < totalUsers && <div className="mt-5 flex flex-col items-center gap-2">
            <button type="button" onClick={() => void load(page + 1, true)} disabled={loadingMore} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60">
              {loadingMore && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Đang tải thêm..." : "Tải thêm người dùng"}
            </button>
            {loadMoreError && <p className="text-center text-xs font-medium text-rose-600">{loadMoreError}</p>}
          </div>}
        </section>
      )}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-[2rem] border-white bg-[#F8FAFC] p-0 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.26)] sm:max-w-3xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-xl [&>button]:bg-white [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:shadow-sm">
          {selectedUser && <>
            <DialogHeader className="border-b border-orange-100 bg-[linear-gradient(135deg,#FFF8F0,#FFFFFF)] px-6 pb-5 pt-6 text-left sm:px-7 sm:pt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Quản lý ví Coin</p>
              <DialogTitle className="pr-10 text-xl font-black tracking-[-0.03em] text-slate-950">Ví của {selectedUser.fullName || selectedUser.email}</DialogTitle>
              <DialogDescription className="pr-8 text-xs leading-5 text-slate-500">{selectedUser.email} · Xem số dư, lịch sử và điều chỉnh Coin có lưu audit.</DialogDescription>
            </DialogHeader>
            <div className="p-4 sm:p-5">
              <CoinWalletAuditSection userId={selectedUser.id} canAdjust />
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
