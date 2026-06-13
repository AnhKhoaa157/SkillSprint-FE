import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, Users, ShieldCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import adminUserService, { type AdminUserSummary, type AdminUserDetail } from "../../../api/adminUserService";
import { PlanTypeBadge, PlanBadgeStyles } from "../../../components/admin/PlanTypeBadge";
import type { ServicePlanType } from "../../../api/adminSubscriptionPlansService";

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ACTIVE:  { bg: "rgba(34,197,94,0.08)",   text: "#16A34A", border: "rgba(34,197,94,0.2)",   label: "Hoạt động" },
  DISABLE: { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.2)", label: "Vô hiệu" },
  LOCKED:  { bg: "rgba(239,68,68,0.08)",   text: "#DC2626", border: "rgba(239,68,68,0.2)",   label: "Bị khóa" },
};

function statusBadge(status: string) {
  return STATUS_BADGE[String(status).toUpperCase()] ?? { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: status };
}

type AvatarCapableUser = AdminUserSummary & {
  avatarUrl?: string | null;
  avatar?: string | null;
  userAvatar?: string | null;
};

function getUserInitial(user: AdminUserSummary) {
  return (user.fullName || user.email || "?").charAt(0).toUpperCase();
}

function getUserAvatarUrl(user: AdminUserSummary) {
  const avatarUser = user as AvatarCapableUser;
  const candidate = avatarUser.avatarUrl || avatarUser.avatar || avatarUser.userAvatar;
  if (typeof candidate !== "string") return "";
  const trimmedCandidate = candidate.trim();
  const normalizedCandidate = trimmedCandidate.toLowerCase();
  if (!trimmedCandidate || normalizedCandidate === "null" || normalizedCandidate === "undefined") {
    return "";
  }
  return trimmedCandidate;
}

function UserAvatar({ user }: { user: AdminUserSummary }) {
  const avatarUrl = getUserAvatarUrl(user);
  const initial = getUserInitial(user);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const hasValidAvatarUrl = avatarUrl.trim().length > 0;
  const shouldShowImage = hasValidAvatarUrl && !imgError;

  return (
    <div className="relative flex w-9 h-9 shrink-0 items-center justify-center">
      {shouldShowImage ? (
        <img
          src={avatarUrl}
          alt={user.fullName || user.email || "User avatar"}
          className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            setImgError(true);
          }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-center"
          style={{
            background: "linear-gradient(135deg, #FF6B00, #F97316)",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.85rem",
          }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

function DynamicPlanBadge({ sub }: { sub: any }) {
  if (!sub) {
    return <span style={{ color: "#94A3B8", fontSize: "0.8rem", fontStyle: "italic" }}>Chưa đăng ký</span>;
  }

  // Admin accounts are forced to the "ADMIN" label + ADMIN_DEFAULT type even when the backend
  // only reports a custom planName; the badge type then drives the emerald fallback. A premium
  // name with no explicit type still resolves to the premium look.
  const isAdmin = sub.planType === "ADMIN_DEFAULT" || String(sub.planName).toUpperCase().includes("ADMIN");
  const isPremium = sub.planType === "PREMIUM" || String(sub.planName).toUpperCase().includes("PREMIUM");
  const planType: ServicePlanType = isAdmin ? "ADMIN_DEFAULT" : isPremium ? "PREMIUM" : (sub.planType ?? "FREE");
  const planName = isAdmin ? "ADMIN" : (sub.planName || "GÓI ẨN");

  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <div className="flex items-center gap-1.5">
        <PlanTypeBadge
          type={planType}
          label={planName}
          badgeColor={sub.badgeColor}
          badgeIcon={sub.badgeIcon}
          animationType={sub.animationType}
        />

        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shrink-0" 
          style={{ 
            background: sub.status?.toUpperCase() === "ACTIVE" ? "rgba(34,197,94,0.08)" : "#F1F5F9", 
            color: sub.status?.toUpperCase() === "ACTIVE" ? "#16A34A" : "#64748B",
            border: sub.status?.toUpperCase() === "ACTIVE" ? "1px solid rgba(34,197,94,0.15)" : "1px solid #E2E8F0"
          }}>
          {sub.status || "UNKNOWN"}
        </span>
      </div>
      
      <span style={{ color: "#94A3B8", fontSize: "0.7rem", fontWeight: 500 }}>
        {isAdmin || !sub.endDate 
          ? "Hết hạn: Vô hạn" 
          : `Hết hạn: ${new Date(sub.endDate).toLocaleDateString("vi-VN")}`}
      </span>
    </div>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10); 
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = (p: number, s = search) => {
    let cancelled = false;
    setLoading(true);
    adminUserService.getAdminUsers(s.trim() || undefined, p, size)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.content || []);
        setTotal(data.totalElements || (data.content?.length ?? 0));
        setPage(p);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    const cancel = load(0);
    return () => cancel?.();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6" style={{ fontFamily: "'Inter',sans-serif" }}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "#0F172A" }}>Quản lý người dùng</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Theo dõi, tìm kiếm và cập nhật tài khoản người dùng hệ thống</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#334155" }}>
              Tổng: {total.toLocaleString()} tài khoản
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Tổng tài khoản", value: total.toLocaleString(), icon: Users, color: "#FF6B00", bg: "rgba(255,107,0,0.06)" },
            { label: "Trang hiện tại", value: String(users.length), icon: ShieldCheck, color: "#EA580C", bg: "rgba(234,88,12,0.06)" },
            { label: "Tài khoản hoạt động", value: users.filter(u => String(u.status).toUpperCase() === "ACTIVE").length.toString(), icon: RefreshCw, color: "#22c55e", bg: "rgba(34,197,94,0.06)" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                <c.icon size={16} style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold" style={{ color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1 }}>{c.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{c.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="p-4 flex flex-col md:flex-row md:items-center gap-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && load(0)}
                placeholder="Tìm email hoặc tên..."
                className="w-full h-9 pl-9 pr-3 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => load(0)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}>
                Tìm kiếm
              </button>
              <button onClick={() => { setSearch(""); load(0, ""); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#64748B" }}>
                Xóa lọc
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Trang {page + 1}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  {["Người dùng", "Vai trò", "Trạng thái", "Gói đăng ký", "Cập nhật lần cuối", "Hành động"].map(col => (
                    <th key={col} style={{ padding: "12px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j} style={{ padding: "14px 14px" }}>
                        <div className="h-4 rounded-lg animate-pulse" style={{ background: "#F1F5F9", width: j === 1 ? "80%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                      Không có người dùng phù hợp.
                    </td>
                  </tr>
                )}
                {!loading && users.map((u) => {
                  const badge = statusBadge(u.status || "");
                  const sub = u.currentSubscription; 

                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} />
                          <div className="min-w-0">
                            <p style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.84rem", lineHeight: 1.2 }}>{u.fullName || "Chưa cập nhật tên"}</p>
                            <p style={{ color: "#64748B", fontSize: "0.78rem", marginTop: 2 }} className="truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "rgba(249,115,22,0.06)", color: "#EA580C", border: "1px solid rgba(249,115,22,0.15)" }}>
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <DynamicPlanBadge sub={sub} />
                      </td>

                      <td style={{ padding: "12px 14px", color: "#64748B", fontSize: "0.78rem" }}>
                        {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => navigate(`/admin/users/${encodeURIComponent(u.id)}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                          style={{ background: "rgba(255,107,0,0.07)", border: "1px solid rgba(255,107,0,0.2)", color: "#C2410C" }}
                          onMouseEnter={e => { if(e.currentTarget) e.currentTarget.style.background = "rgba(255,107,0,0.14)"; }}
                          onMouseLeave={e => { if(e.currentTarget) e.currentTarget.style.background = "rgba(255,107,0,0.07)"; }}>
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F1F5F9", background: "#FAFAFA" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Hiển thị {users.length} / {total.toLocaleString()} người dùng</span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(Math.max(0, page - 1))} disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                ← Trước
              </button>
              <button onClick={() => load(page + 1)} disabled={users.length < size || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                Tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* Badge keyframes + Tailwind safelist (single source: components/admin/PlanTypeBadge). */}
        <PlanBadgeStyles />
    </motion.div>
  );
}