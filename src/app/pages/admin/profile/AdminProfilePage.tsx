import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const prefersReducedMotion = useReducedMotion();
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
  const isActive = (profile?.status || "ACTIVE").toUpperCase() === "ACTIVE";
  const hasChanges = fullName !== (profile?.fullName || "") || !!avatarFile;

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-none bg-[radial-gradient(circle_at_10%_0%,rgba(255,107,0,0.12),transparent_25%),radial-gradient(circle_at_94%_100%,rgba(124,58,237,0.1),transparent_30%),#f8fafc] p-4 sm:p-6 lg:overflow-hidden">
      <AvatarCropDialog
        imageUrl={avatarCropSource}
        fileName={avatarCropFileName}
        onCancel={closeAvatarCropper}
        onCropped={handleCroppedAvatar}
      />
      <div className="mx-auto flex min-h-full max-w-6xl flex-col lg:h-full lg:min-h-0">
        <header className="flex shrink-0 flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/75 px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:bg-orange-50 hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              <ArrowLeft size={16} />
              Quay lại Dashboard
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">Tài khoản quản trị</p>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <p className="text-xs font-medium text-slate-400">Danh tính &amp; quyền truy cập</p>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Hồ sơ của tôi</h1>
          </div>
          <div className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-black ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" : "bg-slate-400"}`} />
            {isActive ? "Đang hoạt động" : "Không hoạt động"}
          </div>
        </header>

        <div className="mt-5 grid min-h-0 flex-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            className="relative flex min-h-[32rem] flex-col overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_24px_55px_rgba(15,23,42,0.24)] lg:min-h-0"
          >
            <div className="pointer-events-none absolute -right-16 -top-14 h-48 w-48 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">Quản trị viên</p>
                <Shield size={18} className="text-orange-300" aria-hidden="true" />
              </div>
              <button
                type="button"
                aria-label="Đổi ảnh đại diện"
                onClick={() => fileInputRef.current?.click()}
                className="group relative mt-6 h-24 w-24 rounded-[1.65rem] bg-gradient-to-br from-orange-400 via-orange-400 to-violet-500 p-1 shadow-lg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 motion-reduce:transition-none"
              >
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.35rem] bg-slate-900 text-2xl font-black text-orange-300">
                  {avatarPreview || profile?.avatarUrl
                    ? <img src={avatarPreview || profile?.avatarUrl} alt={profile?.fullName || "Avatar"} className="h-full w-full object-cover" />
                    : <span>{initials}</span>}
                  <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg transition-transform group-hover:scale-110">
                    {saving && avatarFile ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
                  </span>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />

              <h2 className="mt-5 truncate text-2xl font-black tracking-tight">{profile?.fullName || "Admin"}</h2>
              <p className="mt-1 truncate text-sm text-slate-300">{profile?.email}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(profile?.roles || ["ADMIN"]).map(role => (
                  <span key={role} className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100">{role}</span>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100"><Shield size={15} className="text-orange-300" />Quyền truy cập</div>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">Tài khoản được cấp quyền vận hành các khu vực quản trị của hệ thống.</p>
              </div>

              <div className="mt-auto border-t border-white/10 pt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">User ID</p>
                  <button type="button" onClick={handleCopyId} aria-label="Sao chép User ID" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                    {copied ? <CheckCircle size={16} className="text-emerald-300" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="break-all font-mono text-[11px] leading-5 text-slate-400">{profile?.userId}</p>
              </div>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, delay: prefersReducedMotion ? 0 : 0.08 }}
            className="flex min-h-0 flex-col rounded-[2rem] border border-white/90 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-7"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600"><User size={19} /></span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">Thông tin cá nhân</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Cập nhật danh tính hiển thị và ảnh đại diện của bạn.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="space-y-5">
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
              </div>

              <div className="rounded-2xl border border-orange-100 bg-[linear-gradient(145deg,#fffaf5,#fff7ed)] p-4">
                <p className="text-sm font-black text-slate-900">Ảnh đại diện</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">JPG, PNG hoặc WEBP. Dung lượng tối đa 5 MB.</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100">
                  <Camera size={15} />Đổi ảnh
                </button>
                {avatarFile && <p className="mt-3 text-xs font-bold text-orange-700">Ảnh mới sẵn sàng để lưu.</p>}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className={`text-xs ${hasChanges ? "font-bold text-orange-600" : "text-slate-400"}`}>{hasChanges ? "Bạn có thay đổi chưa được lưu." : "Mọi thông tin đã được đồng bộ."}</p>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
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
