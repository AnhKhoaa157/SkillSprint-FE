import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSubscriptionPlans,
  getSubscriptionPlanDetail,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
  getPlanFeaturesCatalog,
  updatePlanFeatures,
  getSubscriptionPlanAuditLogs,
  listSubscriptionPlans,
} from "./adminSubscriptionPlansService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("adminSubscriptionPlansService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSubscriptionPlans", () => {
    it("should fetch subscription plans", async () => {
      const mockPlans = [{ planId: "p1" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlans } as any);

      const result = await getSubscriptionPlans();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans");
      expect(result).toEqual(mockPlans);
    });
  });

  describe("getSubscriptionPlanDetail", () => {
    it("should fetch a specific subscription plan", async () => {
      const mockPlan = { planId: "p1" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlan } as any);

      const result = await getSubscriptionPlanDetail("p1");

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/p1");
      expect(result).toEqual(mockPlan);
    });
  });

  describe("createSubscriptionPlan", () => {
    it("should create a subscription plan", async () => {
      const mockPlan = { planId: "p1" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlan } as any);

      const payload = { planName: "Premium", planType: "PREMIUM" as any, monthlyPrice: 10 };
      const result = await createSubscriptionPlan(payload);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockPlan);
    });
  });

  describe("updateSubscriptionPlan", () => {
    it("should update a subscription plan", async () => {
      const mockPlan = { planId: "p1", planName: "Updated" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlan } as any);

      const payload = { planName: "Updated" };
      const result = await updateSubscriptionPlan("p1", payload);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/p1", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockPlan);
    });
  });

  describe("updateSubscriptionPlanStatus", () => {
    it("should update status", async () => {
      const mockPlan = { planId: "p1", active: true };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlan } as any);

      const result = await updateSubscriptionPlanStatus("p1", { active: true });

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/p1/status", {
        method: "PATCH",
        body: JSON.stringify({ active: true }),
      });
      expect(result).toEqual(mockPlan);
    });
  });

  describe("getPlanFeaturesCatalog", () => {
    it("should fetch features catalog", async () => {
      const mockCatalog = [{ featureId: "f1" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockCatalog } as any);

      const result = await getPlanFeaturesCatalog();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/features");
      expect(result).toEqual(mockCatalog);
    });
  });

  describe("updatePlanFeatures", () => {
    it("should update plan features", async () => {
      const mockPlan = { planId: "p1" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlan } as any);

      const payload = { features: [{ featureKey: "f1", enabled: true }] };
      const result = await updatePlanFeatures("p1", payload);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/p1/features", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockPlan);
    });
  });

  describe("getSubscriptionPlanAuditLogs", () => {
    it("should fetch audit logs", async () => {
      const mockLogs = [{ logId: "l1" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockLogs } as any);

      const result = await getSubscriptionPlanAuditLogs();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/subscription-plans/audit-logs");
      expect(result).toEqual(mockLogs);
    });
  });

  describe("listSubscriptionPlans", () => {
    it("should list public plans", async () => {
      const mockPlans = [{ planId: "p1" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPlans } as any);

      const result = await listSubscriptionPlans();

      expect(requestJson).toHaveBeenCalledWith("/api/subscriptions/plans");
      expect(result).toEqual(mockPlans);
    });
  });
});
