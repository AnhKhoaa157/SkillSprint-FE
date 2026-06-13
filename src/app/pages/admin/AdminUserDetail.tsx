import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft, Mail, Shield, CreditCard, Calendar, RefreshCw, Clock, LogIn,
  History, Settings, FileText, Info, CheckCircle2, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import adminUserService, { type AdminUserDetail } from "../../../api/adminUserService";
import { PlanTypeBadge, PlanBadgeStyles } from "../../../components/admin/PlanTypeBadge";
import type { ServicePlanType } from "../../../api/adminSubscriptionPlansService";

const ROLE_OPTIONS = [
  { label: "Quản trị viên (ADMIN)", value: "ADMIN" },
  { label: "Người học (LEARNER)", value: "LEARNER" },
];

const STATUS_OPTIONS = [
  { label: "Hoạt động (ACTIVE)", value: "ACTIVE" },
  { label: "Vô hiệu (DISABLE)", value: "DISABLED" },
];

const PLAN_TYPE_OPTIONS = [
  { label: "Gói người dùng mới (FREE)", value: "FREE" },
  { label: "Gói cá nhân nâng cao (SKILL_BUILDER)", value: "SKILL_BUILDER" },
  { label: "Gói tối cao đầy đủ (PREMIUM)", value: "PREMIUM" },
  { label: "Gói hệ thống đặc quyền (ADMIN_DEFAULT)", value: "ADMIN_DEFAULT" }
];

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ACTIVE:   { bg: "rgba(34,197,94,0.08)",   text: "#16A34A", border: "rgba(34,197,94,0.15)",   label: "Hoạt động" },
  DISABLE:  { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
  DISABLED: { bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.15)", label: "Vô hiệu" },
};

function getUserAvatarUrl(user: AdminUserDetail) {
  const candidate = user.avatarUrl || user.avatar;
  if (typeof candidate !== "string") return "";
  const trimmed = candidate.trim();
  const normalized = trimmed.toLowerCase();
  if (!trimmed || normalized === "null" || normalized === "undefined") return "";
  return trimmed;
}

function DynamicPlanBadge({ sub }: { sub: any }) {
  if (!sub) {
    return <span className="text-xs font-medium text-slate-400 italic">Chưa đăng ký gói</span>;
  }

  // Force the "ADMIN" label + ADMIN_DEFAULT type for admin accounts so the badge resolves the
  // emerald fallback; a premium name with no explicit type still resolves to the premium look.
  const isAdmin = sub.planType === "ADMIN_DEFAULT" || String(sub.planName).toUpperCase().includes("ADMIN");
  const isPremium = sub.planType === "PREMIUM" || String(sub.planName).toUpperCase().includes("PREMIUM");
  const planType: ServicePlanType = isAdmin ? "ADMIN_DEFAULT" : isPremium ? "PREMIUM" : (sub.planType ?? "FREE");
  const planName = isAdmin ? "ADMIN" : (sub.planName || "Gói ẩn");

  return (
    <PlanTypeBadge
      type={planType}
      label={planName}
      badgeColor={sub.badgeColor}
      badgeIcon={sub.badgeIcon}
      animationType={sub.animationType}
    />
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [roleInput, setRoleInput] = useState("LEARNER");
  const [planTypeInput, setPlanTypeInput] = useState("FREE");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminUserService.getAdminUser(id)
      .then((data) => {
        setUser(data);
        setStatusInput(data.status || "");
        setRoleInput(data.role ? String(data.role).toUpperCase() : "LEARNER");
        setPlanTypeInput(data.currentSubscription?.planType || "FREE");
        setImgError(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải thông tin người dùng");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveStatus() {
    if (!id) return;
    try {
      setLoading(true);
      const updated = await adminUserService.updateUserStatus(id, { status: statusInput });
      setUser(updated);
      toast.success("Cập nhật trạng thái thành công");
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật trạng thái");
    } finally { setLoading(false); }
  }

  async function saveRoles() {
    if (!id) return;
    try {
      setLoading(true);
      const updated = await adminUserService.updateUserRole(id, { role: roleInput });
      setUser(updated);
      toast.success("Cập nhật vai trò thành công");
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật vai trò");
    } finally { setLoading(false); }
  }

  async function saveSubscriptionPlan() {
    if (!id) return;
    try {
      setLoading(true);
      const response = await adminUserService.updateUserSubscription(id, { planType: planTypeInput });
      
      // 🟢 CHUẨN HÓA KHỚP DỮ LIỆU PHẲNG: Bóc tách object lồng `.plan` sang cấu trúc SubscriptionAdminResponse phẳng
      const normalizedSub = {
        subscriptionId: response.subscriptionId,
        planName: response.plan?.planName || "Hệ Thống Admin",
        planType: planTypeInput,
        startDate: response.startDate || response.startAt,
        endDate: planTypeInput === "ADMIN_DEFAULT" ? null : (response.endDate || response.endAt),
        status: response.status,
        badgeColor: response.plan?.badgeColor,
        badgeIcon: response.plan?.badgeIcon,
        animationType: response.plan?.animationType
      };

      if (user) {
        setUser({
          ...user,
          currentSubscription: normalizedSub
        });
      }
      toast.success("Phát gói dịch vụ mới cho thành viên thành công!");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi cập nhật gói đăng ký");
    } finally { setLoading(false); }
  }

  if (!id) return <div className="p-8 text-center text-slate-500 font-medium">ID người dùng không hợp lệ</div>;

  const badge = STATUS_BADGE[String(user?.status).toUpperCase()] ?? { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: user?.status || "Không rõ" };
  const sub = user?.currentSubscription;

  const isStatusChanged = user?.status !== statusInput;
  const isRoleChanged = (user?.role ? String(user.role).toUpperCase() : "LEARNER") !== roleInput;
  const isPlanChanged = (sub?.planType || "FREE") !== planTypeInput;
  
  // 🟢 CHỐT CHẶN BẮT LOẠI GÓI ADMIN
  const isAdminPlan = sub?.planType === "ADMIN_DEFAULT" || String(sub?.planName).toUpperCase().includes("ADMIN");

  const avatarUrl = user ? getUserAvatarUrl(user) : "";
  const shouldShowImage = avatarUrl.length > 0 && !imgError;
  const initial = (user?.fullName || user?.email || "?").charAt(0).toUpperCase();

  const systemLogs: { id: string; time: string; text: React.ReactNode; icon: React.ReactNode }[] = [];

  if (user) {
    if (user.createdAt) {
      systemLogs.push({
        id: "create",
        time: user.createdAt,
        text: <>Hệ thống khởi tạo thành công tài khoản thành viên <strong className="text-slate-800">{user.fullName || user.email}</strong>.</>,
        icon: <UserPlus size={14} className="text-green-500 shrink-0" />
      });
    }

    if (user.lastLoginAt) {
      systemLogs.push({
        id: "login",
        time: user.lastLoginAt,
        text: <>Thành viên xác thực phiên đăng nhập thành công vào hệ thống cổng học tập <strong className="text-slate-700">SkillSprint</strong>.</>,
        icon: <LogIn size={14} className="text-blue-500 shrink-0" />
      });
    }

    type RoleRecord = { grantedAt?: string; roleName?: string; roleId?: string; role?: { roleName?: string } };
    const userRoles: RoleRecord[] = (user as any).userRoles || (user as any).roleHistory || [];

    if (userRoles.length > 0) {
      userRoles.forEach((record, idx) => {
        const grantedAt = record.grantedAt;
        const roleName = record.roleName ?? record.role?.roleName ?? record.roleId ?? "Unknown";
        if (grantedAt) {
          systemLogs.push({
            id: `role_grant_${idx}`,
            time: grantedAt,
            text: <>Database <strong className="text-slate-700">user_role</strong> ghi nhận quyền: <strong className="text-orange-600">{roleName}</strong> cấp lúc {new Date(grantedAt).toLocaleDateString("vi-VN")}.</>,
            icon: <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
          });
        }
      });
    } else {
      const fallbackTime = (user as any).grantedAt || user.updatedAt;
      if (fallbackTime && fallbackTime !== user.createdAt) {
        systemLogs.push({
          id: "update_role",
          time: fallbackTime,
          text: <>Database <strong className="text-slate-700">user_role</strong> ghi nhận cập nhật quyền: Thay đổi phân quyền thành <strong className="text-orange-600">{user.role}</strong>.</>,
          icon: <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
        });
      }
    }

    systemLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 16 } }
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif" }}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </motion.button>
        </motion.div>

        {loading && !user ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-500 font-medium text-sm bg-white rounded-2xl border border-slate-200 shadow-sm">
            <RefreshCw size={18} className="animate-spin text-orange-500" /> Đang tải dữ liệu hồ sơ...
          </div>
        ) : (
          user && (
            <div className="space-y-6">
              
              {/* Banner */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(255,107,0,0.03) 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm shrink-0" style={{ background: "linear-gradient(135deg, #FF6B00, #EA580C)" }}>
                    {initial}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">{user.fullName || "Chưa cập nhật tên"}</h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Mail size={13} /> {user.email}</p>
                    <p className="text-[11px] font-mono text-slate-400">UID: {id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={11} /> Tạo tài khoản</span>
                    <p className="font-bold text-slate-700">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><LogIn size={11} /> Đăng nhập cuối</span>
                    <p className="font-bold text-slate-700">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("vi-VN") : "—"}</p>
                  </div>
                </div>
              </motion.div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <CreditCard size={16} className="text-orange-500" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Thông tin gói dịch vụ hiện tại</h3>
                    </div>
                    
                    {sub ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-center items-start gap-1.5 shadow-sm">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gói đăng ký hiện hành</span>
                            <DynamicPlanBadge sub={sub} />
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1 flex flex-col justify-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái quyền lợi</p>
                            <div className="pt-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide" 
                                style={{ 
                                  background: sub.status?.toUpperCase() === "ACTIVE" ? "rgba(34,197,94,0.08)" : "#F1F5F9", 
                                  color: sub.status?.toUpperCase() === "ACTIVE" ? "#16A34A" : "#64748B",
                                  border: sub.status?.toUpperCase() === "ACTIVE" ? "1px solid rgba(34,197,94,0.15)" : "1px solid #E2E8F0"
                                }}>
                                {sub.status || "UNKNOWN"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 text-xs space-y-2.5 text-slate-600">
                          {/* 🟢 ĐÃ FIX TRIỆT ĐỂ: Nếu là gói Admin (isAdminPlan) -> Ép giao diện hiển thị Vô hạn thời gian */}
                          <div className="flex items-center gap-3">
                            <Calendar size={15} className="text-slate-400 shrink-0" />
                            <span>
                              <strong>Hạn sử dụng:</strong>{" "}
                              {isAdminPlan || !sub.endDate 
                                ? "Vô hạn (Không giới hạn thời gian)" 
                                : new Date(sub.endDate).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100/70">
                            <FileText size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Mã đối chiếu danh mục:</strong> {sub.planId ? String(sub.planId) : "SUB_GEN_OR_LEGACY"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 text-center text-slate-400 text-xs font-medium italic">Tài khoản này chưa đăng ký gói dịch vụ.</div>
                    )}
                  </div>
                </motion.div>

                {/* Control Panel */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Settings size={14} className="text-slate-400" />
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động quản trị</h3>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái tài khoản</label>
                      <select value={statusInput} onChange={(e) => setStatusInput(e.target.value)} className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium">
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <motion.button onClick={saveStatus} disabled={loading} className="w-full h-8.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#EA580C] shadow-sm" style={{ opacity: isStatusChanged ? 1 : 0.85 }}>Cập nhật trạng thái</motion.button>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Phân quyền hệ thống</label>
                      <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium">
                        {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <motion.button onClick={saveRoles} disabled={loading} className="w-full h-8.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#EA580C] shadow-sm" style={{ opacity: isRoleChanged ? 1 : 0.85 }}>Cập nhật vai trò</motion.button>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Cấp phát gói dịch vụ</label>
                      <select value={planTypeInput} onChange={(e) => setPlanTypeInput(e.target.value)} className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium">
                        {PLAN_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <motion.button onClick={saveSubscriptionPlan} disabled={loading} className="w-full h-8.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] shadow-sm" style={{ opacity: isPlanChanged ? 1 : 0.85 }}>Cập nhật gói đăng ký</motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Logs */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <History size={15} className="text-slate-400" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nhật ký hệ thống</h3>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  {systemLogs.length > 0 ? (
                    systemLogs.map((log) => (
                      <motion.div key={log.id} whileHover={{ x: 2 }} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="flex items-center gap-2.5 text-slate-600">{log.icon}<span>{log.text}</span></div>
                        <span className="font-mono text-slate-400">{new Date(log.time).toLocaleString("vi-VN")}</span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 italic">Chưa ghi nhận dòng thời gian hoạt động.</div>
                  )}
                </div>
              </motion.div>

            </div>
          )
        )}
      </motion.div>

      {/* Badge keyframes + Tailwind safelist (single source: components/admin/PlanTypeBadge). */}
      <PlanBadgeStyles />
    </div>
  );
}