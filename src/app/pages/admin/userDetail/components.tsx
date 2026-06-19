import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Mail, CreditCard, Calendar, RefreshCw, Clock, LogIn, History,
  Settings, FileText, CheckCircle2, UserPlus, AlertTriangle, SearchX,
} from "lucide-react";
import { PlanTypeBadge } from "../../../../components/admin/PlanTypeBadge";
import type { AdminUserDetail, SubscriptionAdminResponse } from "../../../../api/admin/adminUserService";
import { SUB_TEXTS, resolveLivePlan, safeFormatDate, normalizePlanType } from "../../../../utils/adminStatusHelpers";
import SubscriptionStatusBadge from "../../../../components/admin/SubscriptionStatusBadge";
import type { ActionKey } from "./useUserDetail";
import {
  type SelectOption,
  getStatusBadge,
  getUserAvatarUrl,
  isAdminPlan,
  resolvePlanBadge,
  formatDate,
  formatDateTime,
} from "./config";

/* -------------------------------------------------------------------------- */
/*  Animation variants (shared by the page + cards).                          */
/* -------------------------------------------------------------------------- */

export const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 16 } },
} as const;

/* -------------------------------------------------------------------------- */
/*  Generic full-card state screen (loading / error / not-found / invalid).   */
/* -------------------------------------------------------------------------- */

export function StateScreen({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center justify-center gap-3 py-32 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 font-medium text-sm"
    >
      {icon}
      <span>{title}</span>
    </motion.div>
  );
}

export const LoadingScreen = () => (
  <StateScreen icon={<RefreshCw size={20} className="animate-spin text-orange-500" />} title="Đang tải dữ liệu hồ sơ..." />
);
export const ErrorScreen = ({ message }: { message: string }) => (
  <StateScreen icon={<AlertTriangle size={22} className="text-red-500" />} title={message} />
);
export const NotFoundScreen = () => (
  <StateScreen icon={<SearchX size={22} className="text-slate-400" />} title="Không tìm thấy hồ sơ người dùng." />
);
export const InvalidIdScreen = () => (
  <StateScreen icon={<AlertTriangle size={22} className="text-amber-500" />} title="ID người dùng không hợp lệ." />
);

/* -------------------------------------------------------------------------- */
/*  Header banner.                                                            */
/* -------------------------------------------------------------------------- */

export function UserBanner({ user, id }: { user: AdminUserDetail; id: string }) {
  const [imgError, setImgError] = useState(false);
  const badge = getStatusBadge(user.status);
  const avatarUrl = getUserAvatarUrl(user);
  const initial = (user.fullName || user.email || "?").charAt(0).toUpperCase();
  const showImage = avatarUrl.length > 0 && !imgError;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.03) 0%, transparent 70%)", transform: "translate(20%, -20%)" }}
      />

      <div className="flex items-center gap-4 relative z-10">
        {showImage ? (
          <img
            src={avatarUrl}
            alt={user.fullName || user.email}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #FF6B00, #EA580C)" }}
          >
            {initial}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              {user.fullName || "Chưa cập nhật tên"}
            </h2>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Mail size={13} /> {user.email}
          </p>
          <p className="text-[11px] font-mono text-slate-400">UID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 text-xs shrink-0">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock size={11} /> Tạo tài khoản
          </span>
          <p className="font-bold text-slate-700">{formatDate(user.createdAt)}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <LogIn size={11} /> Đăng nhập cuối
          </span>
          <p className="font-bold text-slate-700">{formatDate(user.lastLoginAt)}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subscription summary card.                                                */
/* -------------------------------------------------------------------------- */

export function SubscriptionCard({ sub, plans }: { sub?: SubscriptionAdminResponse | null; plans?: any[] }) {
  const active = sub?.status?.toUpperCase() === "ACTIVE";

  const livePlan = resolveLivePlan((sub as any)?.planId, plans || [], sub?.planType, sub?.planName);

  const rawPlanType = livePlan?.planType || sub?.planType;
  const planType = normalizePlanType(rawPlanType, livePlan?.planName || sub?.planName);

  const badgeColor = livePlan?.badgeColor || sub?.badgeColor;
  const badgeIcon = livePlan?.badgeIcon || sub?.badgeIcon;
  const animationType = livePlan?.animationType || sub?.animationType;

  const isAdmin = planType === "ADMIN_DEFAULT";
  const planName = isAdmin ? "ADMIN" : (livePlan?.planName || sub?.planName || "HIDDEN PLAN");

  return (
    <motion.div
      variants={itemVariants}
      className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <CreditCard size={16} className="text-orange-500" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Thông tin gói dịch vụ hiện tại
          </h3>
        </div>

        {sub ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-center items-start gap-1.5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gói đăng ký hiện hành</span>
                <PlanTypeBadge
                  type={planType}
                  label={planName}
                  badgeColor={badgeColor}
                  badgeIcon={badgeIcon}
                  animationType={animationType}
                  size="md"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1 flex flex-col justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái quyền lợi</p>
                <div className="pt-0.5">
                  <SubscriptionStatusBadge status={sub.status} size="md" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 text-xs space-y-2.5 text-slate-600">
              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Hạn sử dụng:</strong>{" "}
                  {isAdmin || !sub.endDate 
                    ? "Hết hạn: Vô hạn" 
                    : `Hết hạn: ${safeFormatDate(sub.endDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100/70">
                <FileText size={15} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  <strong>Mã đối chiếu danh mục:</strong> {sub.subscriptionId ? String(sub.subscriptionId) : "SUB_GEN_OR_LEGACY"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-14 text-center text-slate-400 text-xs font-medium italic">
            Tài khoản này {SUB_TEXTS.NO_SUBSCRIPTION.toLowerCase()}.
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Admin control panel — three identical select+save rows, one component.    */
/* -------------------------------------------------------------------------- */

const ORANGE = "bg-gradient-to-r from-[#FF6B00] to-[#EA580C]";

function AdminActionField({
  label,
  value,
  options,
  onChange,
  onSave,
  dirty,
  saving,
  gradient,
  actionLabel,
  divider,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
  gradient: string;
  actionLabel: string;
  divider?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${divider ? "pt-3 border-t border-slate-100" : ""}`}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl text-xs border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onSave}
        disabled={!dirty || saving}
        className={`w-full h-8.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:cursor-not-allowed ${gradient}`}
        style={{ opacity: dirty && !saving ? 1 : 0.85 }}
      >
        {saving ? "Đang lưu..." : actionLabel}
      </motion.button>
    </div>
  );
}

export function ControlPanel({
  form,
  dirty,
  savingKey,
  setField,
  save,
  statusOptions,
  roleOptions,
  planOptions,
}: {
  form: Record<ActionKey, string>;
  dirty: Record<ActionKey, boolean>;
  savingKey: ActionKey | null;
  setField: (key: ActionKey, value: string) => void;
  save: (key: ActionKey) => void;
  statusOptions: SelectOption[];
  roleOptions: SelectOption[];
  planOptions: SelectOption[];
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-5"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Settings size={14} className="text-slate-400" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động quản trị</h3>
        </div>

        <AdminActionField
          label="Trạng thái tài khoản"
          value={form.status}
          options={statusOptions}
          onChange={(v) => setField("status", v)}
          onSave={() => save("status")}
          dirty={dirty.status}
          saving={savingKey === "status"}
          gradient={ORANGE}
          actionLabel="Cập nhật trạng thái"
        />
        <AdminActionField
          label="Phân quyền hệ thống"
          value={form.role}
          options={roleOptions}
          onChange={(v) => setField("role", v)}
          onSave={() => save("role")}
          dirty={dirty.role}
          saving={savingKey === "role"}
          gradient={ORANGE}
          actionLabel="Cập nhật vai trò"
          divider
        />
        <AdminActionField
          label="Cấp phát gói dịch vụ"
          value={form.plan}
          options={planOptions}
          onChange={(v) => setField("plan", v)}
          onSave={() => save("plan")}
          dirty={dirty.plan}
          saving={savingKey === "plan"}
          gradient={ORANGE}
          actionLabel="Cập nhật gói đăng ký"
          divider
        />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  System activity log.                                                      */
/* -------------------------------------------------------------------------- */

type SystemLog = { id: string; time: string; text: React.ReactNode; icon: React.ReactNode };

type RoleRecord = { grantedAt?: string; roleName?: string; roleId?: string; role?: { roleName?: string } };

/** Assemble the activity timeline from whatever audit fields the DTO happens to expose. */
function buildSystemLogs(user: AdminUserDetail): SystemLog[] {
  const logs: SystemLog[] = [];

  if (user.createdAt) {
    logs.push({
      id: "create",
      time: user.createdAt,
      text: (
        <>
          Hệ thống khởi tạo thành công tài khoản thành viên{" "}
          <strong className="text-slate-800">{user.fullName || user.email}</strong>.
        </>
      ),
      icon: <UserPlus size={14} className="text-green-500 shrink-0" />,
    });
  }

  if (user.lastLoginAt) {
    logs.push({
      id: "login",
      time: user.lastLoginAt,
      text: (
        <>
          Thành viên xác thực phiên đăng nhập thành công vào hệ thống cổng học tập{" "}
          <strong className="text-slate-700">SkillSprint</strong>.
        </>
      ),
      icon: <LogIn size={14} className="text-blue-500 shrink-0" />,
    });
  }

  const userRoles: RoleRecord[] = (user as any).userRoles || (user as any).roleHistory || [];

  if (userRoles.length > 0) {
    userRoles.forEach((record, idx) => {
      const grantedAt = record.grantedAt;
      if (!grantedAt) return;
      const roleName = record.roleName ?? record.role?.roleName ?? record.roleId ?? "Unknown";
      logs.push({
        id: `role_grant_${idx}`,
        time: grantedAt,
        text: (
          <>
            Database <strong className="text-slate-700">user_role</strong> ghi nhận quyền:{" "}
            <strong className="text-orange-600">{roleName}</strong> cấp lúc {formatDate(grantedAt)}.
          </>
        ),
        icon: <CheckCircle2 size={14} className="text-orange-500 shrink-0" />,
      });
    });
  } else {
    const fallbackTime = (user as any).grantedAt || user.updatedAt;
    if (fallbackTime && fallbackTime !== user.createdAt) {
      logs.push({
        id: "update_role",
        time: fallbackTime,
        text: (
          <>
            Database <strong className="text-slate-700">user_role</strong> ghi nhận cập nhật quyền: Thay đổi phân quyền
            thành <strong className="text-orange-600">{user.role}</strong>.
          </>
        ),
        icon: <CheckCircle2 size={14} className="text-orange-500 shrink-0" />,
      });
    }
  }

  return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function SystemLogTimeline({ user }: { user: AdminUserDetail }) {
  const logs = buildSystemLogs(user);
  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <History size={15} className="text-slate-400" />
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nhật ký hệ thống</h3>
      </div>
      <div className="mt-4 space-y-3 text-xs">
        {logs.length > 0 ? (
          logs.map((log) => (
            <motion.div
              key={log.id}
              whileHover={{ x: 2 }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
            >
              <div className="flex items-center gap-2.5 text-slate-600">
                {log.icon}
                <span>{log.text}</span>
              </div>
              <span className="font-mono text-slate-400">{formatDateTime(log.time)}</span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 italic">Chưa ghi nhận dòng thời gian hoạt động.</div>
        )}
      </div>
    </motion.div>
  );
}
