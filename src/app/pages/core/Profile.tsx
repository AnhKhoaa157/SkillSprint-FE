import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Award, Crown, Bell, Shield, Zap, LogOut,
  ChevronDown, AlertTriangle, Check, Trash2, CalendarClock, Loader2, MailCheck, BadgeCheck,
  Copy, Eye, EyeOff, HardDrive, Layers, Upload,
  Gem, Sparkles, RefreshCw, AlertCircle, ArrowUp, ArrowDown, X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens, getStoredUserProfile, type StoredUserProfile } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";
import { getCurrentSubscription, getQuotaStatus, cancelSubscription } from "../../../api/subscriptionsService";
import { listSubscriptionPlans, formatPlanPrice, isFeatureEnabled, resolvePlanFeatures, type PublicPlanResponse, type PublicPlanFeature } from "../../../api/adminSubscriptionPlansService";
import { createSepayPayment, getPaymentDetail } from "../../../api/sepayPaymentService";
import type { SepayPaymentCreateResponse, SepayPaymentDetailResponse, CurrentSubscriptionResponse, QuotaStatusResponse, ServicePlanType } from "../../../api/skillSprintModels";
import { PlanTypeBadge, PlanBadgeStyles } from "../../../components/admin/PlanTypeBadge";
import { normalizePlanType } from "../../../utils/adminStatusHelpers";

/* ─── Tokens ─── */
const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const BDR  = "#E5E7EB";
const CARD = "#FFFFFF";
const SH   = "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)";

/* ─── Sub-nav items ─── */
const TABS = [
  { id:"account",       label:"Tài khoản",            icon:User,   danger:false },
  { id:"achievements",  label:"Thành tựu",            icon:Award,  danger:false },
  { id:"subscription",  label:"Quản lý gói",          icon:Crown,  danger:false },
  { id:"notifications", label:"Thông báo",            icon:Bell,   danger:false },
  { id:"privacy",       label:"Bảo mật",              icon:Shield, danger:false },
  { id:"integrations",  label:"Tiện ích tích hợp",    icon:Zap,    danger:false },
];

type UserProfileViewModel = {
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  timeZone: string;
  status: string;
  roles: string[];
  roleLabel: string;
};

function emptyProfile(): UserProfileViewModel {
  return {
    userId: "",
    email: "",
    emailVerified: false,
    fullName: "Học viên",
    firstName: "",
    lastName: "",
    avatarUrl: "",
    timeZone: "Asia/Ho_Chi_Minh (GMT+7)",
    status: "-",
    roles: [],
    roleLabel: "Học viên",
  };
}

function mapStoredProfile(stored: StoredUserProfile): UserProfileViewModel {
  const fallbackName = stored.fullName || [stored.firstName, stored.lastName].filter(Boolean).join(" ").trim() || "Học viên";

  return {
    userId: "",
    email: stored.email,
    emailVerified: false,
    fullName: fallbackName,
    firstName: stored.firstName,
    lastName: stored.lastName,
    avatarUrl: "",
    timeZone: "Asia/Ho_Chi_Minh (GMT+7)",
    status: "-",
    roles: stored.role ? [stored.role] : [],
    roleLabel: stored.role === "ADMIN" ? "Admin" : "Học viên",
  };
}

function mapMeResponse(me: MeResponse): UserProfileViewModel {
  const parts = me.fullName.trim().split(/\s+/);
  return {
    userId: me.userId,
    email: me.email,
    emailVerified: me.emailVerified,
    fullName: me.fullName || "Học viên",
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
    avatarUrl: me.avatarUrl || "",
    timeZone: me.timeZone || "Asia/Ho_Chi_Minh (GMT+7)",
    status: me.status || "-",
    roles: me.roles || [],
    roleLabel: me.roles?.includes("ADMIN") ? "Admin" : "Học viên",
  };
}

/**
 * Returns up to two initials from a display name.
 * Single-word names → first two characters ("UIAKhoa" → "UK" is first+last if multi-word,
 * but "UIAKhoa" alone → "UI").
 * Multi-word names → first character of first word + first character of last word.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function compactUserId(userId: string): string {
  if (!userId) return "-";

  const numericId = Number(userId);
  if (Number.isFinite(numericId)) {
    return `US-${Math.abs(Math.floor(numericId)).toString(36).toUpperCase().slice(-6).padStart(6, "0")}`;
  }

  const compact = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `US-${compact.slice(-6).padStart(6, "0")}`;
}

/* ─── Input field ─── */
function Input({
  label, value, onChange, placeholder, type="text", disabled=false,
  hint,
}: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; disabled?:boolean; hint?:string;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      <label style={{ fontSize:"0.8rem", fontWeight:600, color:T1, fontFamily:F }}>{label}</label>
      <input
        type={type} value={value} disabled={disabled}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding:"10px 14px", borderRadius:"9px",
          border:`1.5px solid ${BDR}`,
          background: disabled ? "#F9FAFB" : CARD,
          fontFamily:F, fontSize:"0.875rem", color:T1,
          outline:"none", transition:"border-color 0.15s",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e=>{ if(!disabled) e.target.style.borderColor=OG; }}
        onBlur={e=>{ e.target.style.borderColor=BDR; }}
      />
      {hint && <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F }}>{hint}</p>}
    </div>
  );
}

/* ─── Select field ─── */
function Select({
  label, value, onChange, options,
}: {
  label:string; value:string;
  onChange:(v:string)=>void; options:string[];
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      <label style={{ fontSize:"0.8rem", fontWeight:600, color:T1, fontFamily:F }}>{label}</label>
      <div style={{ position:"relative" }}>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{
            width:"100%", padding:"10px 36px 10px 14px",
            borderRadius:"9px", border:`1.5px solid ${BDR}`,
            background:CARD, fontFamily:F, fontSize:"0.875rem", color:T1,
            outline:"none", appearance:"none", cursor:"pointer",
            transition:"border-color 0.15s",
          }}
          onFocus={e=>{ e.target.style.borderColor=OG; }}
          onBlur={e=>{ e.target.style.borderColor=BDR; }}
        >
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={15} color={T3} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
      </div>
    </div>
  );
}

/* ─── Section heading ─── */
function SectionHeading({ title }: { title:string }) {
  return (
    <h3 style={{
      fontWeight:700, fontSize:"0.975rem", color:T1, marginBottom:"16px",
      paddingBottom:"10px", borderBottom:`1px solid ${BDR}`, fontFamily:F,
    }}>{title}</h3>
  );
}

/* ═══════════════════════════════════════════════
   ACCOUNT TAB
═══════════════════════════════════════════════ */
interface AccountTabProps {
  profile: UserProfileViewModel;
  onSave: (fullName: string) => Promise<void>;
  saving: boolean;
  onAvatarUploaded: (updated: MeResponse) => void;
}

function AccountTab({ profile, onSave, saving, onAvatarUploaded }: AccountTabProps) {
  const [fullName,   setFullName]   = useState(profile.fullName);
  const [email,      setEmail]      = useState(profile.email);
  const [timeZone,   setTimeZone]   = useState(profile.timeZone || "Asia/Ho_Chi_Minh (GMT+7)");
  const [showUserId, setShowUserId] = useState(false);

  const [saved,          setSaved]          = useState(false);
  const [deleteModal,    setDeleteModal]    = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarInitials = getInitials(profile.fullName || profile.email || "U");

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!e.target) return;
    e.target.value = "";          // reset so the same file can be re-selected
    if (!file) return;

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ảnh đại diện không được vượt quá ${MAX_MB} MB.`);
      return;
    }

    setUploadingAvatar(true);
    try {
      // Step 1 — get pre-signed S3 URL from backend
      const { uploadUrl, objectKey } = await meService.getAvatarUploadUrl(
        file.name,
        file.type || "image/jpeg",
      );

      // Step 2 — PUT binary directly to S3 (no auth headers — pre-signed URL)
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!s3Res.ok) throw new Error(`S3 upload failed (${s3Res.status})`);

      // Step 3 — confirm with backend and get updated profile
      const updated = await meService.confirmAvatarUpload(objectKey);
      onAvatarUploaded(updated);
      toast.success("Ảnh đại diện đã được cập nhật.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể tải ảnh lên. Vui lòng thử lại.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setTimeZone(profile.timeZone || "Asia/Ho_Chi_Minh (GMT+7)");
  }, [profile.fullName, profile.email]);

  const handleCopyUserId = async () => {
    if (!profile.userId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(profile.userId);
      toast.success("Đã copy User ID");
    } catch {
      toast.error("Không thể copy User ID");
    }
  };

  const handleSave = async () => {
    try {
      await onSave(fullName);
      setSaved(true);
      setTimeout(()=>setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật profile");
    }
  };



  return (
    <>
      {/* ── Avatar Upload ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Ảnh đại diện"/>

        {/* Hidden file input — triggered by the button below */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          {/* Preview — falls back to initials on broken S3 links */}
          {profile.avatarUrl && !previewImgError ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              onError={() => setPreviewImgError(true)}
              style={{
                width:"72px", height:"72px", borderRadius:"50%",
                objectFit:"cover", border:`3px solid ${OGLT}`,
                flexShrink:0,
              }}
            />
          ) : (
            <div style={{
              width:"72px", height:"72px", borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#FF6B00,#6366F1)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ fontSize:"22px", fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>
                {avatarInitials}
              </span>
            </div>
          )}

          {/* Upload control */}
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              style={{
                display:"inline-flex", alignItems:"center", gap:"7px",
                padding:"9px 18px", borderRadius:"9px",
                background: uploadingAvatar ? "#F3F4F6" : OG,
                color: uploadingAvatar ? T2 : "#fff",
                border:"none", cursor: uploadingAvatar ? "not-allowed" : "pointer",
                fontFamily:F, fontWeight:700, fontSize:"0.82rem",
                transition:"background 0.2s",
              }}
            >
              {uploadingAvatar
                ? <><Loader2 size={14} className="animate-spin" /> Đang tải lên...</>
                : <><Upload size={14} /> Đổi ảnh đại diện</>}
            </motion.button>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F }}>
              JPG, PNG, WEBP · Tối đa 5 MB
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Thông tin cá nhân"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3.5">
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", marginBottom:"3px" }}>
              <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F }}>Mã người dùng</p>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  disabled={!profile.userId}
                  title="Copy User ID"
                  style={{
                    width:"24px", height:"24px", borderRadius:"6px", border:`1px solid ${BDR}`,
                    background:"#FFFFFF", color:T2, display:"flex", alignItems:"center", justifyContent:"center",
                    cursor: profile.userId ? "pointer" : "not-allowed",
                    opacity: profile.userId ? 1 : 0.55,
                  }}
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserId(v => !v)}
                  disabled={!profile.userId}
                  title={showUserId ? "Ẩn User ID" : "Hiện User ID"}
                  style={{
                    width:"24px", height:"24px", borderRadius:"6px", border:`1px solid ${BDR}`,
                    background:"#FFFFFF", color:T2, display:"flex", alignItems:"center", justifyContent:"center",
                    cursor: profile.userId ? "pointer" : "not-allowed",
                    opacity: profile.userId ? 1 : 0.55,
                  }}
                >
                  {showUserId ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F, wordBreak:"break-all" }}>
              {!profile.userId ? "-" : showUserId ? profile.userId : compactUserId(profile.userId)}
            </p>
          </div>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background: profile.emailVerified ? "#ECFDF5" : "#FFF7ED" }}>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F, marginBottom:"3px" }}>Email</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F, display:"flex", alignItems:"center", gap:"6px" }}>
              {profile.emailVerified ? <MailCheck size={13} color="#059669" /> : <AlertTriangle size={13} color="#F97316" />}
              {profile.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
            </p>
          </div>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F, marginBottom:"3px" }}>Trạng thái</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F }}>{profile.status || "-"}</p>
          </div>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F, marginBottom:"3px" }}>Vai trò</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F }}>{profile.roles?.length ? profile.roles.join(", ") : profile.roleLabel}</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"14px", marginBottom:"14px" }}>
          <Input label="Họ và tên" value={fullName} onChange={setFullName} placeholder="Họ và tên"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input label="Địa chỉ Email" value={email} onChange={setEmail}
            type="email" placeholder="student@gmail.com" disabled
            hint="Email được quản lý bởi hệ thống máy chủ."/>
          <Input label="Múi giờ" value={timeZone} onChange={setTimeZone}
            placeholder="Asia/Ho_Chi_Minh (GMT+7)" disabled
            hint="Dữ liệu được đồng bộ từ hệ thống (chỉ xem)."/>
        </div>
      </div>

      {/* University Details — placeholder until backend provides this API */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Thông tin học vấn"/>
        <div style={{
          display:"flex", alignItems:"center", gap:"14px",
          padding:"16px 18px", borderRadius:"12px",
          background:"#FFF7ED", border:"1px solid #FED7AA",
        }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"rgba(255,107,0,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:"18px" }}>🎓</span>
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:"0.84rem", color:"#C2410C", fontFamily:F }}>Thông tin học vấn đang phát triển</p>
            <p style={{ fontSize:"0.75rem", color:"#EA580C", fontFamily:F, marginTop:"2px" }}>Tính năng cập nhật trường/chuyên ngành sẽ được bổ sung khi backend hỗ trợ.</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginBottom:"24px" }}>
        <SectionHeading title="Vùng nguy hiểm"/>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 16px", borderRadius:"10px",
          background:"#FFF1F2", border:"1px solid #FECDD3",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <AlertTriangle size={16} color="#EF4444"/>
            <div>
              <p style={{ fontWeight:700, fontSize:"0.875rem", color:"#991B1B", fontFamily:F }}>Xóa tài khoản</p>
              <p style={{ fontSize:"0.75rem", color:"#EF4444", fontFamily:F }}>
                Xóa vĩnh viễn toàn bộ dữ liệu. Không thể khôi phục sau khi xóa.
              </p>
            </div>
          </div>
          <button onClick={()=>setDeleteModal(true)}
            style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"7px 14px", borderRadius:"8px",
              background:"#EF4444", color:"#fff", border:"none",
              cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:"0.78rem",
              flexShrink:0,
            }}>
            <Trash2 size={12}/> Xóa tài khoản
          </button>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <motion.button
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            display:"flex", alignItems:"center", gap:"6px",
            padding:"11px 28px", borderRadius:"10px",
            background: saved
              ? "linear-gradient(135deg,#059669,#10B981)"
              : "linear-gradient(135deg,#FF6B00,#FF8C3A)",
            color:"#fff", border:"none", cursor:saving ? "not-allowed" : "pointer",
            fontFamily:F, fontWeight:700, fontSize:"0.9rem",
            boxShadow: saved
              ? "0 4px 14px rgba(5,150,105,0.32)"
              : "0 4px 14px rgba(255,107,0,0.32)",
            transition:"background 0.3s, box-shadow 0.3s",
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><Check size={15}/> Đã lưu!</> : "Lưu thay đổi"}
        </motion.button>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              style={{ background:CARD, borderRadius:"16px", padding:"28px", maxWidth:"420px", width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"#FFF1F2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                <Trash2 size={20} color="#EF4444"/>
              </div>
              <h3 style={{ fontWeight:900, fontSize:"1.1rem", color:T1, fontFamily:F, marginBottom:"8px" }}>Xóa tài khoản của bạn?</h3>
              <p style={{ fontSize:"0.875rem", color:T2, lineHeight:1.65, marginBottom:"20px", fontFamily:F }}>
                Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu, tiến độ, lộ trình và tệp CV. Không thể khôi phục.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setDeleteModal(false)}
                  style={{ flex:1, padding:"10px", borderRadius:"9px", border:`1px solid ${BDR}`, background:CARD, color:T2, fontFamily:F, fontWeight:600, cursor:"pointer" }}>
                  Hủy
                </button>
                <button style={{ flex:1, padding:"10px", borderRadius:"9px", background:"#EF4444", border:"none", color:"#fff", fontFamily:F, fontWeight:700, cursor:"pointer" }}>
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Placeholder tab ─── */
function PlaceholderTab({ label }:{ label:string }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:"36px", marginBottom:"12px" }}>🚧</div>
      <h3 style={{ fontWeight:700, fontSize:"1rem", color:T1, marginBottom:"6px", fontFamily:F }}>{label}</h3>
      <p style={{ color:T3, fontSize:"0.875rem", fontFamily:F }}>Mục này đang được phát triển.</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SUBSCRIPTION TAB
════════════════════════════════════════════════ */
function PlanFeature({ text, color="#374151", enabled=true }: { text: string; color?: string; enabled?: boolean }) {
  return (
    <li style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"0.82rem", color: enabled ? color : "#CBD5E1", textDecoration: enabled ? undefined : "line-through" }}>
      {enabled
        ? <Check size={13} color={color === "#374151" ? "#6B7280" : color} strokeWidth={2.5} style={{ flexShrink:0 }}/>
        : <X size={13} color="#CBD5E1" style={{ flexShrink:0 }}/>}
      {text}
    </li>
  );
}

function QuotaProgressBar({ label, used, total, icon: IconComponent }: { label: string; used: number; total: number | null; icon: React.ElementType }) {
  const isUnlimited = total === null;
  const percentage  = !isUnlimited && total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit   = !isUnlimited && percentage >= 100;
  const fillColor   = isAtLimit ? "#EF4444" : isNearLimit ? "#F59E0B" : OG;

  return (
    <div style={{ marginBottom:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <IconComponent size={14} color={T2} />
          <span style={{ fontFamily:F, fontWeight:600, fontSize:"0.80rem", color:T1 }}>{label}</span>
        </div>
        <span style={{ fontFamily:F, fontWeight:700, fontSize:"0.75rem", color: isUnlimited ? "#059669" : fillColor }}>
          {used}{isUnlimited ? " / ∞" : `/${total}`}
        </span>
      </div>
      {isUnlimited ? (
        <div style={{ width:"100%", height:"8px", borderRadius:"99px", background:"linear-gradient(90deg,#D1FAE5,#A7F3D0)", overflow:"hidden" }}>
          <div style={{ width:"100%", height:"100%", borderRadius:"99px", background:"linear-gradient(90deg,#059669,#10B981)" }} />
        </div>
      ) : (
        <div style={{ width:"100%", height:"8px", borderRadius:"99px", background:"#E5E7EB", overflow:"hidden" }}>
          <motion.div
            initial={{ width:0 }}
            animate={{ width:`${percentage}%` }}
            transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
            style={{ height:"100%", borderRadius:"99px", background:`linear-gradient(90deg,${fillColor},${fillColor}DD)` }}
          />
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 120;

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style:"currency", currency:"VND" }).format(amount);
}

function SubscriptionTab({ onSubscriptionChanged }: { onSubscriptionChanged?: () => void }) {
  /* ── Server data ── */
  const [subData,        setSubData]        = useState<CurrentSubscriptionResponse | null>(null);
  const [quotaData,      setQuotaData]      = useState<QuotaStatusResponse | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PublicPlanResponse[]>([]);
  const [loading,        setLoading]        = useState(true);

  /* ── Checkout (upgrade) flow ── */
  const [checkoutOpen,    setCheckoutOpen]    = useState(false);
  const [checkoutStep,    setCheckoutStep]    = useState<"checkout"|"success"|"error">("checkout");
  const [paymentData,     setPaymentData]     = useState<SepayPaymentCreateResponse | null>(null);
  const [paymentDetail,   setPaymentDetail]   = useState<SepayPaymentDetailResponse | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createError,     setCreateError]     = useState<string | null>(null);
  const [pollingActive,   setPollingActive]   = useState(false);
  const [pollStatusText,  setPollStatusText]  = useState("");
  const [pollError,       setPollError]       = useState<string | null>(null);
  const [copied,          setCopied]          = useState(false);
  const [qrLoaded,        setQrLoaded]        = useState(false);

  /* ── Cancel flow ── */
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading,     setCancelLoading]     = useState(false);

  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptRef = useRef(0);
  const paymentIdRef   = useRef<string | null>(null);

  /* ── Load subscription, quota, and available plans ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sub, quota, plans] = await Promise.all([
        getCurrentSubscription(),
        getQuotaStatus(),
        listSubscriptionPlans().catch(() => [] as PublicPlanResponse[]),
      ]);
      setSubData(sub);
      setQuotaData(quota);
      setAvailablePlans(plans);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  /* ── Plan registry ── */
  type PlanId = "starter"|"skill_builder"|"career_premium";
  const planValue: Record<PlanId,number> = { starter:0, skill_builder:1, career_premium:2 };
  const planApiType: Record<PlanId,string> = { starter:"FREE", skill_builder:"SKILL_BUILDER", career_premium:"PREMIUM" };

  // ── Single source of truth: identify plans by price, NOT raw index ──
  // The BE list may or may not include the FREE plan, so we explicitly split
  // free vs paid (sorted ascending) instead of assuming positions [0]/[1].
  const freePlan  = availablePlans.find(p => p.monthlyPrice <= 0) ?? null;
  const paidPlans = availablePlans.filter(p => p.monthlyPrice > 0).sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  const planByKey: Record<PlanId, PublicPlanResponse | null> = {
    starter:        freePlan,
    skill_builder:  paidPlans[0] ?? null,
    career_premium: paidPlans[1] ?? null,
  };

  // Dynamic plan names from BE; fall back to static label if not loaded yet
  const planLabel: Record<PlanId,string> = {
    starter:        planByKey.starter?.planName        ?? "Starter",
    skill_builder:  planByKey.skill_builder?.planName  ?? "Skill Builder",
    career_premium: planByKey.career_premium?.planName ?? "Career Premium",
  };

  // Dynamic price labels from BE via the shared localization utility ("89.000 đ" /
  // "Miễn phí"); fall back to static if plans not loaded yet.
  const planDisplayPrice: Record<PlanId,string> = {
    starter:        "Miễn phí",
    skill_builder:  planByKey.skill_builder  ? formatPlanPrice(planByKey.skill_builder.monthlyPrice, planByKey.skill_builder.currency)   : "89.000 đ",
    career_premium: planByKey.career_premium ? formatPlanPrice(planByKey.career_premium.monthlyPrice, planByKey.career_premium.currency) : "199.000 đ",
  };
  const planPriceSub: Record<PlanId,string|null> = {
    starter:        null,
    skill_builder:  "/ tháng",
    career_premium: "/ tháng",
  };

  // Dynamic feature lists from BE (featureName + enabled); fall back to static if not loaded
  const staticStarterFeatures: PublicPlanFeature[] = [
    { featureKey: "fallback_roadmaps", featureName: "Tối đa 3 lộ trình" },
    { featureKey: "fallback_pomodoro", featureName: "Công cụ Pomodoro cơ bản" },
    { featureKey: "fallback_community", featureName: "Tham gia cộng đồng" },
  ];
  // Resolve via the shared normalizer so BE naming/shape drift (features /
  // planFeatures / featureList; string or object elements) doesn't blank the list.
  const planFeatureList: Record<PlanId,PublicPlanFeature[]> = {
    starter:        planByKey.starter        ? resolvePlanFeatures(planByKey.starter)        : staticStarterFeatures,
    skill_builder:  resolvePlanFeatures(planByKey.skill_builder),
    career_premium: resolvePlanFeatures(planByKey.career_premium),
  };

  // Dynamic benefit bullets from BE (jsonb string[]); same per-plan source as
  // planFeatureList, read with `?? []` exactly like PricingModal's toDisplayPlan.
  const planBenefitsList: Record<PlanId,string[]> = {
    starter:        planByKey.starter?.benefits ?? [],
    skill_builder:  planByKey.skill_builder?.benefits ?? [],
    career_premium: planByKey.career_premium?.benefits ?? [],
  };

  const rawPlanType = subData?.plan?.planType;
  const rawPlanId = subData?.plan?.planId;
  const rawPlanName = subData?.plan?.planName;

  const hasCurrentId = !!rawPlanId && availablePlans.some(p => p.planId === rawPlanId);
  const currentPrice = (() => {
    if (hasCurrentId) return availablePlans.find(p => p.planId === rawPlanId)?.monthlyPrice ?? 0;
    if (rawPlanType === "PREMIUM") return planByKey.career_premium?.monthlyPrice ?? 0;
    if (rawPlanType === "SKILL_BUILDER") return planByKey.skill_builder?.monthlyPrice ?? 0;
    return 0; // FREE
  })();

  const currentPlanId: PlanId = currentPrice === (planByKey.career_premium?.monthlyPrice ?? -1) ? "career_premium"
    : currentPrice === (planByKey.skill_builder?.monthlyPrice ?? -1) ? "skill_builder" : "starter";
  const currentPlanIndex = planValue[currentPlanId];

  // Benefits (jsonb string[]) of the user's active plan, sourced from the public
  // plan list (the simplified subData.plan shape doesn't carry benefits).
  const currentBenefits = planByKey[currentPlanId]?.benefits ?? [];

  /* ── Polling ── */
  const stopPolling = useCallback(() => {
    setPollingActive(false);
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  const doPollingCheck = useCallback(async () => {
    const pid = paymentIdRef.current;
    if (!pid) return;
    try {
      const detail = await getPaymentDetail(pid);
      setPaymentDetail(detail);
      const s = detail.status?.toUpperCase();
      if (s === "SUCCESS" || s === "COMPLETED" || s === "PAID") {
        stopPolling();
        setCheckoutStep("success");
        void loadData();
        onSubscriptionChanged?.();
        return;
      }
      if (s === "FAILED" || s === "EXPIRED" || s === "CANCELED") {
        stopPolling();
        setPollError(`Giao dịch ${detail.status?.toLowerCase()}. Vui lòng thử lại.`);
        setCheckoutStep("error");
        return;
      }
      pollAttemptRef.current += 1;
      setPollStatusText(`Đang kiểm tra giao dịch... (${pollAttemptRef.current})`);
      if (pollAttemptRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPollError("Hết thời gian xác nhận. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.");
        setCheckoutStep("error");
      }
    } catch {
      setPollStatusText(`Lỗi kết nối, thử lại... (${pollAttemptRef.current})`);
    }
  }, [stopPolling, loadData]);

  const startPolling = useCallback((paymentId: string) => {
    paymentIdRef.current   = paymentId;
    pollAttemptRef.current = 0;
    setPollingActive(true);
    setPollStatusText("Đang chờ xác nhận thanh toán...");
    void doPollingCheck();
    pollingRef.current = setInterval(doPollingCheck, POLL_INTERVAL_MS);
  }, [doPollingCheck]);

  /* ── Upgrade: create Sepay transaction ── */
  const handleUpgrade = async (planId: PlanId) => {
    setCreatingPayment(true);
    setCreateError(null);
    setPollError(null);
    setPaymentData(null);
    setPaymentDetail(null);
    setCopied(false);
    setQrLoaded(false);
    pollAttemptRef.current = 0;
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }

    try {
      const result = await createSepayPayment({ planType: planApiType[planId] });
      setPaymentData(result);
      setCheckoutStep("checkout");
      setCheckoutOpen(true);
      startPolling(result.paymentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo giao dịch. Vui lòng thử lại.";
      setCreateError(msg);
      setCheckoutStep("error");
      setCheckoutOpen(true);
    } finally {
      setCreatingPayment(false);
    }
  };

  /* ── Plan card click dispatcher ── */
  const handlePlanAction = (planId: PlanId) => {
    const idx = planValue[planId];
    if (idx === currentPlanIndex) return;
    if (idx < currentPlanIndex) { setCancelConfirmOpen(true); return; }
    void handleUpgrade(planId);
  };

  /* ── Manual payment verify ── */
  const handleManualVerify = async () => {
    const pid = paymentIdRef.current;
    if (!pid) return;
    setPollStatusText("Đang kiểm tra thủ công...");
    try {
      const detail = await getPaymentDetail(pid);
      setPaymentDetail(detail);
      const s = detail.status?.toUpperCase();
      if (s === "SUCCESS" || s === "COMPLETED" || s === "PAID") {
        stopPolling();
        setCheckoutStep("success");
        void loadData();
      } else {
        toast.info("Hệ thống chưa nhận được thanh toán. Vui lòng đợi thêm vài giây.");
        setPollStatusText(`Đang chờ xác nhận... (${pollAttemptRef.current})`);
      }
    } catch {
      toast.error("Không thể kết nối máy chủ. Thử lại sau.");
      setPollStatusText(`Đang chờ xác nhận... (${pollAttemptRef.current})`);
    }
  };

  /* ── Copy payment code ── */
  const handleCopy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); } catch {
      const ta = document.createElement("textarea");
      ta.value = code; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Đã sao chép mã thanh toán!");
    setTimeout(() => setCopied(false), 2500);
  };

  /* ── Close checkout modal ── */
  const closeCheckout = () => {
    stopPolling();
    setCheckoutOpen(false);
    setCheckoutStep("checkout");
    setPaymentData(null);
    setPaymentDetail(null);
    setCreateError(null);
    setPollError(null);
  };

  /* ── Cancel subscription ── */
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription();
      setCancelConfirmOpen(false);
      toast.success("Đã hủy gói thành công. Gói của bạn sẽ hết hạn vào cuối kỳ thanh toán.");
      void loadData();
      onSubscriptionChanged?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể hủy gói. Vui lòng thử lại.");
    } finally {
      setCancelLoading(false);
    }
  };

  /* ── Button style per card ── */
  function getButtonConfig(planId: PlanId) {
    const idx = planValue[planId];
    if (idx === currentPlanIndex) return { label:"Gói hiện tại", disabled:true, bg:"#F3F4F6", border:"#D1D5DB", color:"#9CA3AF", shadow:"none", icon:null };
    if (idx < currentPlanIndex)   return { label:"Không khả dụng", disabled:true, bg:"#F3F4F6", border:"#D1D5DB", color:"#9CA3AF", shadow:"none", icon:null };
    return { label:`Nâng cấp ${planLabel[planId]}`, disabled:false, bg:OG, border:OG, color:"#fff", shadow:"0 4px 14px rgba(255,107,0,0.28)", icon:<ArrowUp size={13}/> };
  }

  const PLANS = [
    { id:"starter" as PlanId,        accent:"#6B7280", bg: currentPlanId==="starter"        ? OGL:"#F9FAFB", border:currentPlanId==="starter"        ? `1px solid ${OG}`:BDR, badge:null },
    { id:"skill_builder" as PlanId,  accent:OG,        bg: currentPlanId==="skill_builder"  ? OGL:"#F9FAFB", border:currentPlanId==="skill_builder"  ? `1px solid ${OG}`:BDR, badge:currentPlanId==="starter"?"MOST POPULAR":null },
    { id:"career_premium" as PlanId, accent:OG,        bg: currentPlanId==="career_premium" ? OGL:"#F9FAFB", border:currentPlanId==="career_premium" ? `1px solid ${OG}`:BDR, badge:currentPlanId!=="career_premium"?"ĐỀ XUẤT":null },
  ];

  const bannerIcon  = currentPlanId==="career_premium" ? <Crown size={16} color={OG}/> : currentPlanId==="skill_builder" ? <Zap size={16} color={OG}/> : <Zap size={16} color="#9CA3AF"/>;
  const bannerTitle = rawPlanName || `${planLabel[currentPlanId]} Plan`;
  const bannerPrice = currentPlanId==="starter" ? "Miễn phí · 0đ / tháng" : `${planDisplayPrice[currentPlanId]} / tháng`;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 0" }}>
      <Loader2 size={20} className="animate-spin" style={{ color:T3 }}/>
      <span style={{ fontFamily:F, fontSize:"0.85rem", color:T3, marginLeft:"8px" }}>Đang tải dữ liệu gói...</span>
    </div>
  );

  return (
    <div>
      {/* ─── Current Plan Banner ─── */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", borderRadius:"12px", background:currentPlanId==="starter"?"#F9FAFB":OGL, border:`1px solid ${currentPlanId==="starter"?BDR:"rgba(255,107,0,0.18)"}`, marginBottom:"20px" }}>
        <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:OGL, border:"1px solid rgba(255,107,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {bannerIcon}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:T1, fontFamily:F, lineHeight:1 }}>{bannerTitle}</p>
          <p style={{ fontSize:"0.75rem", color:T3, fontFamily:F, marginTop:"2px" }}>{bannerPrice}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {/* Active badge */}
          <div style={{ padding:"4px 12px", borderRadius:"99px", background:"rgba(255,107,0,0.12)", border:"1.5px solid rgba(255,107,0,0.35)", display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:OG }}/>
            <span style={{ fontSize:"0.75rem", color:OG, fontWeight:700, fontFamily:F }}>Đang sử dụng</span>
          </div>
          {/* Cancel button — only for paid plans */}
          {currentPlanId !== "starter" && (
            <button
              onClick={() => setCancelConfirmOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"8px", background:"transparent", border:"1.5px solid #FECDD3", color:"#EF4444", fontFamily:F, fontWeight:600, fontSize:"0.75rem", cursor:"pointer" }}
            >
              <X size={12}/> Hủy gói
            </button>
          )}
        </div>
      </div>

      {/* ─── Quyền lợi của bạn (current plan benefits) ─── */}
      {currentBenefits.length > 0 && (
        <div style={{ padding:"16px 18px", borderRadius:"12px", border:`1px solid ${BDR}`, background:"#FAFBFC", marginBottom:"20px" }}>
          <SectionHeading title="Quyền lợi của bạn"/>
          <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px" }}>
            {currentBenefits.map((b, i) => (
              <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:"8px", fontSize:"0.84rem", color:T1, fontFamily:F, lineHeight:1.5 }}>
                <BadgeCheck size={15} color={OG} style={{ flexShrink:0, marginTop:"1px" }}/>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Usage & Limits ─── */}
      {quotaData && (
        <div style={{ padding:"16px 18px", borderRadius:"12px", border:`1px solid ${BDR}`, background:"#FAFBFC", marginBottom:"20px" }}>
          <SectionHeading title="Mức sử dụng & Giới hạn"/>
          <div style={{ display:"grid", gap:"4px" }}>
            {quotaData.usedWorkspaces  !== undefined && <QuotaProgressBar label="Lộ trình đang học"       used={quotaData.usedWorkspaces ??0} total={quotaData.maxWorkspaces  ?? null} icon={Layers}   />}
            {quotaData.usedStorageMb   !== undefined && <QuotaProgressBar label="Dung lượng lưu trữ (MB)" used={quotaData.usedStorageMb  ??0} total={quotaData.maxWorkspaceMb ?? null} icon={HardDrive} />}
            {quotaData.usedAiGenerate  !== undefined && <QuotaProgressBar label="Lượt hỏi AI (tháng này)" used={quotaData.usedAiGenerate  ??0} total={quotaData.aiGenerateLimit ?? null} icon={Zap}      />}
            {quotaData.usedUploads     !== undefined && <QuotaProgressBar label="Tệp đã tải lên"           used={quotaData.usedUploads     ??0} total={quotaData.maxUploads    ?? null} icon={Upload}   />}
          </div>
        </div>
      )}

      {/* ─── Plan Cards Grid ─── */}
      {/* items-stretch forces equal card heights; each card is flex-col with a
          flex-1 top section so the action buttons all align on the same line. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map(plan => {
          const btn = getButtonConfig(plan.id);
          const isCreating = creatingPayment;
          const idx = planValue[plan.id];
          const isDowngrade = idx < currentPlanIndex;
          const benefits = planBenefitsList[plan.id];
          return (
            <motion.div key={plan.id}
              className={`flex flex-col h-full justify-between p-6 ${isDowngrade ? "opacity-40 grayscale pointer-events-none select-none" : ""}`}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:planValue[plan.id]*0.06 }}
              whileHover={!btn.disabled ? { y:-2 } : {}}
              style={{ background:plan.bg, borderRadius:"14px", border:plan.border, boxShadow:plan.id===currentPlanId?"0 0 0 2px rgba(255,107,0,0.15)":"0 1px 4px rgba(0,0,0,0.04)", position:"relative", overflow:"hidden" }}
            >
              {/* Top section (badge, name, price, features) — grows to fill height */}
              <div className="flex-1">
                {plan.badge && (
                  <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
                    <span style={{ fontSize:"0.62rem", fontWeight:800, color:OG, letterSpacing:"0.1em", textTransform:"uppercase" }}>{plan.badge}</span>
                    <Crown size={11} color="#FBBF24" fill="#FBBF24"/>
                  </div>
                )}
                <p style={{ fontSize:"1rem", fontWeight:700, color:plan.id===currentPlanId?OG:plan.accent, fontFamily:F, marginBottom:"6px", marginTop:plan.badge?"0":"18px" }}>
                  {planLabel[plan.id]}
                </p>
                <div style={{ display:"flex", alignItems:"baseline", gap:"2px", marginBottom:"14px" }}>
                  <span style={{ fontSize:"1.8rem", fontWeight:900, letterSpacing:"-0.04em", color:plan.id==="starter"?T1:plan.accent }}>{planDisplayPrice[plan.id]}</span>
                  {planPriceSub[plan.id] && <span style={{ fontSize:"0.75rem", color:T3, marginLeft:"1px" }}>{planPriceSub[plan.id]}</span>}
                </div>
                {/* Benefits — premium bullets from the plan's jsonb string[], above
                    the feature list and separated by a divider (matches PricingModal). */}
                {benefits && benefits.length > 0 && (
                  <ul style={{ listStyle:"none", margin:"0 0 12px", padding:"0 0 12px", borderBottom:`1px solid ${BDR}`, display:"flex", flexDirection:"column", gap:"8px" }}>
                    {benefits.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2" style={{ fontSize:"0.82rem", color:T1, lineHeight:1.5 }}>
                        <Check size={16} color={OG} strokeWidth={2.5} className="flex-shrink-0" style={{ marginTop:"2px" }}/>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"8px" }}>
                  {(planFeatureList[plan.id] ?? []).map((f, fi) => (
                    <PlanFeature key={f.featureKey ?? fi} text={f.featureName} enabled={isFeatureEnabled(f)} color={plan.id===currentPlanId?T1:T2}/>
                  ))}
                </ul>
              </div>

              {/* Action button — pinned to bottom, aligned across all cards */}
              <motion.button
                whileHover={!btn.disabled ? { scale:1.02 } : {}}
                whileTap={!btn.disabled ? { scale:0.97 } : {}}
                disabled={btn.disabled || isCreating}
                onClick={() => handlePlanAction(plan.id)}
                className="mt-5"
                style={{ width:"100%", padding:"11px 0", borderRadius:"10px", background:btn.bg, border:`1.5px solid ${btn.border}`, color:btn.color, fontFamily:F, fontWeight:700, fontSize:"0.875rem", cursor:btn.disabled||isCreating?"not-allowed":"pointer", opacity:btn.disabled?0.65:1, boxShadow:btn.shadow, transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}
              >
                {isCreating && !btn.disabled && planValue[plan.id]>currentPlanIndex
                  ? <Loader2 size={13} className="animate-spin"/>
                  : btn.icon}
                {isCreating && !btn.disabled && planValue[plan.id]>currentPlanIndex ? "Đang xử lý..." : btn.label}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
          CHECKOUT MODAL (upgrade payment QR)
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={closeCheckout}
            style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}
          >
            <motion.div initial={{ opacity:0, scale:0.95, y:14 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ width:"100%", maxWidth:checkoutStep==="checkout"?"860px":"480px", background:checkoutStep==="checkout"?"#F7F9FC":"#111115", borderRadius:"20px", overflow:"hidden", boxShadow:"0 40px 90px rgba(0,0,0,0.55)", fontFamily:F, position:"relative" }}
            >
              {/* Close */}
              <button onClick={closeCheckout} style={{ position:"absolute", top:"14px", right:"14px", width:"30px", height:"30px", borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
                <X size={14} color={checkoutStep==="checkout"?"#4A5568":"rgba(255,255,255,0.6)"}/>
              </button>

              {/* ── CHECKOUT STEP ── */}
              {checkoutStep === "checkout" && paymentData && (
                <div style={{ display:"flex", minHeight:"500px" }}>
                  {/* Left — order summary */}
                  <div style={{ width:"38%", background:"#1A1B23", padding:"32px 28px", display:"flex", flexDirection:"column" }}>
                    <h3 style={{ fontSize:"1.2rem", fontWeight:850, color:"#fff", marginBottom:"16px", letterSpacing:"-0.02em" }}>Thanh toán đơn hàng</h3>
                    <p style={{ fontSize:"2rem", fontWeight:900, color:OG, letterSpacing:"-0.03em", marginBottom:"4px" }}>{formatVnd(paymentData.amount)}</p>
                    <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.4)", marginBottom:"20px" }}>Thanh toán một lần bảo mật</p>

                    {/* Payment code */}
                    <div style={{ background:"#FFF5EC", border:"1px solid #FFE0C2", borderRadius:"12px", padding:"14px", marginBottom:"18px" }}>
                      <p style={{ fontSize:"0.7rem", color:"#AA4700", marginBottom:"6px", fontWeight:700, letterSpacing:"0.06em" }}>MÃ THANH TOÁN (MEMO)</p>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px" }}>
                        <code style={{ fontSize:"1rem", fontWeight:900, color:"#1A202C", fontFamily:"monospace", wordBreak:"break-all", flex:1 }}>{paymentData.paymentCode}</code>
                        <button onClick={() => handleCopy(paymentData.paymentCode)} style={{ background:"#fff", border:"1px solid #FFE0C2", borderRadius:"7px", width:"32px", height:"32px", minWidth:"32px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:OG, flexShrink:0 }}>
                          {copied ? <Check size={14} color={OG}/> : <Copy size={14}/>}
                        </button>
                      </div>
                      <p style={{ fontSize:"0.68rem", color:OG, marginTop:"6px", fontWeight:600 }}>⚠️ Nhập chính xác mã này khi chuyển khoản</p>
                    </div>

                    {/* Bank info */}
                    <p style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"10px" }}>Tài khoản thụ hưởng</p>
                    {[
                      ["Ngân hàng",      paymentData.bank?.bankCode],
                      ["Số tài khoản",   paymentData.bank?.accountNumber],
                      ["Chủ tài khoản",  paymentData.bank?.accountName],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={{ display:"flex", justifyContent:"space-between", paddingBottom:"8px", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:"8px" }}>
                        <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.45)" }}>{lbl}</span>
                        <span style={{ fontSize:"0.82rem", color:"#fff", fontWeight:600, fontFamily:lbl==="Số tài khoản"?"monospace":F }}>{val ?? "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right — QR + instructions */}
                  <div style={{ flex:1, padding:"32px 36px", display:"flex", flexDirection:"column", alignItems:"center", gap:"20px" }}>
                    {pollingActive && (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"99px", background:"rgba(255,107,0,0.1)", border:"1px solid rgba(255,107,0,0.2)" }}>
                        <Loader2 size={12} className="animate-spin" color={OG}/>
                        <span style={{ fontSize:"0.72rem", color:OG, fontWeight:600 }}>{pollStatusText}</span>
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize:"1rem", fontWeight:800, color:"#1A202C", marginBottom:"4px", textAlign:"center" }}>Quét mã QR để thanh toán</h3>
                      <p style={{ fontSize:"0.78rem", color:"#718096", marginBottom:"14px", textAlign:"center" }}>Mở app Ngân hàng hoặc Ví điện tử</p>
                      <div style={{ width:"200px", height:"200px", borderRadius:"16px", overflow:"hidden", background:"#fff", padding:"10px", boxShadow:"0 16px 40px rgba(0,0,0,0.08)", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        {!qrLoaded && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#fff" }}><Loader2 size={24} className="animate-spin" color={OG}/></div>}
                        <img src={paymentData.qrUrl} alt="QR thanh toán" onLoad={() => setQrLoaded(true)} style={{ width:"100%", height:"100%", objectFit:"contain", display:qrLoaded?"block":"none" }}/>
                      </div>
                    </div>

                    <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:"12px", padding:"16px", width:"100%", maxWidth:"320px" }}>
                      <p style={{ fontSize:"0.78rem", fontWeight:800, color:OG, marginBottom:"8px", display:"flex", alignItems:"center", gap:"5px" }}><AlertCircle size={13}/> Hướng dẫn nhanh</p>
                      <ol style={{ margin:0, paddingLeft:"16px", display:"flex", flexDirection:"column", gap:"5px" }}>
                        {["Quét QR hoặc chuyển khoản thủ công.", `Số tiền: ${formatVnd(paymentData.amount)}`, `Nội dung: ${paymentData.paymentCode}`, "Bấm xác nhận sau khi ngân hàng trừ tiền."].map((t,i) => (
                          <li key={i} style={{ fontSize:"0.76rem", color:"#4A5568", lineHeight:1.5 }}>{t}</li>
                        ))}
                      </ol>
                    </div>

                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleManualVerify}
                      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", width:"100%", maxWidth:"320px", padding:"13px", borderRadius:"10px", background:OG, border:"none", color:"#fff", fontFamily:F, fontWeight:800, fontSize:"0.875rem", cursor:"pointer", boxShadow:"0 6px 18px rgba(255,107,0,0.28)" }}
                    >
                      <RefreshCw size={14}/> Xác Nhận Đã Chuyển Khoản
                    </motion.button>
                    <p style={{ fontSize:"0.7rem", color:"#718096" }}>Hệ thống tự động kiểm tra mỗi 5 giây.</p>
                  </div>
                </div>
              )}

              {/* ── SUCCESS STEP ── */}
              {checkoutStep === "success" && (
                <div style={{ minHeight:"360px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"40px 28px", background:"radial-gradient(circle at top, rgba(255,107,0,0.18) 0%, #111115 55%)" }}>
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:200, damping:12 }}
                    style={{ width:"76px", height:"76px", borderRadius:"50%", background:"rgba(255,107,0,0.15)", border:"1px solid rgba(255,107,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px", boxShadow:"0 0 0 10px rgba(255,107,0,0.07)" }}
                  >
                    <Check size={32} color={OG} strokeWidth={3}/>
                  </motion.div>
                  <p style={{ fontSize:"0.78rem", color:OG, fontWeight:800, letterSpacing:"0.12em", marginBottom:"8px" }}>THANH TOÁN THÀNH CÔNG</p>
                  <h3 style={{ fontSize:"1.5rem", fontWeight:900, color:"#fff", marginBottom:"8px" }}>Gói đã được kích hoạt!</h3>
                  <p style={{ fontSize:"0.88rem", color:"rgba(255,255,255,0.55)", marginBottom:"24px" }}>
                    Mã giao dịch: <span style={{ fontFamily:"monospace", color:"rgba(255,255,255,0.75)" }}>{paymentData?.paymentCode}</span>
                  </p>
                  <button onClick={closeCheckout} style={{ padding:"11px 28px", borderRadius:"10px", border:"none", background:OG, color:"#fff", fontFamily:F, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 18px rgba(255,107,0,0.32)" }}>
                    Đóng
                  </button>
                </div>
              )}

              {/* ── ERROR STEP ── */}
              {checkoutStep === "error" && (
                <div style={{ minHeight:"320px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"40px 28px", background:"radial-gradient(circle at top, rgba(239,68,68,0.1) 0%, #111115 55%)" }}>
                  <div style={{ width:"68px", height:"68px", borderRadius:"50%", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.35)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"14px" }}>
                    <AlertCircle size={30} color="#EF4444"/>
                  </div>
                  <p style={{ fontSize:"0.78rem", color:"#EF4444", fontWeight:800, letterSpacing:"0.12em", marginBottom:"6px" }}>THANH TOÁN THẤT BẠI</p>
                  <h3 style={{ fontSize:"1.3rem", fontWeight:900, color:"#fff", marginBottom:"8px" }}>{createError ? "Không thể tạo giao dịch" : "Giao dịch chưa hoàn tất"}</h3>
                  <p style={{ fontSize:"0.85rem", color:"rgba(255,255,255,0.5)", maxWidth:"320px", lineHeight:1.6, marginBottom:"22px" }}>{createError || pollError || "Đã xảy ra lỗi. Vui lòng thử lại."}</p>
                  <div style={{ display:"flex", gap:"10px" }}>
                    <button onClick={closeCheckout} style={{ padding:"10px 20px", borderRadius:"9px", border:"1px solid rgba(255,255,255,0.18)", background:"transparent", color:"rgba(255,255,255,0.8)", fontFamily:F, fontWeight:600, cursor:"pointer" }}>Đóng</button>
                    <button onClick={() => { closeCheckout(); }} style={{ padding:"10px 20px", borderRadius:"9px", border:"none", background:OG, color:"#fff", fontFamily:F, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}><RefreshCw size={13}/> Thử lại</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          CANCEL CONFIRMATION MODAL
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {cancelConfirmOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => !cancelLoading && setCancelConfirmOpen(false)}
            style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
          >
            <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }}
              onClick={e => e.stopPropagation()}
              style={{ background:CARD, borderRadius:"16px", padding:"28px", maxWidth:"420px", width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.18)", fontFamily:F }}
            >
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"#FFF1F2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"14px" }}>
                <AlertTriangle size={20} color="#EF4444"/>
              </div>
              <h3 style={{ fontWeight:900, fontSize:"1.05rem", color:T1, marginBottom:"8px" }}>Hủy gói {planLabel[currentPlanId]}?</h3>
              <p style={{ fontSize:"0.875rem", color:T2, lineHeight:1.65, marginBottom:"20px" }}>
                Gói của bạn sẽ tiếp tục hoạt động đến cuối kỳ thanh toán hiện tại. Sau đó tài khoản sẽ chuyển về gói <strong>Starter</strong> (miễn phí).
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setCancelConfirmOpen(false)} disabled={cancelLoading}
                  style={{ flex:1, padding:"10px", borderRadius:"9px", border:`1px solid ${BDR}`, background:CARD, color:T2, fontFamily:F, fontWeight:600, cursor:cancelLoading?"not-allowed":"pointer" }}>
                  Giữ gói
                </button>
                <button onClick={handleCancelSubscription} disabled={cancelLoading}
                  style={{ flex:1, padding:"10px", borderRadius:"9px", background:cancelLoading?"#F87171":"#EF4444", border:"none", color:"#fff", fontFamily:F, fontWeight:700, cursor:cancelLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                  {cancelLoading ? <><Loader2 size={14} className="animate-spin"/> Đang hủy...</> : "Xác nhận hủy gói"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   UNDER-DEVELOPMENT PLACEHOLDER (ENHANCED)
═══════════════════════════════════════════════ */
function DevPlaceholderTab({ label, icon, description }: { label: string; icon: string; description: string }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "20px",
        background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
        border: "1px solid #FED7AA",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
        fontSize: "32px",
      }}>
        {icon}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: "1rem", color: T1, marginBottom: "6px", fontFamily: F }}>
        {label}
      </h3>
      <p style={{ color: T3, fontSize: "0.82rem", fontFamily: F, maxWidth: "320px", margin: "0 auto 20px", lineHeight: 1.6 }}>
        {description}
      </p>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "8px 16px", borderRadius: "99px",
        background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)",
      }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: OG }} />
        <span style={{ fontSize: "0.76rem", color: OG, fontWeight: 700, fontFamily: F }}>Đang phát triển</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════ */
export default function Profile() {
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [profile, setProfile] = useState<UserProfileViewModel>(() => {
    const storedProfile = getStoredUserProfile();
    return storedProfile ? mapStoredProfile(storedProfile) : emptyProfile();
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subData, setSubData] = useState<CurrentSubscriptionResponse | null>(null);

  // ── Derive current plan info from subscription data ──
  const rawPlanType = subData?.plan?.planType;
  const rawPlanName = subData?.plan?.planName;
  const planType = normalizePlanType(rawPlanType, rawPlanName);
  const planDisplayName = rawPlanName || (
    planType === "PREMIUM"       ? "Career Premium"
    : planType === "SKILL_BUILDER" ? "Skill Builder"
    :                                "Starter"
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const [me, sub] = await Promise.all([
          meService.getMe(),
          getCurrentSubscription().catch(() => null),
        ]);
        if (!mounted) return;
        setProfile(mapMeResponse(me));
        setSubData(sub);
      } catch (error: any) {
        if (!mounted) return;

        if (error?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuthTokens();
          navigate("/login");
          return;
        }

        toast.error(error?.message || "Không thể tải profile từ /api/me");
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleUpdateProfile = async (fullName: string) => {
    setSavingProfile(true);
    try {
      const updated = await meService.updateMe({ fullName });
      setProfile(mapMeResponse(updated));
      window.dispatchEvent(new Event("skillSprint:profile-updated"));
      toast.success("Cập nhật thông tin cá nhân thành công");
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        clearAuthTokens();
        navigate("/login");
        return;
      }

      throw error;
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarInitials = getInitials(profile.fullName || profile.email || "U");
  const [bannerImgError, setBannerImgError] = useState(false);

  const handleSignOut = () => {
    clearAuthTokens();
    navigate("/login");
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.28}} style={{fontFamily:F}}>

      {/* ── Profile Banner ── */}
      <div style={{
        background:CARD, borderRadius:"14px", padding:"20px 24px",
        boxShadow:SH, border:`1px solid ${BDR}`,
        display:"flex", alignItems:"center", gap:"16px",
        marginBottom:"20px",
      }}>
        {/* Avatar — onError catches broken S3 URLs and shows two-letter initials */}
        {profile.avatarUrl && !bannerImgError ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            onError={() => setBannerImgError(true)}
            style={{ width:"58px", height:"58px", borderRadius:"50%", flexShrink:0, objectFit:"cover", border:`2px solid ${OGLT}` }}
          />
        ) : (
          <div style={{
            width:"58px", height:"58px", borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,#FF6B00,#6366F1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(99,102,241,0.3)",
          }}>
            <span style={{ fontSize:"20px", fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>{avatarInitials}</span>
          </div>
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{
            fontWeight:900, fontSize:"1.1rem", color:T1,
            letterSpacing:"-0.03em", marginBottom:"2px", fontFamily:F,
          }}>
            {profile.fullName}
          </h2>
          <p style={{ fontSize:"0.82rem", color:T2, marginBottom:"8px", fontFamily:F }}>
            {profile.email || "Không có email trong phiên"} · {profile.roleLabel}
          </p>
          <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
            <PlanTypeBadge
              type={planType as any}
              label={planDisplayName}
              badgeColor={(subData?.plan as any)?.badgeColor}
              badgeIcon={(subData?.plan as any)?.badgeIcon}
              animationType={(subData?.plan as any)?.animationType}
            />
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background: profile.emailVerified ? "#ECFDF5" : "#FFF7ED",
              color: profile.emailVerified ? "#065F46" : "#C2410C",
              border: `1px solid ${profile.emailVerified ? "#A7F3D0" : "#FED7AA"}`, fontWeight:700,
              display:"inline-flex", alignItems:"center", gap:"5px",
              }}>{profile.emailVerified ? <><BadgeCheck size={12} /> Email đã xác minh</> : <><AlertTriangle size={12} /> Email chưa xác minh</>}</span>
            {profileLoading && (
              <span style={{
                fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
                background:"#EFF6FF", color:"#1D4ED8",
                border:"1px solid #BFDBFE", fontWeight:700,
                display:"inline-flex", alignItems:"center", gap:"5px",
              }}><Loader2 size={12} className="animate-spin" /> Đang đồng bộ hồ sơ</span>
            )}
          </div>
        </div>

      </div>

      {/* ── Two-column: sub-nav + form ── */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">

        {/* Left sub-nav */}
        <div style={{
          background:CARD, borderRadius:"14px", padding:"12px 8px",
          boxShadow:SH, border:`1px solid ${BDR}`,
        }}>
          <p style={{
            fontSize:"0.62rem", color:T3, fontWeight:700,
            letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"6px 10px 8px", fontFamily:F,
          }}>Cài đặt</p>

          {TABS.map(tab=>{
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={()=>setActiveTab(tab.id)}
                style={{
                  display:"flex", alignItems:"center", gap:"9px",
                  width:"100%", padding:"9px 10px", borderRadius:"8px",
                  background: isActive ? OGL : "transparent",
                  border:"none", cursor:"pointer",
                  color: isActive ? OG : T2,
                  fontFamily:F, fontWeight: isActive ? 700 : 400,
                  fontSize:"0.848rem", transition:"all 0.12s",
                  textAlign:"left",
                }}
                onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.background="#F9FAFB";}}
                onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}
              >
                <tab.icon size={14} color={isActive ? OG : T3} strokeWidth={isActive?2.2:1.8}/>
                <span style={{ flex:1 }}>{tab.label}</span>
                {isActive && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:OG }}/>}
              </button>
            );
          })}

          <div style={{ height:"1px", background:BDR, margin:"8px 6px" }}/>

          <button
            onClick={handleSignOut}
            style={{
              display:"flex", alignItems:"center", gap:"9px",
              width:"100%", padding:"9px 10px", borderRadius:"8px",
              background:"transparent", border:"none", cursor:"pointer",
              color:"#EF4444", fontFamily:F, fontWeight:500, fontSize:"0.848rem",
              textAlign:"left", transition:"background 0.12s",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#FFF1F2";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}
          >
            <LogOut size={14} color="#EF4444" strokeWidth={1.8}/>
            Đăng xuất
          </button>
        </div>

        {/* Right form content */}
        <div style={{
          background:CARD, borderRadius:"14px", padding:"24px",
          boxShadow:SH, border:`1px solid ${BDR}`,
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-6}}
              transition={{duration:0.2}}
            >
              {activeTab === "account"       && <AccountTab profile={profile} onSave={handleUpdateProfile} saving={savingProfile} onAvatarUploaded={(updated) => setProfile(mapMeResponse(updated))}/>}
              {activeTab === "subscription"  && <SubscriptionTab onSubscriptionChanged={() => {
                getCurrentSubscription().then(sub => setSubData(sub)).catch(() => {});
              }}/>}
              {activeTab === "achievements"  && <DevPlaceholderTab label="Thành tựu" icon="🏆" description="Hệ thống huy hiệu và thành tựu học tập đang được xây dựng. Sẽ ra mắt trong phiên bản tới."/>}
              {activeTab === "notifications" && <DevPlaceholderTab label="Cài đặt thông báo" icon="🔔" description="Tính năng tùy chỉnh thông báo đang phát triển. API backend chưa sẵn sàng."/>}
              {activeTab === "privacy"       && <DevPlaceholderTab label="Bảo mật & Quyền riêng tư" icon="🔒" description="Tính năng bảo mật nâng cao (2FA, nhật ký đăng nhập) đang được tích hợp."/>}
              {activeTab === "integrations"  && <DevPlaceholderTab label="Tiện ích tích hợp" icon="⚡" description="Tích hợp lịch, ứng dụng bên thứ ba sẽ được bổ sung sau khi backend hoàn thiện."/>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PlanBadgeStyles />
    </motion.div>
  );
}
