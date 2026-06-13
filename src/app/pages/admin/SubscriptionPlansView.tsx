import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, Layers, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  getSubscriptionPlanDetail,
  type ServicePlanResponse,
} from "../../../api/adminSubscriptionPlansService";
import { PlanBadgeStyles } from "../../../components/admin/PlanTypeBadge";
import { usePlans, useAuditLogs, useModal } from "./subscriptionPlans/usePlanManager";
import { StatCards, PlansTable, AuditLogList } from "./subscriptionPlans/components";
import { PlanFormModal, StatusModal, FeaturesModal, PlanDetailModal } from "./subscriptionPlans/modals";

const TABS = [
  { id: "plans" as const, label: "Gói dịch vụ", icon: Layers },
  { id: "audit" as const, label: "Nhật ký thay đổi", icon: ClipboardList },
];

export function SubscriptionPlansView() {
  const [tab, setTab] = useState<"plans" | "audit">("plans");
  const { plans, loading: loadingPlans, reload: reloadPlans, upsert } = usePlans();
  const audit = useAuditLogs();
  const { modal, setModal, close } = useModal();

  useEffect(() => {
    if (tab === "audit") audit.ensureLoaded();
  }, [tab, audit]);

  function handlePlanSaved(saved: ServicePlanResponse) {
    upsert(saved);
    audit.invalidate(); // log changed → refetch next time the tab is opened
  }

  async function openDetail(plan: ServicePlanResponse) {
    try {
      const detail = await getSubscriptionPlanDetail(plan.planId);
      setModal({ type: "detail", plan: detail });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const planActions = {
    onDetail: openDetail,
    onEdit: (plan: ServicePlanResponse) => setModal({ type: "edit", plan }),
    onStatus: (plan: ServicePlanResponse) => setModal({ type: "status", plan }),
    onFeatures: (plan: ServicePlanResponse) => setModal({ type: "features", plan }),
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <PlanBadgeStyles />

      <div className="rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Layers size={20} className="text-[#FF6B00]" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-slate-900 leading-none">Quản lý gói dịch vụ</h1>
                <p className="text-xs text-slate-500 mt-1">Cấu hình các gói subscription · {plans.length} gói hiện có</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={reloadPlans} disabled={loadingPlans}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700 disabled:opacity-50">
              <RefreshCw size={14} className={loadingPlans ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button onClick={() => setModal({ type: "create" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-0 bg-[#FF6B00] hover:bg-[#e05e00] transition-colors text-white cursor-pointer text-xs font-bold shadow-sm">
              <Plus size={16} />
              Tạo gói mới
            </button>
          </div>
        </div>
      </div>

      <StatCards plans={plans} />

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border-none cursor-pointer text-xs font-bold transition-all ${
              tab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="flex flex-col gap-3">
          {loadingPlans ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Đang tải danh sách gói...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              Chưa có gói dịch vụ nào.&nbsp;
              <button onClick={() => setModal({ type: "create" })} className="bg-transparent border-none cursor-pointer text-[#FF6B00] font-bold hover:underline">
                Tạo gói đầu tiên
              </button>
            </div>
          ) : (
            <PlansTable plans={plans} actions={planActions} />
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button onClick={audit.reload} disabled={audit.loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700 disabled:opacity-50">
              <RefreshCw size={13} className={audit.loading ? "animate-spin" : ""} />
              Làm mới nhật ký
            </button>
          </div>

          {audit.loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Đang tải nhật ký...</div>
          ) : audit.logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              Chưa có nhật ký nào
            </div>
          ) : (
            <AuditLogList logs={audit.logs} />
          )}
        </div>
      )}

      <PlanFormModal
        open={modal?.type === "create" || modal?.type === "edit"}
        onClose={close}
        editPlan={modal?.type === "edit" ? modal.plan : null}
        onSaved={handlePlanSaved}
      />
      <PlanDetailModal
        open={modal?.type === "detail"}
        onClose={close}
        plan={modal?.type === "detail" ? modal.plan : null}
      />
      <StatusModal
        open={modal?.type === "status"}
        onClose={close}
        plan={modal?.type === "status" ? modal.plan : null}
        onSaved={handlePlanSaved}
      />
      <FeaturesModal
        open={modal?.type === "features"}
        onClose={close}
        plan={modal?.type === "features" ? modal.plan : null}
        onSaved={handlePlanSaved}
      />
    </motion.div>
  );
}

export default SubscriptionPlansView;
