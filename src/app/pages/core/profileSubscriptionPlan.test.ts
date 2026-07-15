import { describe, expect, it } from "vitest";
import type { PublicPlanResponse } from "../../../api/admin/adminSubscriptionPlansService";
import { resolveCurrentProfilePlanId, resolveProfilePlanSlots } from "./profileSubscriptionPlan";

function createPlan(overrides: Partial<PublicPlanResponse>): PublicPlanResponse {
  return {
    planId: "plan-id",
    planName: "Plan",
    description: null,
    monthlyPrice: 0,
    currency: "VND",
    quotas: null,
    ...overrides,
  };
}

describe("profile subscription plan resolution", () => {
  it("keeps Premium in the Premium card when only one paid public plan is available", () => {
    const slots = resolveProfilePlanSlots([
      createPlan({ planId: "free", planName: "Free", planType: "FREE" }),
      createPlan({ planId: "premium", planName: "Premium", planType: "PREMIUM", monthlyPrice: 199000 }),
    ]);

    expect(slots.career_premium?.planId).toBe("premium");
    expect(resolveCurrentProfilePlanId("premium", "PREMIUM", "Premium", slots)).toBe("career_premium");
  });

  it("maps a private admin plan to Premium instead of falling back to Free", () => {
    const slots = resolveProfilePlanSlots([
      createPlan({ planId: "free", planName: "Free", planType: "FREE" }),
      createPlan({ planId: "basic", planName: "Basic", planType: "SKILL_BUILDER", monthlyPrice: 89000 }),
      createPlan({ planId: "premium", planName: "Premium", planType: "PREMIUM", monthlyPrice: 199000 }),
    ]);

    expect(resolveCurrentProfilePlanId("admin-test-plan", "ADMIN_DEFAULT", "Admin test", slots)).toBe("career_premium");
  });
});
