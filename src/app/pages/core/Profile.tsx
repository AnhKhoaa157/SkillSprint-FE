import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Award, Crown, Bell, Shield, Zap, LogOut,
  ChevronDown, AlertTriangle, Check, Trash2, CalendarClock, Loader2, MailCheck, BadgeCheck,
  Copy, Eye, EyeOff, HardDrive, Layers, Upload,
  Gem, Sparkles, RefreshCw, AlertCircle, ArrowUp, ArrowDown, X, MessageSquare,
  CheckCircle2, Brain, FileText, Clock, ArrowRight, LoaderCircle, Inbox, Info,
  Link as LinkIcon, Flame,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens, getStoredUserProfile, type StoredUserProfile } from "../../../api/auth/authService";
import meService, { type MeResponse } from "../../../api/utilities/meService";
import { getMyFeedbacks, getMyFeedbackDetail, FeedbackStatus, FeedbackType, type FeedbackResponse } from "../../../api/utilities/feedbackService";
import { getCurrentSubscription, getQuotaStatus } from "../../../api/billing/subscriptionsService";
import { listSubscriptionPlans, formatPlanPrice, isFeatureEnabled, resolvePlanFeatures, type PublicPlanResponse, type PublicPlanFeature } from "../../../api/admin/adminSubscriptionPlansService";
import { createSepayPayment, getPaymentDetail } from "../../../api/billing/sepayPaymentService";
import pointService from "../../../api/learning/pointService";
import type { SepayPaymentCreateResponse, SepayPaymentDetailResponse, CurrentSubscriptionResponse, QuotaStatusResponse, ServicePlanType, UserPointSummary } from "../../../api/core/skillSprintModels";
import { PlanTypeBadge, PlanBadgeStyles } from "../../../components/admin/PlanTypeBadge";
import { normalizePlanType } from "../../../utils/adminStatusHelpers";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";

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
  { id:"feedback",      label:"Lịch sử phản hồi",     icon:MessageSquare, danger:false },
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

  // Dynamic plan names from BE; use generic UI labels only when metadata is not loaded.
  const planLabel: Record<PlanId,string> = {
    starter:        planByKey.starter?.planName        ?? "Starter",
    skill_builder:  planByKey.skill_builder?.planName  ?? "Skill Builder",
    career_premium: planByKey.career_premium?.planName ?? "Career Premium",
  };

  // Dynamic price labels from BE via the shared localization utility.
  const planDisplayPrice: Record<PlanId,string> = {
    starter:        planByKey.starter ? formatPlanPrice(planByKey.starter.monthlyPrice, planByKey.starter.currency) : "Chưa có dữ liệu",
    skill_builder:  planByKey.skill_builder  ? formatPlanPrice(planByKey.skill_builder.monthlyPrice, planByKey.skill_builder.currency) : "Chưa có dữ liệu",
    career_premium: planByKey.career_premium ? formatPlanPrice(planByKey.career_premium.monthlyPrice, planByKey.career_premium.currency) : "Chưa có dữ liệu",
  };
  const planPriceSub: Record<PlanId,string|null> = {
    starter:        null,
    skill_builder:  "/ tháng",
    career_premium: "/ tháng",
  };

  // Resolve via the shared normalizer so BE naming/shape drift (features /
  // planFeatures / featureList; string or object elements) doesn't blank the list.
  const planFeatureList: Record<PlanId,PublicPlanFeature[]> = {
    starter:        resolvePlanFeatures(planByKey.starter),
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
    // Downgrades are handled by letting the current plan lapse at period end;
    // there is no self-service cancel endpoint, so lower-tier cards are inert.
    if (idx < currentPlanIndex) return;
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
   FEEDBACK HISTORY TAB (Learner)
═══════════════════════════════════════════════ */
const FB_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  [FeedbackStatus.OPEN]:        { label: "Chờ xử lý",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  [FeedbackStatus.IN_PROGRESS]: { label: "Đang xử lý", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  [FeedbackStatus.CLOSED]:      { label: "Đã đóng",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const FB_TYPE_LABEL: Record<string, string> = {
  [FeedbackType.BUG]:         "Lỗi",
  [FeedbackType.IMPROVEMENT]: "Cải tiến",
  [FeedbackType.QUESTION]:    "Câu hỏi",
  [FeedbackType.OTHER]:       "Khác",
};

function formatFbDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function normalizeFeedbackUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("ttps://") ? `h${trimmed}` : trimmed;
}

function isFeedbackImageUrl(url: string | null | undefined): boolean {
  const normalized = normalizeFeedbackUrl(url);
  if (!normalized) return false;
  const clean = normalized.toLowerCase();
  const isCdn =
    clean.includes("bing.com/th/") ||
    clean.includes("th.bing.com/th/") ||
    clean.includes("image") ||
    clean.includes("?w=");
  const hasExt = /\.(png|jpg|jpeg|webp|gif|avif|bmp|svg)$/i.test(clean.split(/[?#]/)[0]);
  return hasExt || isCdn;
}

function resolveFeedbackImageUrl(feedback: FeedbackResponse): string | null {
  const imageUrl = normalizeFeedbackUrl(feedback.imageUrl);
  if (imageUrl) return imageUrl;

  const relatedUrl = normalizeFeedbackUrl(feedback.relatedUrl);
  return isFeedbackImageUrl(relatedUrl) ? relatedUrl : null;
}

function resolveFeedbackRelatedUrl(feedback: FeedbackResponse): string | null {
  const relatedUrl = normalizeFeedbackUrl(feedback.relatedUrl);
  if (!relatedUrl || isFeedbackImageUrl(relatedUrl)) return null;
  return relatedUrl;
}

/* ═══════════════════════════════════════════════
   NOTIFICATIONS TAB
═══════════════════════════════════════════════ */
function NotificationsTab() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotificationSocket();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isClearingAll, setIsClearingAll] = useState(false);

  const [expandedNotifs, setExpandedNotifs] = useState<Set<string>>(new Set());

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedNotifs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read;
    return true;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const isSysA = ["SYSTEM_INFO", "SYSTEM_WARNING", "FEEDBACK_REPLIED"].includes(a.type) || a.type.startsWith("SYSTEM_");
    const isSysB = ["SYSTEM_INFO", "SYSTEM_WARNING", "FEEDBACK_REPLIED"].includes(b.type) || b.type.startsWith("SYSTEM_");
    if (isSysA && !isSysB) return -1;
    if (!isSysA && isSysB) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleMarkAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.read);
    if (unreadOnes.length === 0) return;
    setIsClearingAll(true);
    try {
      for (const notif of unreadOnes) {
        await markAsRead(notif.notificationId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    if (!notif.read) {
      await markAsRead(notif.notificationId);
    }
    if (notif.type === "FEEDBACK_REPLIED") {
      navigate("/app/profile?tab=feedback");
      return;
    }
    if (notif.workspaceId) {
      if (notif.type === "ROADMAP_READY") {
        navigate(`/app/workspaces/${notif.workspaceId}/roadmap`);
      } else {
        navigate(`/app/workspaces/${notif.workspaceId}`);
      }
    } else if (notif.type === "TASK_REMINDER" || notif.type === "TASK_OVERDUE") {
      navigate("/app/calendar");
    }
  };

  function getNotifVisuals(type: string) {
    switch (type) {
      case "MATERIAL_ANALYSIS_DONE":
        return { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <FileText size={18} className="stroke-[2.2]" />, label: "Tài liệu học tập" };
      case "MATERIAL_PROCESSING_FAILED":
        return { bg: "bg-rose-50 text-rose-600 border-rose-100", icon: <AlertTriangle size={18} className="stroke-[2.2]" />, label: "Xử lý lỗi" };
      case "ROADMAP_READY":
        return { bg: "bg-indigo-50 text-indigo-650 border-indigo-100", icon: <Brain size={18} className="stroke-[2.5]" />, label: "Lộ trình AI" };
      case "TASK_REMINDER":
        return { bg: "bg-amber-50 text-amber-600 border-amber-100", icon: <Clock size={18} className="stroke-[2.2]" />, label: "Nhắc nhở học tập" };
      case "TASK_OVERDUE":
        return { bg: "bg-red-50 text-red-650 border-red-100", icon: <AlertTriangle size={18} className="stroke-[2.2]" />, label: "Quá hạn bài tập" };
      case "AI_SCHEDULE_READY":
        return { bg: "bg-blue-50 text-blue-600 border-blue-100", icon: <Sparkles size={18} className="stroke-[2.2]" />, label: "Lịch học AI" };
      case "FEEDBACK_REPLIED":
        return { bg: "bg-violet-50 text-violet-600 border-violet-100", icon: <MessageSquare size={18} className="stroke-[2.2]" />, label: "Phản hồi" };
      case "SYSTEM_INFO":
        return { bg: "bg-orange-50 text-orange-600 border-orange-100", icon: <Shield size={18} className="stroke-[2.2]" />, label: "Hệ thống", labelColor: "text-orange-600" };
      case "SYSTEM_WARNING":
        return { bg: "bg-orange-50 text-orange-600 border-orange-100", icon: <Shield size={18} className="stroke-[2.2]" />, label: "Hệ thống", labelColor: "text-orange-600" };
      default:
        return { bg: "bg-slate-50 text-slate-600 border-slate-100", icon: <Bell size={18} className="stroke-[2.2]" />, label: "Thông báo" };
    }
  }

  function formatDate(isoString: string) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Vừa xong";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
  }

  return (
    <div className="w-full">
      <SectionHeading title="Trung tâm thông báo" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Tất cả ({notifications.length})</button>
          <button onClick={() => setFilter("unread")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${filter === "unread" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Chưa đọc ({unreadCount})</button>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/50">{unreadCount} chưa đọc</span>}
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={isClearingAll} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-350 active:scale-[0.98] disabled:opacity-50 cursor-pointer">
              {isClearingAll ? <LoaderCircle size={14} className="animate-spin text-slate-500" /> : <CheckCircle2 size={14} className="text-emerald-600" />} Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <AnimatePresence mode="popLayout">
          {sortedNotifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-4 shadow-sm"><Inbox size={24} className="stroke-[1.8]" /></div>
              <h3 className="text-base font-extrabold text-slate-800">Không có thông báo nào</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">{filter === "unread" ? "Bạn đã đọc hết toàn bộ các thông báo. Tuyệt vời!" : "Chưa có thông báo hoặc lời nhắc nhở nào từ hệ thống."}</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedNotifications.map((notif) => {
                const visuals = getNotifVisuals(notif.type);
                const isExpanded = expandedNotifs.has(notif.notificationId);
                const isLongText = notif.message && notif.message.length > 120;
                return (
                  <motion.div key={notif.notificationId} layoutId={notif.notificationId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => handleNotificationClick(notif)} className={`flex items-start gap-4 p-5 transition-all relative cursor-pointer ${!notif.read ? "bg-[#FFF7ED] hover:bg-[#FFF7ED]/80" : "hover:bg-slate-50/50"}`}>
                    {!notif.read && <div className="absolute top-0 left-0 w-1 h-full bg-[#FF7E21]" />}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${visuals.bg}`}>{visuals.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-extrabold uppercase tracking-wider ${visuals.labelColor || 'text-slate-400'}`}>{visuals.label}</span>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{formatDate(notif.createdAt)}</span>
                      </div>
                      {notif.type === "SYSTEM_INFO" && <div className="text-[11px] font-bold text-blue-600 mb-1">Thông tin</div>}
                      {notif.type === "SYSTEM_WARNING" && <div className="text-[11px] font-bold text-red-600 mb-1">Cảnh báo</div>}
                      <h4 className={`text-sm font-extrabold leading-snug tracking-tight text-slate-800 ${!notif.read ? 'text-slate-900' : ''}`}>{notif.title}</h4>
                      <p className={`mt-1.5 text-xs leading-relaxed text-slate-500 font-medium ${isExpanded ? "" : "line-clamp-2"}`}>{notif.message}</p>
                      {isLongText && (
                        <button
                          onClick={(e) => toggleExpand(e, notif.notificationId)}
                          className="text-[#FF6B00] hover:text-[#E05E00] text-[11px] font-semibold mt-1 transition-colors"
                        >
                          {isExpanded ? "Thu gọn" : "Xem thêm"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.read && <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.notificationId); }} className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#FF7E21] hover:text-[#FF7E21] text-slate-500 transition-colors shadow-sm cursor-pointer" title="Đánh dấu đã đọc"><CheckCircle2 size={14} /></button>}
                      {notif.workspaceId && !notif.type.startsWith("SYSTEM_") ? (
                        <div className="p-2 rounded-lg border border-slate-250 bg-white group-hover:border-[#FF7E21] group-hover:bg-orange-50/20 group-hover:text-[#E05E00] text-slate-700 transition shadow-sm flex items-center gap-1.5 text-xs font-bold">Truy cập <ArrowRight size={13} /></div>
                      ) : (notif.type === "TASK_REMINDER" || notif.type === "TASK_OVERDUE") ? (
                        <div className="p-2 rounded-lg border border-slate-250 bg-white group-hover:border-[#FF7E21] group-hover:bg-orange-50/20 group-hover:text-[#E05E00] text-slate-700 transition shadow-sm flex items-center gap-1.5 text-xs font-bold">Lịch học <ArrowRight size={13} /></div>
                      ) : (notif.type === "FEEDBACK_REPLIED") ? (
                        <div className="p-2 rounded-lg border border-slate-250 bg-white hover:border-violet-400 hover:bg-violet-50/40 hover:text-violet-700 text-slate-700 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold">Xem phản hồi <ArrowRight size={13} /></div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeedbackHistoryTab() {
  const [items, setItems]           = useState<FeedbackResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected]     = useState<FeedbackResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const SIZE = 10;

  // Open the detail modal: show the list snapshot instantly, then refresh it
  // from GET /api/feedback/{feedbackId} so any newer admin reply/status shows.
  const openDetail = async (fb: FeedbackResponse) => {
    setSelected(fb);
    setDetailLoading(true);
    try {
      const detail = await getMyFeedbackDetail(fb.feedbackId);
      setSelected((current) => (current?.feedbackId === detail.feedbackId ? detail : current));
    } catch {
      // keep the list snapshot if the detail fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getMyFeedbacks(page, SIZE)
      .then(res => {
        if (!mounted) return;
        setItems(res.content ?? res.items ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalItems(res.totalElements ?? res.totalItems ?? 0);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Không thể tải lịch sử phản hồi");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [page]);

  const statusBadge = (status: string) => FB_STATUS_BADGE[status] ?? FB_STATUS_BADGE[FeedbackStatus.OPEN];

  return (
    <div>
      <SectionHeading title="Lịch sử phản hồi" />

      {loading ? (
        <div className="divide-y divide-slate-100" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded-full bg-slate-200/80" />
                <div className="h-2.5 w-1/3 rounded-full bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <AlertCircle size={26} className="mx-auto mb-3 text-rose-300" />
          <p className="text-sm text-slate-500 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => setPage(p => p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Chưa có phản hồi nào</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500">
            Các phản hồi bạn gửi cho đội ngũ SkillSprint sẽ xuất hiện ở đây cùng với câu trả lời từ quản trị viên.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            {items.map(fb => {
              const badge = statusBadge(fb.status);
              return (
                <button
                  key={fb.feedbackId}
                  type="button"
                  onClick={() => openDetail(fb)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/70"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100/60 bg-orange-50 text-[#FF6B00]">
                    <MessageSquare size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">{fb.title || "(Không có tiêu đề)"}</p>
                      {fb.adminReply && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-100">
                          <MessageSquare size={9} /> Đã trả lời
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {FB_TYPE_LABEL[fb.type] ?? "Khác"} · {formatFbDate(fb.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Trang {page + 1} · {totalItems} phản hồi</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                disabled={page + 1 >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Tiếp →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {FB_TYPE_LABEL[selected.type] ?? "Khác"}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(selected.status).cls}`}>
                      {statusBadge(selected.status).label}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-extrabold text-slate-900">{selected.title || "(Không có tiêu đề)"}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    Gửi lúc {formatFbDate(selected.createdAt)}
                    {detailLoading && <Loader2 size={11} className="animate-spin text-slate-300" />}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Nội dung</p>
                  <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-sm leading-relaxed text-slate-700">
                    {selected.content || "—"}
                  </p>
                </div>

                {resolveFeedbackImageUrl(selected) && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Ảnh đính kèm</p>
                    <a
                      href={resolveFeedbackImageUrl(selected) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/30"
                    >
                      <img
                        src={resolveFeedbackImageUrl(selected) ?? undefined}
                        alt="Ảnh đính kèm phản hồi"
                        className="max-h-72 w-full rounded-lg bg-white object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
                      />
                      <span className="mt-1.5 flex items-center justify-center gap-1 break-all px-2 pb-1 text-[11px] font-semibold text-slate-400 transition group-hover:text-orange-600">
                        <LinkIcon size={11} className="shrink-0" /> Mở ảnh trong tab mới
                      </span>
                    </a>
                  </div>
                )}

                {resolveFeedbackRelatedUrl(selected) && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">URL liên quan</p>
                    <a
                      href={resolveFeedbackRelatedUrl(selected) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 break-all rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2 text-xs font-bold text-[#FF6B00] transition hover:border-orange-200 hover:bg-orange-50/50"
                    >
                      <LinkIcon size={12} className="shrink-0" /> {selected.relatedUrl}
                    </a>
                  </div>
                )}

                {selected.adminReply ? (
                  <div className="rounded-xl border border-[#FFEDD5] bg-[#FFF7ED] px-3.5 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#C2410C]">
                      <MessageSquare size={12} /> Admin phản hồi
                      {selected.repliedAt && <span className="font-semibold normal-case tracking-normal text-[#EA580C]">· {formatFbDate(selected.repliedAt)}</span>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.adminReply}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-center text-xs font-semibold text-slate-400">
                    Quản trị viên chưa phản hồi phản hồi này.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════ */
export default function Profile() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("account");

  // Deep-link support (e.g. the FEEDBACK_REPLIED notification routes to ?tab=feedback)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);
  const [profile, setProfile] = useState<UserProfileViewModel>(() => {
    const storedProfile = getStoredUserProfile();
    return storedProfile ? mapStoredProfile(storedProfile) : emptyProfile();
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subData, setSubData] = useState<CurrentSubscriptionResponse | null>(null);
  const [pointSummary, setPointSummary] = useState<UserPointSummary | null>(null);

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
        const [me, sub, points] = await Promise.all([
          meService.getMe(),
          getCurrentSubscription().catch(() => null),
          pointService.getMeSummary().catch(() => null),
        ]);
        if (!mounted) return;
        setProfile(mapMeResponse(me));
        setSubData(sub);
        setPointSummary(points);
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
            {pointSummary && pointSummary.streakDays > 0 && (
              <span style={{
                fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
                background:"#FFF7ED", color:"#C2410C",
                border:"1px solid #FED7AA", fontWeight:700,
                display:"inline-flex", alignItems:"center", gap:"4px",
              }}>
                <Flame size={12} fill="#FB923C" color="#EA580C" /> 
                {pointSummary.streakDays} ngày chuỗi
              </span>
            )}
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
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "feedback"      && <FeedbackHistoryTab />}
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
