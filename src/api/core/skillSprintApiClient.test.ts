import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { skillSprintApiClient, extractApiData, getApiMessage } from "./skillSprintApiClient";
import * as apiClient from "./apiClient";
import * as sessionExpiry from "../auth/sessionExpiry";

// Mock các hàm phụ thuộc
vi.mock("./apiClient", () => ({
  getAuthToken: vi.fn(),
  getSessionId: vi.fn(),
}));

vi.mock("../auth/sessionExpiry", () => ({
  triggerSessionExpiry: vi.fn(),
  extractAuthCode: vi.fn(),
}));

describe("skillSprintApiClient.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Request Interceptor", () => {
    it("đính kèm Authorization và X-Session-Id header nếu đã đăng nhập", async () => {
      // Giả lập trạng thái đã đăng nhập
      vi.mocked(apiClient.getAuthToken).mockReturnValue("fake-jwt-token");
      vi.mocked(apiClient.getSessionId).mockReturnValue("fake-session-123");

      // Bắn 1 request giả qua axios instance
      const config = { headers: {} } as any;
      const handler = (skillSprintApiClient.interceptors.request as any).handlers[0].fulfilled;
      const resultConfig = await handler(config);

      expect(resultConfig.headers.Authorization).toBe("Bearer fake-jwt-token");
      expect(resultConfig.headers["X-Session-Id"]).toBe("fake-session-123");
    });

    it("không đính kèm header nếu chưa đăng nhập", async () => {
      // Giả lập trạng thái chưa đăng nhập (không có token)
      vi.mocked(apiClient.getAuthToken).mockReturnValue(null);
      vi.mocked(apiClient.getSessionId).mockReturnValue(null);

      const config = { headers: {} } as any;
      const handler = (skillSprintApiClient.interceptors.request as any).handlers[0].fulfilled;
      const resultConfig = await handler(config);

      expect(resultConfig.headers.Authorization).toBeUndefined();
      expect(resultConfig.headers["X-Session-Id"]).toBeUndefined();
    });
  });

  describe("Response Interceptor", () => {
    it("gọi triggerSessionExpiry khi backend trả về lỗi 401", async () => {
      vi.mocked(sessionExpiry.extractAuthCode).mockReturnValue("SESSION_EXPIRED_CODE");

      const error401 = {
        response: {
          status: 401,
          data: { error: "SESSION_EXPIRED_CODE" }
        }
      };

      const rejectHandler = (skillSprintApiClient.interceptors.response as any).handlers[0].rejected;
      
      // Bắt lỗi ném ra
      await expect(rejectHandler(error401)).rejects.toThrow();

      // Đảm bảo hàm triggerSessionExpiry đã được gọi với đúng code
      expect(sessionExpiry.triggerSessionExpiry).toHaveBeenCalledWith({
        status: 401,
        code: "SESSION_EXPIRED_CODE"
      });
    });

    it("tự động bóc tách message từ backend error (như lỗi 400 Bad Request) để throw ra Error chuẩn", async () => {
      const error400 = {
        response: {
          status: 400,
          data: { message: "Email đã tồn tại trong hệ thống" }
        }
      };

      const rejectHandler = (skillSprintApiClient.interceptors.response as any).handlers[0].rejected;
      
      // Khi interceptor xử lý lỗi này, nó phải ném ra Error với nội dung message từ Backend
      await expect(rejectHandler(error400)).rejects.toThrow("Email đã tồn tại trong hệ thống");
    });
  });

  describe("Helper functions", () => {
    it("extractApiData bóc tách đúng phần data", () => {
      const mockResponse = { data: { success: true, code: 200, message: "OK", data: { id: 1 } } } as any;
      expect(extractApiData(mockResponse)).toEqual({ id: 1 });
    });

    it("extractApiData ném lỗi nếu data rỗng", () => {
      const mockResponse = { data: { success: false, code: 404, message: "Not found", data: null } } as any;
      expect(() => extractApiData(mockResponse)).toThrow("Not found");
    });
  });
});
