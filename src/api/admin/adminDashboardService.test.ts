import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminDashboardAnalytics,
  getAdminPayments,
  reconcilePayment,
} from "./adminDashboardService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("adminDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminDashboardAnalytics", () => {
    it("should fetch dashboard analytics", async () => {
      const mockData = { overview: { totalUsers: 100 } };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockData } as any);

      const result = await getAdminDashboardAnalytics();

      expect(requestJson).toHaveBeenCalledWith("/api/admin/dashboard");
      expect(result).toEqual(mockData);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(getAdminDashboardAnalytics()).rejects.toThrow("Không tải được dữ liệu dashboard");
    });
  });

  describe("getAdminPayments", () => {
    it("should fetch admin payments", async () => {
      const mockPage = { items: [{ paymentId: "p1" }], totalItems: 1 };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockPage } as any);

      const result = await getAdminPayments(1, 20);

      expect(requestJson).toHaveBeenCalledWith("/api/admin/payments?page=1&size=20");
      expect(result).toEqual(mockPage);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(getAdminPayments(0, 10)).rejects.toThrow("Không tải được danh sách thanh toán");
    });
  });

  describe("reconcilePayment", () => {
    it("should reconcile payment successfully", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ code: 200 } as any);

      await reconcilePayment("p1", { providerTransactionId: "SEPAY-123", providerReferenceCode: "BANK-456", note: "Checked" });

      expect(requestJson).toHaveBeenCalledWith("/api/admin/payments/p1/reconcile", {
        method: "POST",
        body: JSON.stringify({ providerTransactionId: "SEPAY-123", providerReferenceCode: "BANK-456", note: "Checked" }),
      });
    });

    it("should throw error if reconcile fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ code: 400, message: "Reconcile failed" } as any);

      await expect(reconcilePayment("p1", { providerTransactionId: "SEPAY-123" })).rejects.toThrow("Reconcile failed");
    });
  });
});
