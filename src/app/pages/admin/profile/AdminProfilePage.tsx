import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../../../api/auth/authService";
import meService, { type MeResponse } from "../../../../api/utilities/meService";
import { ArrowLeft, Camera, Copy, CheckCircle, Shield, User, Mail, Save, LoaderCircle } from "lucide-react";
import { AvatarCropDialog } from "../../../components/avatar/AvatarCropDialog";

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
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [avatarCropFileName, setAvatarCropFileName] = useState("");

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

  const closeAvatarCropper = () => {
    setAvatarCropSource((source) => {
      if (source) URL.revokeObjectURL(source);
      return null;
    });
    setAvatarCropFileName("");
  };

  useEffect(() => {
    return () => { if (avatarCropSource) URL.revokeObjectURL(avatarCropSource); };
  }, [avatarCropSource]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Vui lòng chọn ảnh JPG, PNG hoặc WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5 MB");
      return;
    }
    setAvatarCropFileName(file.name);
    setAvatarCropSource((source) => {
      if (source) URL.revokeObjectURL(source);
      return URL.createObjectURL(file);
    });
    e.target.value = "";
  };

  const handleCroppedAvatar = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview);
      return URL.createObjectURL(file);
    });
    closeAvatarCropper();
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
    <div className="min-h-screen bg-[#F8F9FA] bg-[radial-gradient(at_top_left,_rgba(255,107,0,0.08)_0%,_transparent_36%),_radial-gradient(at_bottom_right,_rgba(139,92,246,0.06)_0%,_transparent_42%)] p-4 sm:p-6 md:p-10">
      <AvatarCropDialog
        imageUrl={avatarCropSource}
        fileName={avatarCropFileName}
        onCancel={closeAvatarCropper}
        onCropped={handleCroppedAvatar}
      />
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mb-3 inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-[#FF6B00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              <ArrowLeft size={16} />
              Quay lại Dashboard
            </button>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">Tài khoản</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Hồ sơ quản trị</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý danh tính và thông tin tài khoản của bạn.</p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
            {isActive ? "Tài khoản hoạt động" : "Tài khoản không hoạt động"}
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)]"
          >
            <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative">
              <button
                type="button"
                aria-label="Đổi ảnh đại diện"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-400 to-violet-500 p-1 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
              >
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.35rem] bg-slate-900 text-2xl font-black text-orange-300">
                  {avatarPreview || profile?.avatarUrl
                    ? <img src={avatarPreview || profile?.avatarUrl} alt={profile?.fullName || "Avatar"} className="h-full w-full object-cover" />
                    : <span>{initials}</span>}
                  <span className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-[10px] font-black uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {saving && avatarFile ? <LoaderCircle size={18} className="animate-spin" /> : <><Camera size={16} className="mb-1" />Đổi ảnh</>}
                  </span>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Quản trị viên</p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-tight">{profile?.fullName || "Admin"}</h2>
              <p className="mt-1 truncate text-sm text-slate-300">{profile?.email}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(profile?.roles || ["ADMIN"]).map(role => (
                  <span key={role} className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100">{role}</span>
                ))}
              </div>

              <div className="my-6 h-px bg-white/10" />
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200"><Shield size={15} className="text-orange-300" />Quyền truy cập</div>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">Tài khoản có quyền vận hành các khu vực quản trị hệ thống.</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">User ID</p>
                    <button type="button" onClick={handleCopyId} aria-label="Sao chép User ID" className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                      {copied ? <CheckCircle size={15} className="text-emerald-300" /> : <Copy size={15} />}
                    </button>
                  </div>
                  <p className="break-all font-mono text-[11px] leading-5 text-slate-400">{profile?.userId}</p>
                </div>
              </div>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-7"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 pb-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><User size={19} /></span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">Thông tin cá nhân</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Cập nhật tên hiển thị và ảnh đại diện của tài khoản.</p>
              </div>
            </div>

            <div className="mt-7 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Email đăng nhập</label>
                <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                  <Mail size={16} className="shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{profile?.email}</span>
                  <span className="ml-auto hidden rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 sm:inline">Không thể thay đổi</span>
                </div>
              </div>

              <div>
                <label htmlFor="admin-full-name" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tên hiển thị</label>
                <input
                  type="text"
                  id="admin-full-name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của admin..."
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus-visible:border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-100"
                />
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm font-bold text-slate-800">Ảnh đại diện</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Chọn ảnh ở panel bên trái. Ảnh JPG, PNG hoặc WEBP, tối đa 5 MB.</p>
                {avatarFile && <p className="mt-2 text-xs font-bold text-orange-700">Ảnh mới đã sẵn sàng để lưu.</p>}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-xs ${hasChanges ? "font-bold text-orange-600" : "text-slate-400"}`}>{hasChanges ? "Bạn có thay đổi chưa được lưu." : "Chưa có thay đổi nào cần lưu."}</p>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-[#FF6B00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {saving ? <><LoaderCircle size={16} className="animate-spin" />Đang lưu...</> : <><Save size={16} />Lưu thay đổi</>}
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
