import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";
import { Copy } from "lucide-react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

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
      toast.success("Đã copy User ID");
    } catch {
      toast.error("Không copy được User ID");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-20" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-10 bg-slate-100 rounded-xl w-32 mt-6" />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-4">
            <div className="h-3 bg-slate-100 rounded w-16" />
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-3 bg-slate-100 rounded w-24" />
            <div className="h-7 bg-slate-100 rounded-full w-16" />
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile?.fullName || profile?.email || "A").charAt(0).toUpperCase();
  const roles = profile?.roles?.join(", ") || "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto py-8 px-4 font-sans"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Left: Account Settings ── */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0 border border-violet-100">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">
                {profile?.fullName || "Chưa cập nhật tên"}
              </p>
              <button className="text-xs text-orange-500 hover:text-orange-600 transition-colors mt-1">
                Thay đổi ảnh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Email
              </label>
              <div className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed select-all">
                {profile?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white text-slate-700 rounded-xl text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#f37021] hover:bg-[#e05f13] text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-600/10 active:scale-[0.98] mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>

        {/* ── Right: System Meta ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              User ID
            </p>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-xs text-slate-500 break-all relative">
              <span className="pr-7 leading-relaxed">{profile?.userId}</span>
              <button
                onClick={handleCopyId}
                title="Copy User ID"
                className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Copy size={12} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Vai trò hệ thống
            </p>
            <span className="w-fit px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
              {roles}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Trạng thái tài khoản
            </p>
            <span className="w-fit inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Hoạt động
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
