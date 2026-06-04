import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Award, Crown, Bell, Shield, Zap, LogOut,
  ChevronDown, AlertTriangle, Check, Trash2, Gift, CalendarClock, Loader2, MailCheck, BadgeCheck,
  Copy, Eye, EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens, getStoredUserProfile, type StoredUserProfile } from "../../../api/authService";
import meService, { type MeResponse } from "../../../api/meService";

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
  { id:"account",       label:"Account",       icon:User,   danger:false },
  { id:"achievements",  label:"Achievements",  icon:Award,  danger:false },
  { id:"subscription",  label:"Subscription",  icon:Crown,  danger:false },
  { id:"notifications", label:"Notifications", icon:Bell,   danger:false },
  { id:"privacy",       label:"Privacy",       icon:Shield, danger:false },
  { id:"integrations",  label:"Integrations",  icon:Zap,    danger:false },
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
    fullName: "Learner",
    firstName: "",
    lastName: "",
    avatarUrl: "",
    timeZone: "Asia/Ho_Chi_Minh (GMT+7)",
    status: "-",
    roles: [],
    roleLabel: "Learner",
  };
}

function mapStoredProfile(stored: StoredUserProfile): UserProfileViewModel {
  const fallbackName = stored.fullName || [stored.firstName, stored.lastName].filter(Boolean).join(" ").trim() || "Learner";

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
    roleLabel: stored.role === "ADMIN" ? "Admin" : "Learner",
  };
}

function mapMeResponse(me: MeResponse): UserProfileViewModel {
  const parts = me.fullName.trim().split(/\s+/);
  return {
    userId: me.userId,
    email: me.email,
    emailVerified: me.emailVerified,
    fullName: me.fullName || "Learner",
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
    avatarUrl: me.avatarUrl || "",
    timeZone: me.timeZone || "Asia/Ho_Chi_Minh (GMT+7)",
    status: me.status || "-",
    roles: me.roles || [],
    roleLabel: me.roles?.includes("ADMIN") ? "Admin" : "Learner",
  };
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
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <input
        type={type} value={value} disabled={disabled}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#FF6B00]/40 focus:ring-4 focus:ring-[#FFF7ED] disabled:bg-slate-50/50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-[11px] text-slate-400 leading-normal">{hint}</p>}
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
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <div className="relative">
        <select value={value} onChange={e=>onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#FF6B00]/40 focus:ring-4 focus:ring-[#FFF7ED] appearance-none cursor-pointer"
        >
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={15} className="text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
      </div>
    </div>
  );
}

/* ─── Section heading ─── */
function SectionHeading({ title }: { title:string }) {
  return (
    <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-5">{title}</h3>
  );
}

/* ═══════════════════════════════════════════════
   ACCOUNT TAB
═══════════════════════════════════════════════ */
function AccountTab({ profile, onSave, saving }: { profile: UserProfileViewModel; onSave: (fullName: string) => Promise<void>; saving: boolean; }) {
  const [fullName,   setFullName]   = useState(profile.fullName);
  const [email,      setEmail]      = useState(profile.email);
  const [university, setUniversity] = useState("FPT University");
  const [major,      setMajor]      = useState("Software Engineering");
  const [timeZone,   setTimeZone]   = useState(profile.timeZone || "Asia/Ho_Chi_Minh (GMT+7)");
  const [showUserId, setShowUserId] = useState(false);
  
  const [saved,      setSaved]      = useState(false);
  const [deleteModal,setDeleteModal]= useState(false);

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
      {/* Personal Information */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Personal Information"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"10px", marginBottom:"14px" }}>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", marginBottom:"3px" }}>
              <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F }}>User ID</p>
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
              {profile.emailVerified ? "Verified" : "Unverified"}
            </p>
          </div>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F, marginBottom:"3px" }}>Status</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F }}>{profile.status || "-"}</p>
          </div>
          <div style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${BDR}`, background:"#F9FAFB" }}>
            <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F, marginBottom:"3px" }}>Role(s)</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1, fontFamily:F }}>{profile.roles?.length ? profile.roles.join(", ") : profile.roleLabel}</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"14px", marginBottom:"14px" }}>
          <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="Full name"/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
          <Input label="Email Address" value={email} onChange={setEmail}
            type="email" placeholder="student@gmail.com" disabled
            hint="Email is managed by the backend profile."/>
          <Input label="Time Zone" value={timeZone} onChange={setTimeZone}
            placeholder="Asia/Ho_Chi_Minh (GMT+7)" disabled
            hint="Read from /api/me and displayed for reference."/>
        </div>
      </div>

      {/* University Details */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="University Details"/>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Select label="University" value={university} onChange={setUniversity} options={UNIVERSITIES}/>
            <Input  label="Major"      value={major}      onChange={setMajor}      placeholder="e.g. Software Engineering"/>
          </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginBottom:"24px" }}>
        <SectionHeading title="Danger Zone"/>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 16px", borderRadius:"10px",
          background:"#FFF1F2", border:"1px solid #FECDD3",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <AlertTriangle size={16} color="#EF4444"/>
            <div>
              <p style={{ fontWeight:700, fontSize:"0.875rem", color:"#991B1B", fontFamily:F }}>Delete Account</p>
              <p style={{ fontSize:"0.75rem", color:"#EF4444", fontFamily:F }}>
                Permanently deletes all your data. This action cannot be undone.
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
            <Trash2 size={12}/> Delete Account
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
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><Check size={15}/> Saved!</> : "Save Changes"}
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
              <h3 style={{ fontWeight:900, fontSize:"1.1rem", color:T1, fontFamily:F, marginBottom:"8px" }}>Delete your account?</h3>
              <p style={{ fontSize:"0.875rem", color:T2, lineHeight:1.65, marginBottom:"20px", fontFamily:F }}>
                This will permanently delete all your data, progress, roadmaps and CV files. This action cannot be undone.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setDeleteModal(false)}
                  style={{ flex:1, padding:"10px", borderRadius:"9px", border:`1px solid ${BDR}`, background:CARD, color:T2, fontFamily:F, fontWeight:600, cursor:"pointer" }}>
                  Cancel
                </button>
                <button style={{ flex:1, padding:"10px", borderRadius:"9px", background:"#EF4444", border:"none", color:"#fff", fontFamily:F, fontWeight:700, cursor:"pointer" }}>
                  Yes, Delete
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
      <p style={{ color:T3, fontSize:"0.875rem", fontFamily:F }}>This section is coming soon.</p>
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

function SubscriptionTab() {
  const PLANS = [
    {
      id:       "free",
      tier:     "Free",
      price:    "Free",
      priceSub: null,
      desc:     null,
      accent:   "#6B7280",
      bg:       "#F9FAFB",
      border:   BDR,
      btnBg:    "transparent",
      btnBorder:"#D1D5DB",
      btnColor: "#9CA3AF",
      btnLabel: "Current Plan",
      btnDisabled: true,
      badge:    null,
      features: ["3 Active Roadmaps","Basic Pomodoro","Community Access"],
    },
    {
      id:       "basic",
      tier:     "Basic",
      price:    "89k",
      priceSub: "đ/mo",
      desc:     null,
      accent:   "#0F766E",
      bg:       "#F0FDFA",
      border:   "rgba(15,118,110,0.18)",
      btnBg:    "#0F766E",
      btnBorder:"#0F766E",
      btnColor: "#FFFFFF",
      btnLabel: "Upgrade to Basic",
      btnDisabled: false,
      badge:    null,
      features: ["Unlimited Roadmaps","Advanced Analytics","Priority Support"],
    },
    {
      id:       "premium",
      tier:     "Premium",
      price:    "199k",
      priceSub: "đ/mo",
      desc:     null,
      accent:   OG,
      bg:       "#FFF7ED",
      border:   "rgba(255,107,0,0.18)",
      btnBg:    OG,
      btnBorder:OG,
      btnColor: "#FFFFFF",
      btnLabel: "Upgrade to Premium",
      btnDisabled: false,
      badge:    "MOST POPULAR",
      features: ["Everything in Basic","CV Export & Evidence","AI Skill Mentor","1-on-1 Tutor Match"],
    },
  ];

  return (
    <div>
      {/* ─ Current Plan Banner ─ */}
      <div style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"14px 16px", borderRadius:"12px",
        background:"#F9FAFB", border:`1px solid ${BDR}`,
        marginBottom:"20px",
      }}>
        <div style={{
          width:"36px", height:"36px", borderRadius:"9px",
          background:"#F3F4F6", border:`1px solid ${BDR}`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          <Zap size={16} color="#9CA3AF"/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:T1, fontFamily:F, lineHeight:1 }}>Free Plan</p>
          <p style={{ fontSize:"0.75rem", color:T3, fontFamily:F, marginTop:"2px" }}>
            0 VND / month · No card required
          </p>
        </div>
        <div style={{
          padding:"4px 12px", borderRadius:"99px",
          background:"transparent", border:"1.5px solid #10B981",
          display:"flex", alignItems:"center", gap:"5px",
        }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#10B981" }}/>
          <span style={{ fontSize:"0.75rem", color:"#10B981", fontWeight:700, fontFamily:F }}>Active</span>
        </div>
      </div>

      {/* ─ Plans Grid ─ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
        {PLANS.map(plan => (
          <motion.div key={plan.id}
            whileHover={!plan.btnDisabled ? { y:-2 } : {}}
            style={{
              background: plan.bg,
              borderRadius:"14px",
              border:`1px solid ${plan.border}`,
              padding:"20px 18px",
              display:"flex", flexDirection:"column",
              boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
              position:"relative", overflow:"hidden",
            }}
          >
            {/* MOST POPULAR badge */}
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
              color: plan.badge ? T1 : plan.accent,
              fontFamily:F, marginBottom:"6px",
              marginTop: plan.badge ? "0" : "18px", // align with others
            }}>
              {plan.tier}
            </p>

            {/* Price */}
            <div style={{ display:"flex", alignItems:"baseline", gap:"2px", marginBottom:"14px" }}>
              <span style={{
                fontSize:"1.8rem", fontWeight:900, letterSpacing:"-0.04em",
                color: plan.id==="free" ? T1 : plan.accent,
              }}>
                {plan.price}
              </span>
              {plan.priceSub && (
                <span style={{ fontSize:"0.75rem", color:T3, marginLeft:"1px" }}>{plan.priceSub}</span>
              )}
            </div>

            {/* Features */}
            <ul style={{
              listStyle:"none", margin:"0 0 auto", padding:0,
              display:"flex", flexDirection:"column", gap:"8px",
              marginBottom:"18px",
            }}>
              {plan.features.map(f => (
                <PlanFeature key={f} text={f} color={plan.id==="free" ? T2 : T1}/>
              ))}
            </ul>

            {/* CTA */}
            <motion.button
              whileHover={!plan.btnDisabled ? { scale:1.02 } : {}}
              whileTap={!plan.btnDisabled ? { scale:0.97 } : {}}
              disabled={plan.btnDisabled}
              style={{
                width:"100%", padding:"11px 0", borderRadius:"10px",
                background: plan.btnBg,
                border:`1.5px solid ${plan.btnBorder}`,
                color: plan.btnColor,
                fontFamily:F, fontWeight:700, fontSize:"0.875rem",
                cursor: plan.btnDisabled ? "default" : "pointer",
                boxShadow: plan.id==="premium" ? "0 4px 14px rgba(255,107,0,0.28)"
                          : plan.id==="basic"   ? "0 4px 14px rgba(15,118,110,0.2)"
                          : "none",
                transition:"all 0.15s",
              }}
            >
              {plan.btnLabel}
            </motion.button>
          </motion.div>
        ))}
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition hover:bg-white hover:shadow-sm">
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
          checked ? "bg-[#FF6B00]" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
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
      <SectionHeading title="Notification Preferences" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <ToggleRow
          title="Email reminders"
          description="Receive plan reminders before each study session."
          checked={emailReminders}
          onChange={setEmailReminders}
        />
        <ToggleRow
          title="Pomodoro alerts"
          description="Notify when focus time ends and break starts."
          checked={pomodoroAlert}
          onChange={setPomodoroAlert}
        />
        <ToggleRow
          title="Weekly digest"
          description="Summary of progress, streak and completed tasks every Sunday."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
        <ToggleRow
          title="Deadline nudge"
          description="Extra reminders 24h before upcoming exams or deadlines."
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
          {saved ? <><Check size={14} /> Saved</> : "Save Notification Settings"}
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
      <SectionHeading title="Privacy & Visibility" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <ToggleRow
          title="Public profile"
          description="Allow others to view your learning profile page."
          checked={publicProfile}
          onChange={setPublicProfile}
        />
        <ToggleRow
          title="Show name on leaderboard"
          description="Display your name and streak rank publicly."
          checked={showLeaderboardName}
          onChange={setShowLeaderboardName}
        />
        <ToggleRow
          title="Product analytics"
          description="Share anonymized usage data to improve AI recommendations."
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
          2FA and security logs will be added in backend phase.
        </p>
        <p style={{ fontFamily: F, fontSize: "0.74rem", color: "#6366F1", marginTop: "4px" }}>
          UI is ready now, API integration will be attached later.
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
          {saved ? <><Check size={14} /> Saved</> : "Save Privacy Settings"}
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
      <SectionHeading title="System Integrations" />

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
            Date source mode (so bo)
          </p>
          <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: "3px" }}>
            Current app uses browser time. Switch to Server Time after backend launch.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <Select
          label="Date Source"
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
          title="Auto-sync every minute"
          description="Refresh date and status data automatically in dashboard modules."
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
        <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.8rem", color: "#1D4ED8" }}>Backend status: Not connected</p>
        <p style={{ fontFamily: F, fontSize: "0.74rem", color: "#3B82F6", marginTop: "4px" }}>
          This tab is UI-ready. When backend is enabled, it will read live health/date endpoints.
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
          {saved ? <><Check size={14} /> Saved</> : "Save Integration Settings"}
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

  const LEVEL    = 7;
  const STREAK   = 12;

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const me = await meService.getMe();
        if (!mounted) return;
        setProfile(mapMeResponse(me));
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

  const avatarLetter = (profile.fullName.trim().charAt(0) || profile.email.charAt(0) || "U").toUpperCase();

  const handleSignOut = () => {
    clearAuthTokens();
    navigate("/auth");
  };

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] px-1 py-1 text-slate-900 overflow-hidden animate-fade-in" style={{ fontFamily: F }}>
      {/* Premium ambient decorative background glow circles */}
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FF6B00]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#6366F1]/5 to-transparent blur-[150px] pointer-events-none" />

      {/* ── Profile Banner ── */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:p-8 mb-6">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FF6B00]/5 blur-[80px]" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-5 flex-1 min-w-0">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-16 h-16 rounded-full flex-shrink-0 object-cover border-2 border-orange-100 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <span className="text-2xl font-black text-white">{avatarLetter}</span>
            </div>
          )}

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
              {profile.fullName}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 mb-3">
              {profile.email || "No email in session"} · {profile.roleLabel}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                Free Plan
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold ${
                profile.emailVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"
              }`}>
                {profile.emailVerified ? <><BadgeCheck size={11} /> Email verified</> : <><AlertTriangle size={11} /> Email not verified</>}
              </span>
              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-[10px] font-bold">
                ⭐ Level {LEVEL}
              </span>
              <span className="rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200 px-3 py-1 text-[10px] font-bold">
                🔥 {STREAK}-Day Streak
              </span>
              {profileLoading && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 text-[10px] font-bold">
                  <Loader2 size={10} className="animate-spin" /> Syncing profile
                </span>
              )}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 px-5 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition duration-150 self-center sm:self-auto"
        >
          <Gift size={13}/> Mời bạn &amp; Nhận Premium
        </motion.button>
      </div>

      {/* ── Two-column Layout ── */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[210px_1fr] items-start">

        {/* Sidebar sub-nav */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3.5 py-2 mb-2">Cấu hình</p>

          <div className="space-y-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive ? "bg-orange-50 text-[#FF6B00]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-[#FF6B00]" : "text-slate-400"} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-slate-100 my-3.5 mx-2" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-rose-600 transition-colors duration-200 hover:bg-rose-50"
          >
            <LogOut size={14} className="text-rose-500" />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "account"       && <AccountTab profile={profile} onSave={handleUpdateProfile} saving={savingProfile}/>} 
              {activeTab === "subscription"  && <SubscriptionTab/>}
              {activeTab === "notifications" && <NotificationsTab/>}
              {activeTab === "privacy"       && <PrivacyTab/>}
              {activeTab === "integrations"  && <IntegrationsTab/>}
              {activeTab !== "account" && activeTab !== "subscription" && activeTab !== "notifications" && activeTab !== "privacy" && activeTab !== "integrations" && (
                <PlaceholderTab label={TABS.find(t=>t.id===activeTab)?.label ?? "Settings"}/>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}