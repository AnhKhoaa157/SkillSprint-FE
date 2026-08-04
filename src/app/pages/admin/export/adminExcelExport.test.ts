import { describe, expect, it } from "vitest";
import type { AdminExportData } from "../../../../api/admin/adminExportService";
import { createAdminWorkbook } from "./adminExcelExport";

function emptyExportData(): AdminExportData {
  return {
    generatedAt: "2026-08-04T08:30:00.000Z",
    dashboard: null,
    monthlyFinancials: [],
    payments: [],
    treasurySummary: null,
    treasuryMonthly: [],
    treasuryEntries: [],
    users: [],
    wallets: [],
    plans: [],
    planAuditLogs: [],
    leaderboard: [],
    feedback: [],
    communityPosts: [],
    communityComments: [],
    communityReports: [],
    communityRooms: [],
    blacklistKeywords: [],
    marketplaceItems: [],
    marketplaceReports: [],
    marketplaceDisputes: [],
    payouts: [],
    maintenance: null,
    announcement: null,
    errors: [],
  };
}

describe("createAdminWorkbook", () => {
  it("creates one workbook with all admin data sheets", async () => {
    const workbook = await createAdminWorkbook(emptyExportData());

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Thông tin xuất",
      "Tổng quan",
      "Tài chính tháng",
      "Thanh toán",
      "Sổ quỹ",
      "Người dùng",
      "Ví Coin",
      "Giao dịch Coin",
      "Gói dịch vụ",
      "Nhật ký gói",
      "Bảng điểm",
      "Feedback",
      "Bài viết CĐ",
      "Bình luận CĐ",
      "Báo cáo CĐ",
      "Phòng CĐ",
      "Từ khóa chặn",
      "Quiz Pack",
      "Báo cáo MP",
      "Tranh chấp MP",
      "Rút tiền Creator",
      "Hệ thống",
    ]);
    expect(workbook.getWorksheet("Người dùng")?.views).toEqual([
      expect.objectContaining({ state: "frozen", ySplit: 4 }),
    ]);
    expect(workbook.getWorksheet("Thanh toán")?.autoFilter).toEqual({
      from: { row: 4, column: 1 },
      to: { row: 4, column: 16 },
    });
    const output = await workbook.xlsx.writeBuffer();
    expect(output.byteLength).toBeGreaterThan(0);
  }, 15_000);

  it("keeps numeric and date values typed in user and wallet sheets", async () => {
    const data = emptyExportData();
    data.users = [{
      id: "user-1",
      email: "learner@example.com",
      fullName: "Nguyễn Văn A",
      role: "LEARNER",
      status: "ACTIVE",
      emailVerified: true,
      timeZone: "Asia/Saigon",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-02T10:00:00.000Z",
      lastLoginAt: "2026-08-03T10:00:00.000Z",
      currentSubscription: null,
    }];
    data.wallets = [{
      user: data.users[0],
      error: null,
      wallet: {
        userId: "user-1",
        balance: 1250,
        recentTransactions: [],
      },
    }];

    const workbook = await createAdminWorkbook(data);
    const users = workbook.getWorksheet("Người dùng");
    const wallets = workbook.getWorksheet("Ví Coin");

    expect(users?.getCell("A5").value).toBe("user-1");
    expect(users?.getCell("F5").value).toBe(true);
    expect(users?.getCell("M5").value).toBeInstanceOf(Date);
    expect(wallets?.getCell("D5").value).toBe(1250);
    expect(wallets?.getCell("D5").numFmt).toBe('#,##0 "Coin"');
  });
});
