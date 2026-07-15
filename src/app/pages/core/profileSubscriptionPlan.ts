import type { PublicPlanResponse } from "../../../api/admin/adminSubscriptionPlansService";
import { normalizePlanType } from "../../../utils/adminStatusHelpers";

export type ProfilePlanId = "starter" | "skill_builder" | "career_premium";

export type ProfilePlanSlots = Record<ProfilePlanId, PublicPlanResponse | null>;

const PLAN_IDS: ProfilePlanId[] = ["starter", "skill_builder", "career_premium"];

function toProfilePlanId(planType?: string | null, planName?: string | null): ProfilePlanId {
  const normalizedType = normalizePlanType(planType, planName);

  if (normalizedType === "SKILL_BUILDER") return "skill_builder";
  if (normalizedType === "PREMIUM" || normalizedType === "ADMIN_DEFAULT") return "career_premium";
  return "starter";
}

/**
 * Match public cards by their semantic tier first. Price is only a fallback for
 * legacy payloads that do not expose planType.
 */
export function resolveProfilePlanSlots(plans: PublicPlanResponse[]): ProfilePlanSlots {
  const sortedPaidPlans = plans
    .filter(plan => plan.monthlyPrice > 0)
    .sort((left, right) => left.monthlyPrice - right.monthlyPrice);

  const findByTier = (tier: ProfilePlanId) => plans.find(
    plan => toProfilePlanId(plan.planType, plan.planName) === tier,
  ) ?? null;

  const starter = findByTier("starter") ?? plans.find(plan => plan.monthlyPrice <= 0) ?? null;
  const declaredSkillBuilder = findByTier("skill_builder");
  const declaredCareerPremium = findByTier("career_premium");
  const fallbackPaidPlans = sortedPaidPlans.filter(
    plan => plan.planId !== declaredSkillBuilder?.planId && plan.planId !== declaredCareerPremium?.planId,
  );
  const skillBuilder = declaredSkillBuilder ?? fallbackPaidPlans[0] ?? null;
  const careerPremium = declaredCareerPremium
    ?? [...fallbackPaidPlans].reverse().find(plan => plan.planId !== skillBuilder?.planId) ?? null;

  return {
    starter,
    skill_builder: skillBuilder,
    career_premium: careerPremium,
  };
}

/**
 * The active subscription is authoritative. Its UUID wins whenever it matches
 * a public card; otherwise use its semantic tier so private/admin test plans
 * cannot be rendered as the Free plan merely because they are not public.
 */
export function resolveCurrentProfilePlanId(
  planId: string | null | undefined,
  planType: string | null | undefined,
  planName: string | null | undefined,
  slots: ProfilePlanSlots,
): ProfilePlanId {
  if (planId) {
    const matchedPlanId = PLAN_IDS.find(key => slots[key]?.planId === planId);
    if (matchedPlanId) return matchedPlanId;
  }

  return toProfilePlanId(planType, planName);
}
