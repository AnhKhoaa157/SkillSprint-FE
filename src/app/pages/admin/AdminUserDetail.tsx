import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Shield, CreditCard, Calendar, RefreshCw, Clock, LogIn, History, Settings, FileText, Info, CheckCircle2, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import adminUserService, { type AdminUserDetail } from "../../../api/adminUserService";

const ROLE_OPTIONS = [
  { label: "Quản trị viên (ADMIN)", value: "ADMIN" },
  { label: "Người học (LEARNER)", value: "LEARNER" },
];

const STATUS_OPTIONS = [
  { label: "Hoạt động (ACTIVE)", value: "ACTIVE" },
  { label: "Vô hiệu (DISABLE)", value: "DISABLED" },
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

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [roleInput, setRoleInput] = useState("LEARNER");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminUserService.getAdminUser(id)
      .then((data) => {
        setUser(data);
        setStatusInput(data.status || "");
        setRoleInput(data.role ? String(data.role).toUpperCase() : "LEARNER");
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
      console.error(e);
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
      console.error(e);
      toast.error(e.message || "Lỗi cập nhật vai trò");
    } finally { setLoading(false); }
  }

  if (!id) return <div className="p-8 text-center text-slate-500 font-medium">ID người dùng không hợp lệ</div>;

  const badge = STATUS_BADGE[String(user?.status).toUpperCase()] ?? { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: user?.status || "Không rõ" };
  const sub = user?.currentSubscription;

  const isStatusChanged = user?.status !== statusInput;
  const isRoleChanged = (user?.role ? String(user.role).toUpperCase() : "LEARNER") !== roleInput;

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

  const isPremium = sub?.planName?.toUpperCase().includes("PREMIUM");

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif" }}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Top Navigation */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm"
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
              
              {/* ── 1. BANNER THÔNG TIN CHÍNH ── */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(255,107,0,0.03) 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />
                
                <div className="flex items-center gap-4 relative z-10">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm overflow-hidden shrink-0 border border-slate-100"
                    style={{ background: "linear-gradient(135deg, #FF6B00, #EA580C)" }}
                  >
                    {shouldShowImage ? (
                      <img 
                        src={avatarUrl} 
                        alt="User avatar" 
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      initial
                    )}
                  </motion.div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">{user.fullName || "Chưa cập nhật tên"}</h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {user.email}</p>
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

              {/* ── 2. GRID KÉP: GÓI DỊCH VỤ VÀ BẢNG ĐIỀU KHIỂN ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* Khối Gói Dịch Vụ */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                  className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <CreditCard size={16} className="text-orange-500" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Thông tin gói dịch vụ hiện tại</h3>
                    </div>
                    
                    {sub ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          
                          {/* BOX TÊN GÓI: FIX ĐƠ, TIA SÁNG QUÉT CHÉO LIÊN TỤC KHÔNG DỪNG */}
                          {isPremium ? (
                            <motion.div 
                              animate={{ 
                                boxShadow: [
                                  "0 0 10px rgba(234,88,12,0.2)", 
                                  "0 0 22px rgba(245,158,11,0.5)", 
                                  "0 0 10px rgba(234,88,12,0.2)"
                                ] 
                              }}
                              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                              className="p-3.5 rounded-xl border relative overflow-hidden space-y-1 flex flex-col justify-center shadow-md select-none"
                              style={{
                                background: "linear-gradient(135deg, #EA580C 0%, #EAB308 100%)",
                                borderColor: "transparent"
                              }}
                            >
                              {/* Tia sáng quét chéo x dịch chuyển rộng, dùng phần trăm bao phủ để lặp mượt, triệt tiêu drop frame */}
                              <motion.div 
                                animate={{ x: ["-180%", "280%"] }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 2.4, 
                                  ease: [0.42, 0, 0.58, 1]
                                }}
                                className="absolute inset-y-0 w-1/2 skew-x-[25deg] pointer-events-none"
                                style={{
                                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(255,255,255,0.1), transparent)"
                                }}
                              />
                              <div className="flex items-center gap-1.5 text-white/90 font-extrabold uppercase text-[10px] tracking-widest">
                                <motion.div
                                  animate={{ y: [0, -1.5, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                >
                                  <Crown size={11} className="text-yellow-200 fill-yellow-200" />
                                </motion.div>
                                Gói hiện tại
                              </div>
                              <p className="text-sm font-black text-white tracking-wide uppercase drop-shadow-sm">
                                {sub.planName}
                              </p>
                            </motion.div>
                          ) : (
                            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gói hiện tại</p>
                              <p className="text-sm font-black text-slate-700">{sub.planName || "Gói ẩn"}</p>
                            </div>
                          )}

                          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1 flex flex-col justify-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái gói</p>
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
                          <div className="flex items-center gap-3">
                            <Calendar size={15} className="text-slate-400 shrink-0" />
                            <span><strong>Hạn sử dụng:</strong> {sub.endDate ? new Date(sub.endDate).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' }) : "Vô hạn (Không giới hạn thời gian)"}</span>
                          </div>
                          <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100/70">
                            <FileText size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Mã đối chiếu cổng thanh toán:</strong> {sub.id ? String(sub.id) : "SUB_GEN_OR_LEGACY"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 text-center text-slate-400 text-xs font-medium italic">
                        Tài khoản này hiện tại chưa đăng ký gói dịch vụ nào trên SkillSprint.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
                    <Shield size={11} /> Dữ liệu hóa đơn tự động đồng bộ hóa thời gian thực với hệ thống cổng Core.
                  </div>
                </motion.div>

                {/* Khối Điều Khiển Admin */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Settings size={14} className="text-slate-400" />
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động quản trị</h3>
                    </div>
                    
                    {/* Trạng thái */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái tài khoản</label>
                      <select 
                        value={statusInput} 
                        onChange={(e) => setStatusInput(e.target.value)} 
                        className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium cursor-pointer"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <motion.button 
                        onClick={saveStatus} 
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-8.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105"
                        style={{ 
                          background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                          opacity: loading ? 0.6 : (isStatusChanged ? 1 : 0.85)
                        }}
                      >
                        {loading ? "Đang xử lý..." : "Cập nhật trạng thái"}
                      </motion.button>
                    </div>

                    {/* Vai trò */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Phân quyền hệ thống</label>
                      <select 
                        value={roleInput} 
                        onChange={(e) => setRoleInput(e.target.value)} 
                        className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <motion.button 
                        onClick={saveRoles} 
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-8.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105"
                        style={{ 
                          background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                          opacity: loading ? 0.6 : (isRoleChanged ? 1 : 0.85)
                        }}
                      >
                        {loading ? "Đang xử lý..." : "Cập nhật vai trò"}
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100/60 flex items-start gap-2 text-[11px] text-amber-800">
                    <Info size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="leading-normal">
                      <strong>Lưu ý:</strong> Mọi thay đổi về trạng thái hoặc vai trò sẽ áp dụng ngay lập tức cho phiên đăng nhập tiếp theo của người dùng.
                    </p>
                  </div>
                </motion.div>

              </div>

              {/* ── 3. KHỐI NHẬT KÝ HỆ THỐNG ĐỘNG ── */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <History size={15} className="text-slate-400" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nhật ký hệ thống</h3>
                </div>
                
                <div className="mt-4 space-y-3 text-xs">
                  {systemLogs.length > 0 ? (
                    systemLogs.map((log) => (
                      <motion.div 
                        key={log.id}
                        whileHover={{ x: 2 }} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 text-slate-600">
                          {log.icon}
                          <span>{log.text}</span>
                        </div>
                        <span className="font-mono text-slate-400">
                          {new Date(log.time).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 italic">
                      Chưa ghi nhận dòng thời gian hoạt động của tài khoản này.
                    </div>
                  )}
                </div>
              </motion.div>
              
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}