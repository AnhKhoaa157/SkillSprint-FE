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

function normalizePlan(raw: string | undefined | null, price?: number | null): NormalizedPlanId {
  const u = raw?.toUpperCase();
  if (u === "SKILL_BUILDER" || u === "BUILDER") return "SKILL_BUILDER";
  if (u === "PREMIUM" || u === "CAREER_PREMIUM") return "PREMIUM";
  if (u === "FREE" || u === "STARTER") return "FREE";
  
  // Fallback heuristics: if backend planType is missing or custom, try to infer by price
  if (price !== undefined && price !== null) {
    if (price >= 150000) return "PREMIUM";
    if (price > 0) return "SKILL_BUILDER";
  }

  return "FREE";
}

export function useSubscription() {
  const [planId, setPlanId] = useState<NormalizedPlanId>("FREE");
  const [planName, setPlanName] = useState<string>("Starter");
  const [rawPlanId, setRawPlanId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sub = await getCurrentSubscription();
      const normalized = normalizePlan(sub?.plan?.planType, sub?.plan?.monthlyPrice);
      setPlanId(normalized);
      // Use the live planName from backend if available, otherwise fallback to the PLAN_META label
      setPlanName(sub?.plan?.planName || PLAN_META[normalized].label);
      setRawPlanId(sub?.plan?.planId);
    } catch {
      // keep previous value on transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { planId, planName, rawPlanId, planMeta: PLAN_META[planId], loading, refresh };
}
