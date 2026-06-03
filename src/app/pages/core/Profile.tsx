import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Award, Crown, Bell, Shield, Zap, LogOut,
  ChevronDown, AlertTriangle, Check, Trash2, Gift, CalendarClock, Loader2, MailCheck, BadgeCheck,
  Copy, Eye, EyeOff, BookOpenCheck, CheckCircle2, X, BellOff, Info, HardDrive, Layers, Upload,
  Gem, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens, getStoredUserProfile, type StoredUserProfile } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";
import { getNotifications } from "../../../api/notificationsService";
import { getCurrentSubscription, getQuotaStatus } from "../../../api/subscriptionsService";
import type { NotificationResponse, CurrentSubscriptionResponse, QuotaStatusResponse, ServicePlanType } from "../../../api/skillSprintModels";

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
  const [university, setUniversity] = useState("FPT University");
  const [major,      setMajor]      = useState("Software Engineering");
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

  const UNIVERSITIES = [
    "FPT University","VNU-HCM","HUST","RMIT Vietnam",
    "Fulbright University","Ho Chi Minh University of Technology","Other",
  ];

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
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"10px", marginBottom:"14px" }}>
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
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
          <Input label="Địa chỉ Email" value={email} onChange={setEmail}
            type="email" placeholder="student@gmail.com" disabled
            hint="Email được quản lý bởi hệ thống máy chủ."/>
          <Input label="Múi giờ" value={timeZone} onChange={setTimeZone}
            placeholder="Asia/Ho_Chi_Minh (GMT+7)" disabled
            hint="Dữ liệu được đồng bộ từ hệ thống (chỉ xem)."/>
        </div>
      </div>

      {/* University Details */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Thông tin học vấn"/>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Select label="Trường đại học" value={university} onChange={setUniversity} options={UNIVERSITIES}/>
            <Input  label="Chuyên ngành"      value={major}      onChange={setMajor}      placeholder="VD: Công nghệ phần mềm"/>
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
   SUBSCRIPTION TAB  ← matches reference image exactly
════════════════════════════════════════════════ */
function PlanFeature({ text, color="#374151" }: { text: string; color?: string }) {
  return (
    <li style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"0.82rem", color }}>
      <Check size={13} color={color === "#374151" ? "#6B7280" : color} strokeWidth={2.5} style={{ flexShrink:0 }}/>
      {text}
    </li>
  );
}

function QuotaProgressBar({ label, used, total, icon: IconComponent }: { label: string; used: number; total: number; icon: React.ElementType }) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const fillColor = isAtLimit ? "#EF4444" : isNearLimit ? "#F59E0B" : "#FF6B00";

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconComponent size={14} color={T2} />
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: "0.80rem", color: T1 }}>{label}</span>
        </div>
        <span style={{ fontFamily: F, fontWeight: 700, fontSize: "0.75rem", color: fillColor }}>
          {used}/{total}
        </span>
      </div>
      <div style={{
        width: "100%", height: "8px", borderRadius: "99px",
        background: "#E5E7EB", overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: "100%", borderRadius: "99px",
            background: `linear-gradient(90deg, ${fillColor}, ${fillColor}DD)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUBSCRIPTION TAB  — SYNCED WITH GLOBAL BRANDING
   Dynamic plan detection, orange theme, correct
   button logic for Starter / Skill Builder / Career Premium
═══════════════════════════════════════════════════ */
function SubscriptionTab() {
  const [subData, setSubData] = useState<CurrentSubscriptionResponse | null>(null);
  const [quotaData, setQuotaData] = useState<QuotaStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [sub, quota] = await Promise.all([
          getCurrentSubscription(),
          getQuotaStatus(),
        ]);
        if (!mounted) return;
        setSubData(sub);
        setQuotaData(quota);
      } catch {
        // silently handle – subscription data is non-critical
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  // ── DYNAMIC currentPlan (reads from backend, falls back to mock) ──
  const currentPlan: "FREE" | "SKILL_BUILDER" | "PREMIUM" = (subData?.plan?.planType as any) || "SKILL_BUILDER";

  // ── Plan registry with all display / pricing info ──
  type PlanId = "starter" | "skill_builder" | "career_premium";
  const planTierOrder: PlanId[] = ["starter", "skill_builder", "career_premium"];

  const planValue: Record<PlanId, number> = {
    starter:         0,
    skill_builder:   1,
    career_premium:  2,
  };

  const planLabel: Record<PlanId, string> = {
    starter:         "Starter",
    skill_builder:   "Skill Builder",
    career_premium:  "Career Premium",
  };

  const planDisplayPrice: Record<PlanId, string> = {
    starter:         "Miễn phí",
    skill_builder:   "89.000",
    career_premium:  "199.000",
  };

  const planPriceSub: Record<PlanId, string | null> = {
    starter:         null,
    skill_builder:   "VND / tháng",
    career_premium:  "VND / tháng",
  };

  const planFeatureList: Record<PlanId, string[]> = {
    starter:         ["Tối đa 3 lộ trình", "Công cụ Pomodoro cơ bản", "Tham gia cộng đồng"],
    skill_builder:   ["Không giới hạn lộ trình", "Phân tích học tập chuyên sâu", "Hỗ trợ ưu tiên"],
    career_premium:  ["Toàn bộ quyền lợi gói Skill Builder", "Xuất CV & Minh chứng năng lực", "Gia sư AI định hướng kỹ năng", "Ghép cặp Mentor chuyên gia"],
  };

  // Derive the current PlanId from the backend type
  const currentPlanId: PlanId = currentPlan === "PREMIUM"       ? "career_premium"
                              : currentPlan === "SKILL_BUILDER" ? "skill_builder"
                              :                                   "starter";

  const currentPlanIndex = planValue[currentPlanId];

  // ── Button config for each card ──
  function getButtonConfig(planId: PlanId): {
    label: string;
    disabled: boolean;
    bg: string;
    border: string;
    color: string;
    shadow: string;
  } {
    const cardIndex = planValue[planId];
    if (cardIndex === currentPlanIndex) {
      return {
        label:    "Gói hiện tại",
        disabled: true,
        bg:       "#F3F4F6",
        border:   "#D1D5DB",
        color:    "#9CA3AF",
        shadow:   "none",
      };
    }
    if (cardIndex < currentPlanIndex) {
      return {
        label:    "Hạ cấp xuống Starter",
        border:   OG,
        color:    OG,
        bg:       "transparent",
        disabled: false,
        shadow:   "none",
      };
    }
    // Higher tier → Upgrade
    return {
      label:    `Nâng cấp ${planLabel[planId]}`,
      disabled: false,
      bg:       OG,
      border:   OG,
      color:    "#FFFFFF",
      shadow:   "0 4px 14px rgba(255,107,0,0.28)",
    };
  }

  // ── Plan cards data ──
  const PLANS: {
    id: PlanId;
    accent: string;
    bg: string;
    border: string;
    badge: string | null;
  }[] = [
    {
      id:     "starter",
      accent: "#6B7280",
      bg:     currentPlanId === "starter"         ? OGL : "#F9FAFB",
      border: currentPlanId === "starter"         ? `1px solid ${OG}` : BDR,
      badge:  null,
    },
    {
      id:     "skill_builder",
      accent: OG,
      bg:     currentPlanId === "skill_builder"   ? OGL : "#F9FAFB",
      border: currentPlanId === "skill_builder"   ? `1px solid ${OG}` : BDR,
      badge:  currentPlanId !== "skill_builder" && currentPlanId !== "career_premium" ? "MOST POPULAR" : null,
    },
    {
      id:     "career_premium",
      accent: OG,
      bg:     currentPlanId === "career_premium"  ? OGL : "#F9FAFB",
      border: currentPlanId === "career_premium"  ? `1px solid ${OG}` : BDR,
      badge:  currentPlanId === "career_premium"  ? null : "ĐỀ XUẤT",
    },
  ];

  // ── Banner info ──
  const bannerIcon = currentPlanId === "career_premium"  ? <Crown size={16} color={OG} />
                   : currentPlanId === "skill_builder"   ? <Zap size={16} color={OG} />
                   :                                       <Zap size={16} color="#9CA3AF" />;

  const bannerTitle = `${planLabel[currentPlanId]} Plan`;
  const bannerPrice = currentPlanId === "starter"
    ? "0 VND / tháng · Miễn phí"
    : `${planDisplayPrice[currentPlanId]} VND / tháng`;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: T3 }} />
        <span style={{ fontFamily: F, fontSize: "0.85rem", color: T3, marginLeft: "8px" }}>Đang tải dữ liệu gói...</span>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Current Plan Banner (DYNAMIC, ORANGE THEME) ─── */}
      <div style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"14px 16px", borderRadius:"12px",
        background: currentPlanId === "starter" ? "#F9FAFB" : OGL,
        border: `1px solid ${currentPlanId === "starter" ? BDR : `rgba(255,107,0,0.18)`}`,
        marginBottom:"20px",
      }}>
        <div style={{
          width:"36px", height:"36px", borderRadius:"9px",
          background: OGL,
          border: `1px solid rgba(255,107,0,0.25)`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          {bannerIcon}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:T1, fontFamily:F, lineHeight:1 }}>{bannerTitle}</p>
          <p style={{ fontSize:"0.75rem", color:T3, fontFamily:F, marginTop:"2px" }}>
            {bannerPrice}
          </p>
        </div>
        {/* Orange Active badge */}
        <div style={{
          padding:"4px 12px", borderRadius:"99px",
          background: "rgba(255,107,0,0.12)",
          border: "1.5px solid rgba(255,107,0,0.35)",
          display:"flex", alignItems:"center", gap:"5px",
        }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background: OG }}/>
          <span style={{ fontSize:"0.75rem", color: OG, fontWeight:700, fontFamily:F }}>
            Đang sử dụng
          </span>
        </div>
      </div>

      {/* ─── Usage & Limits (DYNAMICALLY MAPPED) ─── */}
      {quotaData && (
        <div style={{
          padding: "16px 18px", borderRadius: "12px",
          border: `1px solid ${BDR}`, background: "#FAFBFC",
          marginBottom: "20px",
        }}>
          <SectionHeading title="Mức sử dụng & Giới hạn" />
          <div style={{ display: "grid", gap: "4px" }}>
            {quotaData.usedWorkspaces !== undefined && (
              <QuotaProgressBar
                label="Lộ trình đang học"
                used={quotaData.usedWorkspaces ?? 0}
                total={quotaData.maxWorkspaces ?? 3}
                icon={Layers}
              />
            )}
            {quotaData.usedStorageMb !== undefined && (
              <QuotaProgressBar
                label="Dung lượng lưu trữ (MB)"
                used={quotaData.usedStorageMb ?? 0}
                total={quotaData.maxWorkspaceMb ?? 100}
                icon={HardDrive}
              />
            )}
            {quotaData.usedAiGenerate !== undefined && (
              <QuotaProgressBar
                label="Lượt hỏi AI (tháng này)"
                used={quotaData.usedAiGenerate ?? 0}
                total={quotaData.aiGenerateLimit ?? 50}
                icon={Zap}
              />
            )}
            {quotaData.usedUploads !== undefined && (
              <QuotaProgressBar
                label="Tệp đã tải lên"
                used={quotaData.usedUploads ?? 0}
                total={quotaData.maxUploads ?? 20}
                icon={Upload}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Pricing Cards Grid ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
        {PLANS.map(plan => {
          const btn = getButtonConfig(plan.id);
          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: planValue[plan.id] * 0.06 }}
              whileHover={!btn.disabled ? { y:-2 } : {}}
              style={{
                background: plan.bg,
                borderRadius:"14px",
                border:`${plan.border}`,
                padding:"20px 18px",
                display:"flex", flexDirection:"column",
                boxShadow: plan.id === currentPlanId ? "0 0 0 2px rgba(255,107,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                position:"relative", overflow:"hidden",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  display:"flex", alignItems:"center", gap:"5px",
                  marginBottom:"8px",
                }}>
                  <span style={{
                    fontSize:"0.62rem", fontWeight:800, color:OG,
                    letterSpacing:"0.1em", textTransform:"uppercase",
                  }}>
                    {plan.badge}
                  </span>
                  <Crown size={11} color="#FBBF24" fill="#FBBF24"/>
                </div>
              )}

              {/* Title */}
              <p style={{
                fontSize:"1rem", fontWeight:700,
                color: plan.id === currentPlanId ? OG : plan.accent,
                fontFamily:F, marginBottom:"6px",
                marginTop: plan.badge ? "0" : "18px",
              }}>
                {planLabel[plan.id]}
              </p>

              {/* Price */}
              <div style={{ display:"flex", alignItems:"baseline", gap:"2px", marginBottom:"14px" }}>
                <span style={{
                  fontSize:"1.8rem", fontWeight:900, letterSpacing:"-0.04em",
                  color: plan.id === "starter" ? T1 : plan.accent,
                }}>
                  {planDisplayPrice[plan.id]}
                </span>
                {planPriceSub[plan.id] && (
                  <span style={{ fontSize:"0.75rem", color:T3, marginLeft:"1px" }}>{planPriceSub[plan.id]}</span>
                )}
              </div>

              {/* Features */}
              <ul style={{
                listStyle:"none", margin:"0 0 auto", padding:0,
                display:"flex", flexDirection:"column", gap:"8px",
                marginBottom:"18px",
              }}>
                {planFeatureList[plan.id].map(f => (
                  <PlanFeature key={f} text={f} color={plan.id === currentPlanId ? T1 : T2}/>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={!btn.disabled ? { scale:1.02 } : {}}
                whileTap={!btn.disabled ? { scale:0.97 } : {}}
                disabled={btn.disabled}
                style={{
                  width:"100%", padding:"11px 0", borderRadius:"10px",
                  background: btn.bg,
                  border:`1.5px solid ${btn.border}`,
                  color: btn.color,
                  fontFamily:F, fontWeight:700, fontSize:"0.875rem",
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  opacity: btn.disabled ? 0.65 : 1,
                  boxShadow: btn.shadow,
                  transition:"all 0.15s",
                }}
              >
                {btn.label}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NOTIFICATIONS TAB
═══════════════════════════════════════════════ */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${BDR}`,
        background: CARD,
      }}
    >
      <div style={{ paddingRight: "10px" }}>
        <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.84rem", color: T1 }}>{title}</p>
        <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: "3px" }}>{description}</p>
      </div>

      <button
        onClick={() => onChange(!checked)}
        style={{
          width: "42px",
          height: "24px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          position: "relative",
          background: checked ? OG : "#E5E7EB",
          transition: "all 0.18s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
            transition: "left 0.18s",
          }}
        />
      </button>
    </div>
  );
}

function NotificationsTab() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [pomodoroAlert, setPomodoroAlert] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [deadlineNudge, setDeadlineNudge] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <SectionHeading title="Tùy chọn thông báo" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <ToggleRow
          title="Nhắc nhở qua Email"
          description="Nhận lời nhắc trước mỗi buổi học."
          checked={emailReminders}
          onChange={setEmailReminders}
        />
        <ToggleRow
          title="Cảnh báo Pomodoro"
          description="Thông báo khi kết thúc thời gian tập trung."
          checked={pomodoroAlert}
          onChange={setPomodoroAlert}
        />
        <ToggleRow
          title="Tổng kết tuần"
          description="Tóm tắt tiến độ, chuỗi học và nhiệm vụ vào mỗi Chủ nhật."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
        <ToggleRow
          title="Nhắc hạn chót"
          description="Nhắc nhở 24 giờ trước kỳ thi hoặc hạn chót."
          checked={deadlineNudge}
          onChange={setDeadlineNudge}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: saved ? "#059669" : OG,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: F,
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: saved ? "0 4px 14px rgba(5,150,105,0.25)" : "0 4px 14px rgba(255,107,0,0.28)",
          }}
        >
          {saved ? <><Check size={14} /> Đã lưu</> : "Lưu tùy chọn thông báo"}
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRIVACY TAB
═══════════════════════════════════════════════ */
function PrivacyTab() {
  const [publicProfile, setPublicProfile] = useState(false);
  const [showLeaderboardName, setShowLeaderboardName] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <SectionHeading title="Quyền riêng tư & Hiển thị" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <ToggleRow
          title="Hồ sơ công khai"
          description="Cho phép người khác xem trang hồ sơ học tập."
          checked={publicProfile}
          onChange={setPublicProfile}
        />
        <ToggleRow
          title="Hiển thị tên trên bảng xếp hạng"
          description="Hiển thị tên và thứ hạng chuỗi học công khai."
          checked={showLeaderboardName}
          onChange={setShowLeaderboardName}
        />
        <ToggleRow
          title="Phân tích sản phẩm"
          description="Chia sẻ dữ liệu ẩn danh để cải thiện đề xuất AI."
          checked={allowAnalytics}
          onChange={setAllowAnalytics}
        />
      </div>

      <div style={{
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid #C7D2FE`,
        background: "#EEF2FF",
        marginBottom: "18px",
      }}>
        <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.8rem", color: "#4338CA" }}>
          Xác thực 2FA và nhật ký bảo mật sẽ được thêm trong giai đoạn backend.
        </p>
        <p style={{ fontFamily: F, fontSize: "0.74rem", color: "#6366F1", marginTop: "4px" }}>
          Giao diện đã sẵn sàng, tích hợp API sẽ được gắn sau.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: saved ? "#059669" : OG,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: F,
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: saved ? "0 4px 14px rgba(5,150,105,0.25)" : "0 4px 14px rgba(255,107,0,0.28)",
          }}
        >
          {saved ? <><Check size={14} /> Đã lưu</> : "Lưu tùy chọn bảo mật"}
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   INTEGRATIONS TAB
═══════════════════════════════════════════════ */
function IntegrationsTab() {
  const [dateSource, setDateSource] = useState("Client (Browser Time)");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh (GMT+7)");
  const [autoSync, setAutoSync] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <SectionHeading title="Tiện ích tích hợp" />

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid ${BDR}`,
        background: "#F9FAFB",
        marginBottom: "14px",
      }}>
        <CalendarClock size={16} color={OG} style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.84rem", color: T1 }}>
              Chế độ nguồn ngày
            </p>
            <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: "3px" }}>
              Ứng dụng hiện dùng thời gian trình duyệt. Chuyển sang thời gian máy chủ sau khi backend ra mắt.
            </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <Select
          label="Nguồn ngày"
          value={dateSource}
          onChange={setDateSource}
          options={["Client (Browser Time)", "Mock API", "Server Time (Coming soon)"]}
        />
        <Select
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          options={["Asia/Ho_Chi_Minh (GMT+7)", "UTC (GMT+0)", "Asia/Singapore (GMT+8)"]}
        />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <ToggleRow
          title="Tự động đồng bộ mỗi phút"
          description="Làm mới dữ liệu ngày và trạng thái trong các module dashboard."
          checked={autoSync}
          onChange={setAutoSync}
        />
      </div>

      <div style={{
        padding: "12px 14px",
        borderRadius: "10px",
        border: `1px solid #BFDBFE`,
        background: "#EFF6FF",
        marginBottom: "18px",
      }}>
        <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.8rem", color: "#1D4ED8" }}>Trạng thái backend: Chưa kết nối</p>
        <p style={{ fontFamily: F, fontSize: "0.74rem", color: "#3B82F6", marginTop: "4px" }}>
          Tab này đã sẵn sàng giao diện. Khi backend được kích hoạt, nó sẽ đọc các endpoint dữ liệu.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: saved ? "#059669" : OG,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: F,
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: saved ? "0 4px 14px rgba(5,150,105,0.25)" : "0 4px 14px rgba(255,107,0,0.28)",
          }}
        >
          {saved ? <><Check size={14} /> Đã lưu</> : "Lưu tùy chọn tích hợp"}
        </motion.button>
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

  const LEVEL    = 7;
  const STREAK   = 12;

  // ── Derive current plan info from subscription data ──
  const planType: ServicePlanType = subData?.plan?.planType || "FREE";
  const planDisplayName =
    planType === "PREMIUM"       ? "Career Premium"
    : planType === "SKILL_BUILDER" ? "Skill Builder"
    :                                "Starter";
  const planBadgeStyle: { bg: string; color: string; border: string; icon: React.ReactNode } =
    planType === "PREMIUM"
      ? { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", icon: <Gem size={12} /> }
      : planType === "SKILL_BUILDER"
        ? { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: <Sparkles size={12} /> }
        : { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", icon: <Crown size={12} color="#9CA3AF" /> };

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
          navigate("/auth");
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
        navigate("/auth");
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
    navigate("/auth");
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
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background: planBadgeStyle.bg,
              color: planBadgeStyle.color,
              border: `1px solid ${planBadgeStyle.border}`,
              fontWeight:700,
              display:"inline-flex", alignItems:"center", gap:"4px",
            }}>
              {planBadgeStyle.icon} {planDisplayName}
            </span>
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background: profile.emailVerified ? "#ECFDF5" : "#FFF7ED",
              color: profile.emailVerified ? "#065F46" : "#C2410C",
              border: `1px solid ${profile.emailVerified ? "#A7F3D0" : "#FED7AA"}`, fontWeight:700,
              display:"inline-flex", alignItems:"center", gap:"5px",
              }}>{profile.emailVerified ? <><BadgeCheck size={12} /> Email đã xác minh</> : <><AlertTriangle size={12} /> Email chưa xác minh</>}</span>
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background:"#FFF9C4", color:"#92400E",
              border:"1px solid #FDE68A", fontWeight:700,
            }}>⭐ Cấp độ {LEVEL}</span>
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background:"#ECFDF5", color:"#065F46",
              border:"1px solid #A7F3D0", fontWeight:700,
            }}>🔥 {STREAK} ngày liên tiếp</span>
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
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:"16px", alignItems:"start" }}>

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
              {activeTab === "subscription"  && <SubscriptionTab/>}
              {activeTab === "notifications" && <NotificationsTab/>}
              {activeTab === "privacy"       && <PrivacyTab/>}
              {activeTab === "integrations"  && <IntegrationsTab/>}
              {activeTab !== "account" && activeTab !== "subscription" && activeTab !== "notifications" && activeTab !== "privacy" && activeTab !== "integrations" && (
                <PlaceholderTab label={TABS.find(t=>t.id===activeTab)?.label ?? "Cài đặt"}/>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}