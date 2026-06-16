import { useState, useCallback, useEffect } from "react";
import { getCurrentSubscription } from "../api/subscriptionsService";

export type NormalizedPlanId = "FREE" | "SKILL_BUILDER" | "PREMIUM";

export interface PlanMeta {
  label: string;
  badge: string;
  upgradeLabel: string;
  upgradeSubtext: string;
}

const PLAN_META: Record<NormalizedPlanId, PlanMeta> = {
  FREE: {
    label: "Starter",
    badge: "FREE",
    upgradeLabel: "Nâng cấp lên Pro",
    upgradeSubtext: "Mở khóa tính năng AI và nhiều hơn",
  },
  SKILL_BUILDER: {
    label: "Skill Builder",
    badge: "SKILL BUILDER",
    upgradeLabel: "Nâng cấp lên Premium",
    upgradeSubtext: "Mở khóa Gia sư AI và Quiz theo chương",
  },
  PREMIUM: {
    label: "Career Premium",
    badge: "PREMIUM",
    upgradeLabel: "Quản lý gói Premium",
    upgradeSubtext: "Xem chi tiết và lịch sử giao dịch",
  },
};

function normalizePlan(raw: string | undefined | null): NormalizedPlanId {
  if (!raw) return "FREE";
  const u = raw.toUpperCase();
  if (u === "SKILL_BUILDER" || u === "BUILDER") return "SKILL_BUILDER";
  if (u === "PREMIUM" || u === "CAREER_PREMIUM") return "PREMIUM";
  return "FREE";
}

export function useSubscription() {
  const [planId, setPlanId] = useState<NormalizedPlanId>("FREE");
  const [planName, setPlanName] = useState<string>("Starter");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sub = await getCurrentSubscription();
      const normalized = normalizePlan(sub?.plan?.planType);
      setPlanId(normalized);
      // Use the live planName from backend if available, otherwise fallback to the PLAN_META label
      setPlanName(sub?.plan?.planName || PLAN_META[normalized].label);
    } catch {
      // keep previous value on transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { planId, planName, planMeta: PLAN_META[planId], loading, refresh };
}
