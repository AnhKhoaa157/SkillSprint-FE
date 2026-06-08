import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";
import { Copy, CheckCircle, Shield, User, Mail, Save, LoaderCircle } from "lucide-react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const me = await meService.getMe();
        if (!mounted) return;
        setProfile(me);
        setFullName(me.fullName || "");
      } catch (err: any) {
        if (err?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn");
          clearAuthTokens();
          navigate("/admin-login");
          return;
        }
        toast.error(err?.message || "Không thể tải profile admin");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await meService.updateMe({ fullName });
      setProfile(updated);
      toast.success("Cập nhật thông tin thành công");
      window.dispatchEvent(new CustomEvent("skillSprint:profile-updated", { detail: updated }));
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      toast.success("Đã copy User ID");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không copy được User ID");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 font-sans space-y-6">
        <div className="h-36 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
          <div className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  const initials = (profile?.fullName || profile?.email || "A").charAt(0).toUpperCase();
  const roles = profile?.roles?.join(", ") || "ADMIN";
  const isActive = (profile?.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto py-10 px-4 font-sans space-y-6"
    >
      {/* Hero identity card */}
      <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* accent bar */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#7C3AED,#FF6B00)" }} />
        <div className="px-7 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar ring */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-violet-500/20">
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover rounded-2xl" />
                : initials}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center shadow">
              <Shield size={12} className="text-violet-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {profile?.fullName || "Admin"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wide">
                {roles}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                {isActive ? "Đang hoạt động" : "Không hoạt động"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Profile update form ── */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <User size={15} className="text-orange-500" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Thông tin cá nhân</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-400 cursor-not-allowed select-all">
              <Mail size={14} className="text-slate-300 shrink-0" />
              {profile?.email}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 ml-1">Email không thể thay đổi</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Nhập họ và tên hiển thị"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-2xl text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || fullName === (profile?.fullName || "")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: saving ? "#6B7280" : "linear-gradient(135deg,#FF6B00,#f37021)" }}
          >
            {saving ? (
              <><LoaderCircle size={14} className="animate-spin" />Đang lưu...</>
            ) : (
              <><Save size={14} />Lưu thông tin</>
            )}
          </button>
        </div>

        {/* ── System meta sidebar ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Shield size={15} className="text-violet-500" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Hệ thống</h2>
          </div>

          {/* User ID */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">User ID</p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-3 relative group">
              <p className="font-mono text-[11px] text-slate-500 break-all pr-7 leading-relaxed">
                {profile?.userId}
              </p>
              <button
                onClick={handleCopyId}
                title="Copy User ID"
                className="absolute right-2.5 top-2.5 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {copied
                  ? <CheckCircle size={13} className="text-emerald-500" />
                  : <Copy size={13} className="text-slate-400" />}
              </button>
            </div>
          </div>

          {/* System roles */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vai trò hệ thống</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.roles || ["ADMIN"]).map(r => (
                <span key={r} className="px-3 py-1 text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Account status */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái tài khoản</p>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 shadow-[0_0_6px_#22c55e]" : "bg-slate-400"}`} />
              {isActive ? "Đang hoạt động" : "Không hoạt động"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
