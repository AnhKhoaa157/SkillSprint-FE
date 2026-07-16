import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, RefreshCw, Search, WalletCards } from "lucide-react";
import { useNavigate } from "react-router";
import { getAdminUsers, type AdminUserSummary } from "../../../../../api/admin/adminUserService";

export default function CoinWalletSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminUsers(appliedQuery || undefined, 0, 20);
      setUsers(response.content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-2xl gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FF6B00] text-white shadow-[0_8px_20px_rgba(255,107,0,0.22)]">
              <WalletCards size={20} />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Quản lý ví Coin</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Chọn người dùng để xem số dư, lịch sử audit và điều chỉnh Coin có lưu người thực hiện cùng lý do.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQuery(query.trim());
          }}
        >
          <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, email hoặc mã người dùng"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="submit" className="h-11 rounded-xl bg-[#FF6B00] px-5 text-sm font-bold text-white transition hover:bg-[#e85f00]">
            Tìm người dùng
          </button>
        </form>
      </div>

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
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {users.map((user) => (
            <article key={user.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]">
                <WalletCards size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{user.fullName || "Chưa đặt tên"}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/users/${encodeURIComponent(user.id)}`, { state: { adminSection: "wallet" } })}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-50"
              >
                Mở ví <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
