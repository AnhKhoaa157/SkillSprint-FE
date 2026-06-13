import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Settings2, Shield, ToggleRight,
} from "lucide-react";
import {
  formatPlanPrice,
  type AdminAuditLogResponse,
  type ServicePlanResponse,
} from "../../../../api/adminSubscriptionPlansService";
import { PlanTypeBadge } from "../../../../components/admin/PlanTypeBadge";
import { Badge } from "./primitives";
import {
  ACTION_TYPE_COLOR, ACTION_TYPE_LABEL, BTN_THEMES, getStatCards, formatDate,
  type BtnType,
} from "./config";

/* -------------------------------------------------------------------------- */
/*  Header summary cards.                                                     */
/* -------------------------------------------------------------------------- */

export function StatCards({ plans }: { plans: ServicePlanResponse[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {getStatCards(plans).map(({ label, value, Icon, iconBg, iconColor, valueClass }) => (
        <div key={label} className="flex items-center gap-3.5 p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-shadow">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</div>
            <div className={`text-2xl font-extrabold leading-tight ${valueClass}`}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plans table.                                                              */
/* -------------------------------------------------------------------------- */

type PlanActions = {
  onDetail: (plan: ServicePlanResponse) => void;
  onEdit: (plan: ServicePlanResponse) => void;
  onStatus: (plan: ServicePlanResponse) => void;
  onFeatures: (plan: ServicePlanResponse) => void;
};

export function PlansTable({ plans, actions }: { plans: ServicePlanResponse[]; actions: PlanActions }) {
  const sorted = plans.slice().sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm text-slate-600">
        <thead className="bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            <th className="py-3.5 px-4 w-[22%]">Tên gói</th>
            <th className="py-3.5 px-4 w-[10%]">Loại</th>
            <th className="py-3.5 px-4 w-[12%]">Giá</th>
            <th className="py-3.5 px-4 w-[12%]">Trạng thái</th>
            <th className="py-3.5 px-4 w-[11%]">Hiển thị</th>
            <th className="py-3.5 px-4 w-[11%]">Tính năng</th>
            <th className="py-3.5 px-4 w-[10%]">Quyền lợi</th>
            <th className="py-3.5 px-4 w-[12%] text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((plan) => {
            const enabledFeatures = plan.features.filter((f) => f.enabled).length;
            const benefitsCount = (plan.benefits ?? []).length;
            return (
              <motion.tr
                key={plan.planId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="py-4 px-4 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-[15px] truncate">{plan.planName}</span>
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold leading-none">
                      #{plan.sortOrder ?? "—"}
                    </span>
                  </div>
                  {plan.description && (
                    <div className="text-xs text-slate-400 mt-1 max-w-[240px] truncate" title={plan.description}>
                      {plan.description}
                    </div>
                  )}
                </td>

                <td className="py-4 px-4 align-middle">
                  <PlanTypeBadge
                    type={plan.planType ?? "FREE"}
                    badgeColor={plan.badgeColor}
                    badgeIcon={plan.badgeIcon}
                    animationType={plan.animationType}
                  />
                </td>

                <td className="py-4 px-4 align-middle">
                  {plan.monthlyPrice <= 0 ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold">Miễn phí</Badge>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">
                      {formatPlanPrice(plan.monthlyPrice, plan.currency)}
                    </span>
                  )}
                </td>

                <td className="py-4 px-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    {plan.active ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-700">Hoạt động</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-sm font-medium text-slate-400">Vô hiệu</span>
                      </>
                    )}
                  </div>
                </td>

                <td className="py-4 px-4 align-middle">
                  {plan.publicVisible ? (
                    <Badge className="bg-blue-50 text-blue-600 border-blue-200/60 font-semibold flex items-center gap-1">
                      <Eye size={12} /> Công khai
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-400 border-slate-200 font-semibold flex items-center gap-1">
                      <EyeOff size={12} /> Ẩn
                    </Badge>
                  )}
                </td>

                <td className="py-4 px-4 align-middle">
                  <div className="text-sm text-slate-700 font-semibold">
                    {enabledFeatures}/{plan.features.length}
                    <span className="text-slate-400 font-normal text-xs"> tính năng</span>
                  </div>
                </td>

                <td className="py-4 px-4 align-middle">
                  {benefitsCount > 0 ? (
                    <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200/60 font-semibold">
                      {benefitsCount} quyền lợi
                    </Badge>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                <td className="py-4 px-4 align-middle text-right">
                  <div className="inline-flex items-center gap-2">
                    <ActionBtn icon={<Shield size={14} />} title="Chi tiết" onClick={() => actions.onDetail(plan)} type="detail" />
                    <ActionBtn icon={<Pencil size={14} />} title="Chỉnh sửa" onClick={() => actions.onEdit(plan)} type="edit" />
                    <ActionBtn icon={<ToggleRight size={14} />} title="Trạng thái" onClick={() => actions.onStatus(plan)} type={plan.active ? "status-active" : "status-inactive"} />
                    <ActionBtn icon={<Settings2 size={14} />} title="Tính năng" onClick={() => actions.onFeatures(plan)} type="features" />
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Action button — neon-glow micro-interaction.                             */
/* -------------------------------------------------------------------------- */

export function ActionBtn({
  icon, title, onClick, type,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  type: BtnType;
}) {
  const [hovered, setHovered] = useState(false);
  const theme = BTN_THEMES[type];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.08, y: -1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full border border-slate-200/80 bg-white shadow-sm transition-colors duration-300 cursor-pointer outline-none overflow-hidden ${theme.text}`}
        style={{ touchAction: "manipulation" }}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              layoutId={`glow-bg-${type}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute inset-0 z-0 ${theme.bg}`}
            />
          )}
        </AnimatePresence>

        <motion.span
          animate={{ rotate: hovered ? 15 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10 flex items-center justify-center"
        >
          {icon}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full mb-2 pointer-events-none z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-md shadow-slate-950/20"
          >
            {title}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Audit log list (owns its own row-expansion state).                       */
/* -------------------------------------------------------------------------- */

function AuditLogRow({ log, expanded, onToggle }: { log: AdminAuditLogResponse; expanded: boolean; onToggle: () => void }) {
  const actionMeta = ACTION_TYPE_COLOR[log.actionType] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const hasDetails = log.description || log.oldValue || log.newValue || log.metadata;

  return (
    <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
      <div
        onClick={hasDetails ? onToggle : undefined}
        className={`grid grid-cols-[1.6fr_1.2fr_1.6fr_1fr_auto] gap-3 items-center px-4 py-3 ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        } ${expanded ? "bg-slate-50/75" : "bg-white"} hover:bg-slate-50/40 transition-colors`}
      >
        <div className="text-xs text-slate-900">
          <div className="font-bold">{log.adminEmail}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{formatDate(log.createdAt)}</div>
        </div>
        <div>
          <Badge className={actionMeta}>
            {ACTION_TYPE_LABEL[log.actionType] ?? log.actionType}
          </Badge>
        </div>
        <div className="text-xs text-slate-900 font-bold truncate">{log.title}</div>
        <div className="text-[11px] font-mono text-slate-400 truncate">
          {log.entityId.slice(0, 8)}…
        </div>
        {hasDetails && (
          <div className="text-slate-400">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {expanded && hasDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-3.5 pt-2 flex flex-col gap-2 border-t border-slate-100 bg-slate-50/30"
        >
          {log.description && (
            <div className="text-xs text-slate-700 leading-relaxed">{log.description}</div>
          )}
          {(log.oldValue || log.newValue) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {log.oldValue && (
                <div className="p-2.5 bg-red-50/50 border border-red-200/40 rounded-lg">
                  <div className="text-[9px] font-bold text-red-700 mb-1.5 uppercase tracking-wider">Trước</div>
                  <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap break-all leading-normal">{log.oldValue}</pre>
                </div>
              )}
              {log.newValue && (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/40 rounded-lg">
                  <div className="text-[9px] font-bold text-emerald-700 mb-1.5 uppercase tracking-wider">Sau</div>
                  <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap break-all leading-normal">{log.newValue}</pre>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function AuditLogList({ logs }: { logs: AdminAuditLogResponse[] }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-[1.6fr_1.2fr_1.6fr_1fr_auto] gap-3 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Admin</span>
        <span>Hành động</span>
        <span>Nội dung</span>
        <span>Entity ID</span>
        <span className="w-4" />
      </div>

      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <AuditLogRow
            key={log.logId}
            log={log}
            expanded={expandedLogId === log.logId}
            onToggle={() => setExpandedLogId((id) => (id === log.logId ? null : log.logId))}
          />
        ))}
      </div>
    </>
  );
}
