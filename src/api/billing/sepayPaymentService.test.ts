import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSepayPayment, getPaymentDetail, getMyPaymentHistory } from "./sepayPaymentService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

// Mock thư viện gọi API nội bộ để không bắn request thật ra ngoài internet
vi.mock("../core/skillSprintApiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core/skillSprintApiClient")>();
  return {
    ...actual,
    skillSprintApiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
    // Giữ nguyên hàm extractApiData vì hàm này chỉ xử lý object (JSON) thuần túy
    extractApiData: actual.extractApiData,
  };
});

describe("sepayPaymentService.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createSepayPayment()", () => {
    it("gọi đúng API POST và trả về data", async () => {
      // Chuẩn bị payload giả
      const mockPayload = { planId: "plan-123" };
      // Dữ liệu giả định API sẽ trả về
      const mockResponse = {
        data: {
          success: true,
          code: 200,
          message: "Success",
          data: { paymentId: "pay-1", checkoutUrl: "https://sepay.vn/..." }
        }
      };

      // Mock hàm post trả về mockResponse
      vi.mocked(skillSprintApiClient.post).mockResolvedValue(mockResponse);

      const result = await createSepayPayment(mockPayload);

      // Kiểm tra API post đã được gọi với URL đúng và truyền theo payload chưa?
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/payments/sepay/create", mockPayload);
      
      // Kiểm tra xem dữ liệu được hàm extractApiData moi ra có đúng là lõi bên trong (data.data) không?
      expect(result).toEqual({ paymentId: "pay-1", checkoutUrl: "https://sepay.vn/..." });
    });
  });

  describe("getPaymentDetail()", () => {
    it("gọi API GET với ID trên path", async () => {
      const mockResponse = {
        data: {
          success: true,
          code: 200,
          message: "OK",
          data: { status: "PAID", amount: 500000 }
        }
      };
      vi.mocked(skillSprintApiClient.get).mockResolvedValue(mockResponse);

      const result = await getPaymentDetail("pay-abc");

      // Test xem nó có truyền đúng paymentId vào đường dẫn không
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/payments/pay-abc");
      expect(result).toEqual({ status: "PAID", amount: 500000 });
    });
  });

  describe("getMyPaymentHistory()", () => {
    it("gọi API GET với thông số phân trang mặc định", async () => {
      const mockResponse = {
        data: {
          success: true,
          code: 200,
          message: "OK",
          data: { content: [], totalElements: 0 }
        }
      };
      vi.mocked(skillSprintApiClient.get).mockResolvedValue(mockResponse);

      await getMyPaymentHistory();

      // Mặc định gọi với page=0, size=20
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/payments/me", {
        params: { page: 0, size: 20 }
      });
    });

    it("gọi API GET với thông số phân trang tuỳ chỉnh", async () => {
      const mockResponse = {
        data: {
          success: true,
          code: 200,
          message: "OK",
          data: { content: [], totalElements: 0 }
        }
      };
      vi.mocked(skillSprintApiClient.get).mockResolvedValue(mockResponse);

      await getMyPaymentHistory(2, 50);

      // Custom thì gọi theo custom
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/payments/me", {
        params: { page: 2, size: 50 }
      });
    });
  });
});
