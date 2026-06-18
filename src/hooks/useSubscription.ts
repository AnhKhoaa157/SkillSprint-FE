import { useState, useCallback, useEffect } from "react";
import { getCurrentSubscription } from "../api/billing/subscriptionsService";
import { useAuth } from "../app/contexts/AuthContext";

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
  if (u === "PREMIUM" || u === "CAREER_PREMIUM" || u === "ADMIN" || u === "ADMIN_DEFAULT") return "PREMIUM";
  if (u === "FREE" || u === "STARTER") return "FREE";
  
  // Fallback heuristics: if backend planType is missing or custom, try to infer by price
  if (price !== undefined && price !== null) {
    if (price >= 150000) return "PREMIUM";
    if (price > 0) return "SKILL_BUILDER";
  }

  return "FREE";
}

export function useSubscription() {
  const { session } = useAuth();
  const isAdmin = 
    session?.role === "ADMIN" || 
    session?.role === "ADMINISTRATOR" || 
    session?.role === "ADMIN_DEFAULT";

  const [planId, setPlanId] = useState<NormalizedPlanId>(isAdmin ? "PREMIUM" : "FREE");
  const [planName, setPlanName] = useState<string>(isAdmin ? "Career Premium" : "Starter");
  const [rawPlanId, setRawPlanId] = useState<string | undefined>(undefined);
  const [rawPlanType, setRawPlanType] = useState<string | undefined>(isAdmin ? "ADMIN_DEFAULT" : undefined);
  const [loading, setLoading] = useState(!isAdmin); // if admin, we might not even need to wait to know they are premium

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sub = await getCurrentSubscription();
      
      const rawPlanType = sub?.plan?.planType || (sub?.plan as any)?.plan_type || (sub?.plan as any)?.type || (sub as any)?.planType || (sub as any)?.plan_type;
      const rawPlanId = sub?.plan?.planId || (sub?.plan as any)?.plan_id || (sub?.plan as any)?.id || (sub as any)?.planId || (sub as any)?.plan_id;
      const rawPlanName = sub?.plan?.planName || (sub?.plan as any)?.plan_name || (sub?.plan as any)?.name || (sub as any)?.planName || (sub as any)?.plan_name;

      const pType = rawPlanType?.toUpperCase();
      const pId = String(rawPlanId)?.toUpperCase();
      const pName = rawPlanName?.toUpperCase();
      const isDevPlan = 
        pType === "ADMIN_DEFAULT" || 
        pType?.includes("ADMIN") ||
        pId === "ADMIN_DEFAULT" || 
        pName === "ADMIN_DEFAULT" || 
        pName?.includes("ADMIN");

      let normalized = normalizePlan(rawPlanType, sub?.plan?.monthlyPrice);
      
      if (isAdmin || isDevPlan) {
        normalized = "PREMIUM";
      }

      setPlanId(normalized);
      setPlanName(rawPlanName || PLAN_META[normalized].label);
      setRawPlanId(rawPlanId);
      
      // Override rawPlanType if it's the dev plan so the cheat button works
      setRawPlanType(isDevPlan ? "ADMIN_DEFAULT" : rawPlanType);
    } catch {
      // keep previous value on transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { planId, planName, rawPlanId, rawPlanType, planMeta: PLAN_META[planId], loading, refresh };
}
