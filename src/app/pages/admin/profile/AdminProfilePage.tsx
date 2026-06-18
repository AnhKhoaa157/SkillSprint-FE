import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../../../api/auth/authService";
import meService, { type MeResponse } from "../../../../api/utilities/meService";
import { ArrowLeft, Camera, Copy, CheckCircle, Shield, User, Mail, Save, LoaderCircle } from "lucide-react";

type ApiError = { status?: number; message?: string };

function toApiError(err: unknown): ApiError {
  if (typeof err === "object" && err !== null) return err as ApiError;
  return {};
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [copied, setCopied] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const me = await meService.getMe();
        if (!mounted) return;
        setProfile(me);
        setFullName(me.fullName || "");
      } catch (err: unknown) {
        const apiError = toApiError(err);
        if (apiError.status === 401) {
          toast.error("Phiên đăng nhập hết hạn");
          clearAuthTokens();
          navigate("/admin-login");
          return;
        }
        toast.error(apiError.message || "Không thể tải profile admin");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate]);

  // Revoke any pending object URL when the component unmounts
  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  }, [avatarPreview]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một tệp hình ảnh hợp lệ");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    // Allow re-selecting the same file later
    e.target.value = "";
  };

  const uploadAvatar = async (file: File): Promise<MeResponse> => {
    const { uploadUrl, objectKey } = await meService.getAvatarUploadUrl(file.name, file.type);
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error("Tải ảnh lên máy chủ lưu trữ thất bại");
    return meService.confirmAvatarUpload(objectKey);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let updated = profile;

      // 1) Push the avatar asset first (2-step pre-signed S3 flow) if a new file is staged.
      if (avatarFile) {
        updated = await uploadAvatar(avatarFile);
      }

      // 2) Persist the full name text change if it differs from what is on record.
      if (fullName !== (updated.fullName || "")) {
        updated = await meService.updateMe({ fullName });
      }

      setProfile(updated);
      setAvatarFile(null);
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      toast.success("Cập nhật thông tin thành công");
      window.dispatchEvent(new CustomEvent("skillSprint:profile-updated", { detail: updated }));
    } catch (err: unknown) {
      toast.error(toApiError(err).message || "Lỗi khi lưu profile");
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
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-4 w-40 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-36 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse" />
            <div className="h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile?.fullName || profile?.email || "A").charAt(0).toUpperCase();
  const roles = profile?.roles?.join(", ") || "ADMIN";
  const isActive = (profile?.status || "ACTIVE").toUpperCase() === "ACTIVE";
  const hasChanges = fullName !== (profile?.fullName || "") || !!avatarFile;

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#F8F9FA] bg-[radial-gradient(at_top_left,_rgba(255,107,0,0.05)_0%,_transparent_40%),_radial-gradient(at_bottom_right,_rgba(139,92,246,0.04)_0%,_transparent_45%)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Top action bar ── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#FF6B00] uppercase tracking-wider transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Quay lại Dashboard
        </motion.button>

        {/* ── Hero identity card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_rgba(30,41,59,0.04)] rounded-2xl p-6 relative flex flex-col sm:flex-row items-center gap-6"
        >
          {/* Avatar + interactive upload */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] p-1 shadow-[0_0_15px_rgba(255,107,0,0.2)] cursor-pointer group"
            >
              <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden flex items-center justify-center text-[#FF6B00] text-xl font-black relative">
                {avatarPreview || profile?.avatarUrl
                  ? <img src={avatarPreview || profile?.avatarUrl} alt={profile?.fullName || "Avatar"} className="w-full h-full object-cover" />
                  : <span>{initials}</span>}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-wider">
                  {saving && avatarFile
                    ? <LoaderCircle size={16} className="animate-spin" />
                    : <><Camera size={14} className="mb-1" />Đổi ảnh</>}
                </div>
              </div>
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center shadow">
              <Shield size={12} className="text-[#FF6B00]" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Identity text block */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
              {profile?.fullName || "Admin"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">{profile?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 uppercase tracking-wide hover:scale-105 duration-200 transition-transform cursor-default">
                {roles}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide hover:scale-105 duration-200 transition-transform cursor-default ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                {isActive ? "Đang hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Dual-column dashboard grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Personal information (cols 1-2) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_rgba(30,41,59,0.04)] rounded-2xl p-6 flex flex-col justify-between min-h-[400px]"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <User size={15} className="text-[#FF6B00]" />
                </div>
                <h2 className="text-base font-black text-slate-900">Thông tin cá nhân</h2>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 block">
                  Email
                </label>
                <div className="flex items-center gap-2.5 w-full px-4 py-3 bg-[#F1F5F9]/60 border border-slate-200/60 shadow-[inner_0_2px_4px_rgba(0,0,0,0.03)] rounded-xl text-sm text-slate-400 cursor-not-allowed select-all transition-all duration-200">
                  <Mail size={14} className="text-slate-300 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Email không thể thay đổi</p>
              </div>

              {/* Full name */}
              <div>
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 block">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của admin..."
                  className="w-full px-4 py-3 bg-[#F1F5F9]/60 border border-slate-200/60 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#FF6B00]/10 focus-visible:border-[#FF6B00] shadow-[inner_0_2px_4px_rgba(0,0,0,0.03)] rounded-xl text-slate-800 text-sm font-semibold focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Save action */}
            <div className="pt-6">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-gradient-to-r from-[#FF6B00] to-[#EA580C] text-white font-semibold shadow-[0_8px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_12px_24px_rgba(255,107,0,0.4)] hover:scale-[1.02] active:scale-95 active:translate-y-0.5 transition-all duration-150 rounded-xl px-6 py-2.5 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[0_8px_20px_rgba(255,107,0,0.3)] disabled:active:scale-100 disabled:active:translate-y-0"
              >
                {saving ? (
                  <><LoaderCircle size={16} className="animate-spin" />Đang lưu...</>
                ) : (
                  <><Save size={16} />Lưu thông tin</>
                )}
              </button>
            </div>
          </motion.div>

          {/* System metadata (col 3) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_rgba(30,41,59,0.04)] rounded-2xl p-6 min-h-[400px] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <Shield size={15} className="text-purple-500" />
                </div>
                <h2 className="text-base font-black text-slate-900">Hệ thống</h2>
              </div>

              <div className="divide-y divide-slate-100/50">
                {/* User ID */}
                <div className="pb-5">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">User ID</p>
                  <div className={`border rounded-lg p-3 font-mono text-xs flex justify-between items-center transition-colors duration-200 ${copied ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-900/5 border-slate-900/10"}`}>
                    <span className="text-slate-600 break-all leading-relaxed flex-1 mr-2">{profile?.userId}</span>
                    <button
                      onClick={handleCopyId}
                      title="Copy User ID"
                      className="p-1.5 hover:bg-slate-200/50 rounded-md transition-colors shrink-0 flex items-center justify-center"
                    >
                      {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* System roles */}
                <div className="py-5">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5">Vai trò hệ thống</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.roles || ["ADMIN"]).map(r => (
                      <span key={r} className="px-3 py-1.5 text-xs font-black bg-purple-50 text-purple-600 rounded-full hover:scale-105 duration-200 transition-transform cursor-default shadow-sm border border-purple-100/50">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Account status */}
                <div className="pt-5">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5">Trạng thái tài khoản</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-full hover:scale-105 duration-200 transition-transform cursor-default shadow-sm border ${isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-slate-100 text-slate-500 border-slate-200/50"}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 shadow-[0_0_6px_#22c55e]" : "bg-slate-400"}`} />
                    {isActive ? "Đang hoạt động" : "Không hoạt động"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
