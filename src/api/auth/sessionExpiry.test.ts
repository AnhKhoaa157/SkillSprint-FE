import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import * as authService from "./authService";
import {
  isAuthFailure,
  extractAuthCode,
  triggerSessionExpiry,
  resetSessionExpiry,
  SESSION_EXPIRED_EVENT,
} from "./sessionExpiry";

// Mock các module phụ thuộc
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("./authService", () => ({
  clearAuthTokens: vi.fn(),
}));

describe("sessionExpiry.ts", () => {
  beforeEach(() => {
    // Reset state nội bộ của file trước mỗi test
    resetSessionExpiry();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isAuthFailure()", () => {
    it("trả về true nếu status là 401", () => {
      expect(isAuthFailure(401)).toBe(true);
      expect(isAuthFailure(401, "SOME_RANDOM_CODE")).toBe(true);
    });

    it("trả về true nếu truyền vào mã lỗi auth hợp lệ", () => {
      expect(isAuthFailure(500, "SESSION_EXPIRED")).toBe(true);
      expect(isAuthFailure(undefined, "USER_PROFILE_NOT_FOUND")).toBe(true);
      expect(isAuthFailure(200, "USER_CONTEXT_INVALID")).toBe(true);
    });

    it("trả về false cho status và code không liên quan", () => {
      expect(isAuthFailure(403, "FORBIDDEN")).toBe(false);
      expect(isAuthFailure(500, null)).toBe(false);
      expect(isAuthFailure(undefined, undefined)).toBe(false);
    });
  });

  describe("extractAuthCode()", () => {
    it("lấy mã lỗi từ payload.errorCode", () => {
      expect(extractAuthCode({ errorCode: "ERR_1" })).toBe("ERR_1");
    });

    it("lấy mã lỗi từ payload.error", () => {
      expect(extractAuthCode({ error: "ERR_2" })).toBe("ERR_2");
    });

    it("lấy mã lỗi từ payload.code", () => {
      expect(extractAuthCode({ code: "ERR_3" })).toBe("ERR_3");
    });

    it("trả về undefined nếu payload không có dạng object hoặc không có mã", () => {
      expect(extractAuthCode(null)).toBeUndefined();
      expect(extractAuthCode("just a string")).toBeUndefined();
      expect(extractAuthCode({ data: "no code here" })).toBeUndefined();
    });
  });

  describe("triggerSessionExpiry()", () => {
    it("thực hiện clearAuthTokens, gọi toast và dispatch sự kiện window", () => {
      // Dựng spy (gián điệp) để theo dõi window.dispatchEvent
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      triggerSessionExpiry({ code: "SESSION_EXPIRED" });

      // 1. Kiểm tra clear token
      expect(authService.clearAuthTokens).toHaveBeenCalledTimes(1);

      // 2. Kiểm tra toast.error được gọi đúng nội dung
      expect(toast.error).toHaveBeenCalledWith(
        "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.",
        expect.objectContaining({ id: "session-expired" })
      );

      // 3. Kiểm tra dispatch sự kiện ra window
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe(SESSION_EXPIRED_EVENT);
      expect(event.detail).toEqual({ code: "SESSION_EXPIRED" });
    });

    it("đảm bảo idempotent (chỉ chạy 1 lần dù bị gọi nhiều lần liên tiếp)", () => {
      // Giả sử có 10 cái API cùng lúc ném lỗi 401
      triggerSessionExpiry({ code: "SESSION_EXPIRED" });
      triggerSessionExpiry({ code: "SESSION_EXPIRED" });
      triggerSessionExpiry({ code: "SESSION_EXPIRED" });

      // Hàm clear token và toast vẫn chỉ được chạy đúng 1 lần
      expect(authService.clearAuthTokens).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
    
    it("fallback hard-redirect nếu không ai gọi markRedirectHandled (chạy giả lập thời gian)", () => {
      // Dùng timer ảo của Vitest
      vi.useFakeTimers();
      
      const replaceSpy = vi.fn();
      // Mock window.location.replace
      Object.defineProperty(window, "location", {
        value: { pathname: "/app", replace: replaceSpy },
        writable: true,
      });

      triggerSessionExpiry({ code: "SESSION_EXPIRED" });
      
      // Lúc mới gọi, setTimeout 400ms chưa chạy nên replace chưa được gọi
      expect(replaceSpy).not.toHaveBeenCalled();

      // Tua nhanh thời gian qua 400ms
      vi.advanceTimersByTime(400);

      // Kiểm tra xem trình duyệt có bị ép redirect về /login không
      expect(replaceSpy).toHaveBeenCalledWith("/login");
      
      vi.useRealTimers();
    });
  });
});
