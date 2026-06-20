import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMonthStartDate, getMonthEndDate, formatDateISO, formatDateVN } from "./dateService";

describe("dateService.ts", () => {
  beforeEach(() => {
    // Ép thời gian hệ thống ảo về một ngày cố định để test không bao giờ bị sai dù chạy ở ngày nào
    // Chọn ngày 15/02/2026 (Năm không nhuận, tháng 2 có 28 ngày)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15)); // Tháng 1 (index 1) là tháng 2
  });

  afterEach(() => {
    // Trả lại thời gian thực cho hệ thống
    vi.useRealTimers();
  });

  describe("getMonthStartDate() & getMonthEndDate()", () => {
    it("getMonthStartDate trả về ngày mùng 1 của tháng hiện tại", async () => {
      const startDate = await getMonthStartDate();
      // Phải là ngày 01/02/2026
      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(1);
      expect(startDate.getDate()).toBe(1);
    });

    it("getMonthEndDate trả về ngày cuối cùng của tháng 2 năm không nhuận (28)", async () => {
      const endDate = await getMonthEndDate();
      // Phải là ngày 28/02/2026
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(1);
      expect(endDate.getDate()).toBe(28);
    });
    
    it("getMonthEndDate trả về ngày 29 nếu test năm nhuận", async () => {
      // Đổi hệ thống sang năm nhuận 2024
      vi.setSystemTime(new Date(2024, 1, 15));
      const endDate = await getMonthEndDate();
      
      expect(endDate.getDate()).toBe(29);
    });
  });

  describe("formatDateISO()", () => {
    it("format chuẩn YYYY-MM-DD và tự động thêm số 0 ở đằng trước ngày/tháng có 1 chữ số", () => {
      // Ngày 5 tháng 3 năm 2026
      const date1 = new Date(2026, 2, 5); 
      expect(formatDateISO(date1)).toBe("2026-03-05");

      // Ngày 25 tháng 11 năm 2026
      const date2 = new Date(2026, 10, 25);
      expect(formatDateISO(date2)).toBe("2026-11-25");
    });
  });
  
  describe("formatDateVN()", () => {
    it("chứa chuỗi ngày tháng đúng chuẩn vi-VN", () => {
      // Chỉ test cơ bản vì kết quả toLocaleDateString phụ thuộc vào Node.js ICU locale
      const date = new Date(2026, 2, 5);
      const result = formatDateVN(date);
      
      // Chắc chắn phải có số 5 và số 3
      expect(result).toContain("5");
      expect(result).toContain("3");
    });
  });
});
