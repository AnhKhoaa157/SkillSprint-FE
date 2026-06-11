import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";
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
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* ── Top action bar ── */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#FF6B00] uppercase tracking-wider transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Quay lại Dashboard
        </button>

        {/* ── Hero identity card ── */}
        <div className="bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
          {/* Brand top indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,#FF6B00,#f59e0b)" }} />

          {/* Avatar + interactive upload */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-white shadow-md flex items-center justify-center text-[#FF6B00] text-xl font-black relative group overflow-hidden cursor-pointer"
            >
              {avatarPreview || profile?.avatarUrl
                ? <img src={avatarPreview || profile?.avatarUrl} alt={profile?.fullName || "Avatar"} className="w-full h-full object-cover" />
                : <span>{initials}</span>}

              {/* Hover overlay — signals image change */}
              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-black uppercase tracking-wider">
                {saving && avatarFile
                  ? <LoaderCircle size={16} className="animate-spin" />
                  : <><Camera size={14} className="mb-1" />Đổi ảnh</>}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center shadow">
              <Shield size={12} className="text-[#FF6B00]" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Identity text block */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
              {profile?.fullName || "Admin"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">{profile?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 uppercase tracking-wide">
                {roles}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                {isActive ? "Đang hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Dual-column dashboard grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Personal information (cols 1-2) */}
          <div className="lg:col-span-2 bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <User size={15} className="text-[#FF6B00]" />
                </div>
                <h2 className="text-base font-black text-slate-900">Thông tin cá nhân</h2>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">
                  Email
                </label>
                <div className="flex items-center gap-2.5 w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-400 cursor-not-allowed select-all">
                  <Mail size={14} className="text-slate-300 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Email không thể thay đổi</p>
              </div>

              {/* Full name */}
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của admin..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 focus:bg-white rounded-xl text-slate-800 text-sm font-semibold shadow-inner focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Save action */}
            <div className="pt-6">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-8 py-3 bg-[#FF6B00] hover:bg-[#FF5500] text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF6B00]"
              >
                {saving ? (
                  <><LoaderCircle size={14} className="animate-spin" />Đang lưu...</>
                ) : (
                  <><Save size={14} />Lưu thông tin</>
                )}
              </button>
            </div>
          </div>

          {/* System metadata (col 3) */}
          <div className="bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-2xl p-6 min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <Shield size={15} className="text-purple-500" />
                </div>
                <h2 className="text-base font-black text-slate-900">Hệ thống</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {/* User ID */}
                <div className="pb-5">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">User ID</p>
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono text-xs flex items-center justify-between gap-2 group">
                    <p className="font-mono text-xs text-slate-500 break-all leading-relaxed flex-1">
                      {profile?.userId}
                    </p>
                    <button
                      onClick={handleCopyId}
                      title="Copy User ID"
                      className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
                    >
                      {copied
                        ? <CheckCircle size={13} className="text-emerald-500" />
                        : <Copy size={13} className="text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* System roles */}
                <div className="py-5">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2.5">Vai trò hệ thống</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.roles || ["ADMIN"]).map(r => (
                      <span key={r} className="px-3 py-1 text-xs font-black bg-purple-50 text-purple-600 rounded-full">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Account status */}
                <div className="pt-5">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2.5">Trạng thái tài khoản</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-full ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 shadow-[0_0_6px_#22c55e]" : "bg-slate-400"}`} />
                    {isActive ? "Đang hoạt động" : "Không hoạt động"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
