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
      className="relative overflow-hidden rounded-[28px] border border-orange-100 bg-[linear-gradient(120deg,#ffffff_0%,#fffdf9_58%,#fff6eb_100%)] p-5 shadow-[0_18px_45px_rgba(148,86,24,0.08)] md:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-orange-100/70" />
      <div className="pointer-events-none absolute right-24 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-100 to-transparent" />

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {showImage ? (
            <img
              src={avatarUrl}
              alt={user.fullName || user.email}
              onError={() => setImgError(true)}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-[0_10px_24px_rgba(148,86,24,0.16)]"
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-[0_10px_24px_rgba(255,107,0,0.26)]"
              style={{ background: "linear-gradient(135deg, #FF7A18, #F05A00)" }}
            >
              {initial}
            </div>
          )}

          <div className="min-w-0 space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-600">Hồ sơ người dùng</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
                {user.fullName || "Chưa cập nhật tên"}
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
              >
                {badge.label}
              </span>
            </div>
            <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-slate-500">
              <Mail size={14} className="shrink-0 text-slate-400" /> {user.email}
            </p>
            <p className="font-mono text-[11px] text-slate-400">UID · {id}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:min-w-[320px]">
          <div className="rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-[0_6px_16px_rgba(148,86,24,0.05)] backdrop-blur-sm">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Clock size={12} /> Tạo tài khoản
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-slate-700">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-[0_6px_16px_rgba(148,86,24,0.05)] backdrop-blur-sm">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <LogIn size={12} /> Đăng nhập cuối
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-slate-700">{formatDate(user.lastLoginAt)}</dd>
          </div>
        </dl>
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
      className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)] md:col-span-2 md:p-7"
    >
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-52 w-52 rounded-full bg-orange-50" />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <CreditCard size={17} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600">Dịch vụ</p>
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900">Gói đang sử dụng</h3>
            </div>
          </div>
          {sub && <span className="text-[11px] font-medium text-slate-400">Cập nhật theo dữ liệu hệ thống</span>}
        </div>

        {sub ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-[1.15fr_.85fr]">
              <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-orange-100 bg-[linear-gradient(135deg,#fffaf5,#fff)] p-4 shadow-[0_8px_20px_rgba(255,107,0,0.05)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gói đăng ký</span>
                <PlanTypeBadge
                  type={planType}
                  label={planName}
                  badgeColor={badgeColor}
                  badgeIcon={badgeIcon}
                  animationType={animationType}
                  size="md"
                />
              </div>

              <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quyền lợi</p>
                <div>
                  <SubscriptionStatusBadge status={sub.status} size="md" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="shrink-0 text-orange-400" />
                <span className="py-3.5">
                  <strong className="font-semibold text-slate-700">Hạn sử dụng</strong>{" · "}
                  {isAdmin || !sub.endDate 
                    ? "Vô hạn"
                    : safeFormatDate(sub.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-200/70">
                <FileText size={16} className="shrink-0 text-slate-400" />
                <span className="truncate py-3.5">
                  <strong className="font-semibold text-slate-700">Mã đối chiếu</strong>{" · "}{sub.subscriptionId ? String(sub.subscriptionId) : "SUB_GEN_OR_LEGACY"}
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
    <div className={`space-y-2 ${divider ? "border-t border-slate-100 pt-4" : ""}`}>
      <label className="text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={dirty && !saving ? { y: -1 } : undefined}
        onClick={onSave}
        disabled={!dirty || saving}
        className={`h-10 w-full rounded-xl text-xs font-bold text-white shadow-[0_8px_16px_rgba(234,88,12,0.18)] transition disabled:cursor-not-allowed disabled:shadow-none ${gradient}`}
        style={{ opacity: dirty && !saving ? 1 : 0.45 }}
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
      className="h-fit rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)] lg:sticky lg:top-6"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Settings size={16} />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600">Quản trị</p>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">Điều chỉnh tài khoản</h3>
          </div>
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
