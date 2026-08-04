import type { Workbook, Worksheet } from "exceljs";
import {
  getAdminExportData,
  type AdminExportData,
} from "../../../../api/admin/adminExportService";

type ExcelCellValue = string | number | boolean | Date | null;

interface ExportColumn {
  header: string;
  width: number;
  numFmt?: string;
}

interface ExportSheet {
  name: string;
  title: string;
  description: string;
  columns: ExportColumn[];
  rows: ExcelCellValue[][];
}

export interface AdminExcelExportResult {
  fileName: string;
  sheetCount: number;
  recordCount: number;
  errorCount: number;
}

const TITLE_FILL = "FFFF6B00";
const HEADER_FILL = "FF334155";
const BORDER_COLOR = "FFE2E8F0";
const ALTERNATE_ROW_FILL = "FFFFF7ED";
const DATE_TIME_FORMAT = "yyyy-mm-dd hh:mm";
const DATE_FORMAT = "yyyy-mm-dd";
const NUMBER_FORMAT = "#,##0";
const VND_FORMAT = '#,##0 "₫"';
const COIN_FORMAT = '#,##0 "Coin"';

function asDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildOverviewRows(data: AdminExportData): ExcelCellValue[][] {
  const dashboard = data.dashboard;
  const rows: ExcelCellValue[][] = dashboard ? [
    ["Kỳ dữ liệu", "Từ ngày", dashboard.range.from, null, ""],
    ["Kỳ dữ liệu", "Đến ngày", dashboard.range.to, null, ""],
    ["Người dùng", "Tổng người dùng", dashboard.users.total, "người", ""],
    ["Người dùng", "Đang hoạt động", dashboard.users.active, "người", ""],
    ["Người dùng", "Bị vô hiệu hóa", dashboard.users.disabled, "người", ""],
    ["Người dùng", "Mới trong kỳ", dashboard.users.newInRange, "người", ""],
    ["Người dùng", "Đã xác minh email", dashboard.users.emailVerified, "người", ""],
    ["Workspace", "Tổng workspace", dashboard.workspaces.total, "workspace", ""],
    ["Workspace", "Đang hoạt động", dashboard.workspaces.active, "workspace", ""],
    ["Workspace", "Đã lưu trữ", dashboard.workspaces.archived, "workspace", ""],
    ["Gói dịch vụ", "Đang hoạt động", dashboard.subscriptions.active, "gói", ""],
    ["Gói dịch vụ", "Free", dashboard.subscriptions.free, "gói", ""],
    ["Gói dịch vụ", "Skill Builder", dashboard.subscriptions.skillBuilder, "gói", ""],
    ["Gói dịch vụ", "Premium", dashboard.subscriptions.premium, "gói", ""],
    ["Thanh toán", "Đã thanh toán", dashboard.payments.paid, "giao dịch", ""],
    ["Thanh toán", "Đang chờ", dashboard.payments.pending, "giao dịch", ""],
    ["Thanh toán", "Thất bại", dashboard.payments.failed, "giao dịch", ""],
    ["Tài chính", "Doanh thu gói dịch vụ", dashboard.overview.totalRevenue, "VND", "Không gồm nạp Coin"],
    ["Tài chính", "Doanh thu hôm nay", dashboard.overview.todayRevenue, "VND", "Không gồm nạp Coin"],
    ["Tài chính", "Tiền nạp Coin", dashboard.payments.coinTopUpTotal ?? 0, "VND", ""],
    ["Cảnh báo", "Thanh toán quá hạn", dashboard.alerts.pendingPaymentsOverdue, "mục", ""],
    ["Cảnh báo", "Xử lý tài liệu lỗi", dashboard.alerts.failedMaterialProcessing, "mục", ""],
  ] : [];

  if (data.treasurySummary) {
    rows.push(
      ["Sổ quỹ", "Tổng VND vào", data.treasurySummary.vndInflow, "VND", ""],
      ["Sổ quỹ", "Tiền mua gói", data.treasurySummary.subscriptionPaymentVnd, "VND", ""],
      ["Sổ quỹ", "Tiền nạp Coin", data.treasurySummary.coinTopUpVnd, "VND", ""],
      ["Sổ quỹ", "Tổng VND ra", data.treasurySummary.vndOutflow, "VND", ""],
      ["Sổ quỹ", "Vị thế VND", data.treasurySummary.vndNetPosition, "VND", "Không phải số dư ngân hàng"],
      ["Sổ quỹ", "Hoa hồng Marketplace ròng", data.treasurySummary.commissionCoinNetPosition, "Coin", "Đã trừ hoàn hoa hồng"],
    );
  }

  return rows;
}

function buildMonthlyFinancialRows(data: AdminExportData): ExcelCellValue[][] {
  const financialByMonth = new Map(data.monthlyFinancials.map((item) => [item.month, item]));
  const treasuryByMonth = new Map(data.treasuryMonthly.map((item) => [item.month, item]));
  const months = Array.from(new Set([...financialByMonth.keys(), ...treasuryByMonth.keys()])).sort();

  return months.map((month) => {
    const financial = financialByMonth.get(month);
    const treasury = treasuryByMonth.get(month);
    return [
      month,
      financial?.subscriptionRevenue ?? treasury?.subscriptionPaymentVnd ?? 0,
      financial?.coinTopUp ?? treasury?.coinTopUpVnd ?? 0,
      financial?.marketplaceCommission ?? treasury?.commissionCoinNetPosition ?? 0,
      treasury?.subscriptionPurchaserCount ?? 0,
      treasury?.vndInflow ?? 0,
      treasury?.vndOutflow ?? 0,
      treasury?.vndNetPosition ?? 0,
      treasury?.commissionCoinEarned ?? 0,
      treasury?.commissionCoinReversed ?? 0,
    ];
  });
}

function buildSheets(data: AdminExportData): ExportSheet[] {
  const sheets: ExportSheet[] = [
    {
      name: "Tổng quan",
      title: "Tổng quan hệ thống SkillSprint",
      description: "Các chỉ số tổng hợp tại thời điểm xuất.",
      columns: [
        { header: "Nhóm", width: 18 },
        { header: "Chỉ số", width: 30 },
        { header: "Giá trị", width: 20, numFmt: NUMBER_FORMAT },
        { header: "Đơn vị", width: 14 },
        { header: "Ghi chú", width: 32 },
      ],
      rows: buildOverviewRows(data),
    },
    {
      name: "Tài chính tháng",
      title: "Tài chính theo tháng",
      description: "Doanh thu, dòng tiền và hoa hồng trong 12 tháng gần nhất.",
      columns: [
        { header: "Tháng", width: 14 },
        { header: "Doanh thu gói", width: 20, numFmt: VND_FORMAT },
        { header: "Nạp Coin", width: 18, numFmt: VND_FORMAT },
        { header: "Hoa hồng Marketplace", width: 23, numFmt: COIN_FORMAT },
        { header: "Người mua gói", width: 18, numFmt: NUMBER_FORMAT },
        { header: "VND vào", width: 18, numFmt: VND_FORMAT },
        { header: "VND ra", width: 18, numFmt: VND_FORMAT },
        { header: "Vị thế VND", width: 18, numFmt: VND_FORMAT },
        { header: "Hoa hồng nhận", width: 19, numFmt: COIN_FORMAT },
        { header: "Hoa hồng hoàn", width: 19, numFmt: COIN_FORMAT },
      ],
      rows: buildMonthlyFinancialRows(data),
    },
    {
      name: "Thanh toán",
      title: "Toàn bộ giao dịch thanh toán",
      description: "Bao gồm thanh toán gói dịch vụ và nạp Coin.",
      columns: [
        { header: "Mã giao dịch", width: 38 },
        { header: "Trạng thái", width: 15 },
        { header: "Mục đích", width: 22 },
        { header: "Gói", width: 22 },
        { header: "Tên gói", width: 24 },
        { header: "Số Coin", width: 14, numFmt: COIN_FORMAT },
        { header: "Gói Coin", width: 20 },
        { header: "Số tiền", width: 18, numFmt: VND_FORMAT },
        { header: "Tiền tệ", width: 12 },
        { header: "Mã thanh toán", width: 22 },
        { header: "Mã giao dịch NCC", width: 28 },
        { header: "Mã tham chiếu NCC", width: 28 },
        { header: "Hết hạn", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Thanh toán lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.payments.map((item) => [
        item.paymentId,
        item.status,
        item.purpose,
        item.plan,
        item.planName ?? null,
        item.coinAmount ?? null,
        item.coinPackageKey ?? null,
        item.amount,
        item.currency,
        item.paymentCode,
        item.providerTransactionId,
        item.providerReferenceCode,
        asDate(item.expiredAt),
        asDate(item.paidAt),
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Sổ quỹ",
      title: "Sổ quỹ hệ thống",
      description: "Các bút toán VND và Coin đã được hệ thống ghi nhận.",
      columns: [
        { header: "Mã bút toán", width: 38 },
        { header: "Tài sản", width: 12 },
        { header: "Chiều", width: 12 },
        { header: "Loại bút toán", width: 34 },
        { header: "Loại tham chiếu", width: 24 },
        { header: "Mã tham chiếu", width: 38 },
        { header: "Số lượng", width: 18, numFmt: NUMBER_FORMAT },
        { header: "Mã người thực hiện", width: 38 },
        { header: "Người thực hiện", width: 24 },
        { header: "Mã đối tác", width: 38 },
        { header: "Đối tác", width: 24 },
        { header: "Tham chiếu ngoài", width: 28 },
        { header: "Ghi chú", width: 38 },
        { header: "Metadata", width: 45 },
        { header: "Phát sinh lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.treasuryEntries.map((item) => [
        item.entryId,
        item.asset,
        item.direction,
        item.entryType,
        item.referenceType,
        item.referenceId,
        item.amount,
        item.actorUserId,
        item.actorName,
        item.counterpartyUserId,
        item.counterpartyName,
        item.externalReference,
        item.note,
        stringify(item.metadata),
        asDate(item.occurredAt),
      ]),
    },
    {
      name: "Người dùng",
      title: "Danh sách người dùng",
      description: "Thông tin tài khoản và gói dịch vụ hiện tại.",
      columns: [
        { header: "Mã người dùng", width: 38 },
        { header: "Họ tên", width: 26 },
        { header: "Email", width: 32 },
        { header: "Vai trò", width: 16 },
        { header: "Trạng thái", width: 14 },
        { header: "Đã xác minh email", width: 19 },
        { header: "Múi giờ", width: 20 },
        { header: "Tên gói", width: 22 },
        { header: "Loại gói", width: 20 },
        { header: "Trạng thái gói", width: 18 },
        { header: "Bắt đầu gói", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Kết thúc gói", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Đăng nhập gần nhất", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.users.map((user) => [
        user.id,
        user.fullName ?? null,
        user.email,
        user.role ?? null,
        user.status ?? null,
        user.emailVerified ?? false,
        user.timeZone ?? null,
        user.currentSubscription?.planName ?? null,
        user.currentSubscription?.planType ?? null,
        user.currentSubscription?.status ?? null,
        asDate(user.currentSubscription?.startDate),
        asDate(user.currentSubscription?.endDate),
        asDate(user.lastLoginAt),
        asDate(user.createdAt),
        asDate(user.updatedAt),
      ]),
    },
    {
      name: "Ví Coin",
      title: "Số dư ví Coin",
      description: "Một dòng cho mỗi người dùng; cột lỗi cho biết ví không tải được.",
      columns: [
        { header: "Mã người dùng", width: 38 },
        { header: "Họ tên", width: 26 },
        { header: "Email", width: 32 },
        { header: "Số dư", width: 18, numFmt: COIN_FORMAT },
        { header: "Số giao dịch gần đây", width: 24, numFmt: NUMBER_FORMAT },
        { header: "Lỗi tải dữ liệu", width: 40 },
      ],
      rows: data.wallets.map((record) => [
        record.user.id,
        record.user.fullName ?? null,
        record.user.email,
        record.wallet?.balance ?? null,
        record.wallet?.recentTransactions.length ?? 0,
        record.error,
      ]),
    },
    {
      name: "Giao dịch Coin",
      title: "Giao dịch Coin gần đây",
      description: "Các giao dịch gần đây mà API ví trả về cho từng người dùng.",
      columns: [
        { header: "Mã giao dịch", width: 38 },
        { header: "Mã người dùng", width: 38 },
        { header: "Họ tên", width: 26 },
        { header: "Email", width: 32 },
        { header: "Chiều", width: 12 },
        { header: "Số Coin", width: 16, numFmt: COIN_FORMAT },
        { header: "Số dư trước", width: 18, numFmt: COIN_FORMAT },
        { header: "Số dư sau", width: 18, numFmt: COIN_FORMAT },
        { header: "Loại tham chiếu", width: 24 },
        { header: "Người điều chỉnh", width: 24 },
        { header: "Lý do điều chỉnh", width: 36 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.wallets.flatMap((record) => (record.wallet?.recentTransactions ?? []).map((transaction) => [
        transaction.transactionId,
        record.user.id,
        record.user.fullName ?? null,
        record.user.email,
        transaction.direction,
        transaction.amount,
        transaction.balanceBefore,
        transaction.balanceAfter,
        transaction.referenceType,
        transaction.adjustedByName,
        transaction.adjustmentReason,
        asDate(transaction.createdAt),
      ])),
    },
    {
      name: "Gói dịch vụ",
      title: "Cấu hình gói dịch vụ",
      description: "Giá, hạn mức, quyền lợi và tính năng của từng gói.",
      columns: [
        { header: "Mã gói", width: 38 },
        { header: "Tên gói", width: 24 },
        { header: "Loại gói", width: 20 },
        { header: "Mô tả", width: 42 },
        { header: "Giá tháng", width: 18, numFmt: VND_FORMAT },
        { header: "Tiền tệ", width: 12 },
        { header: "Hoạt động", width: 14 },
        { header: "Hiển thị công khai", width: 20 },
        { header: "Thứ tự", width: 12, numFmt: NUMBER_FORMAT },
        { header: "Workspace tối đa", width: 20, numFmt: NUMBER_FORMAT },
        { header: "Lượt tải tối đa", width: 20, numFmt: NUMBER_FORMAT },
        { header: "Lượt AI tối đa", width: 18, numFmt: NUMBER_FORMAT },
        { header: "Dung lượng file MB", width: 22, numFmt: NUMBER_FORMAT },
        { header: "Dung lượng workspace MB", width: 28, numFmt: NUMBER_FORMAT },
        { header: "Quyền lợi", width: 48 },
        { header: "Tính năng bật", width: 48 },
      ],
      rows: data.plans.map((plan) => [
        plan.planId,
        plan.planName,
        plan.planType,
        plan.description,
        plan.monthlyPrice,
        plan.currency,
        plan.active,
        plan.publicVisible,
        plan.sortOrder,
        plan.quotas?.maxWorkspaces ?? null,
        plan.quotas?.maxUploads ?? null,
        plan.quotas?.aiGenerateLimit ?? null,
        plan.quotas?.maxFileMb ?? null,
        plan.quotas?.maxWorkspaceMb ?? null,
        plan.benefits.join(" • "),
        plan.features.filter((feature) => feature.enabled).map((feature) => feature.featureName).join(" • "),
      ]),
    },
    {
      name: "Nhật ký gói",
      title: "Nhật ký thay đổi gói dịch vụ",
      description: "Audit log do backend ghi nhận.",
      columns: [
        { header: "Mã log", width: 38 },
        { header: "Mã admin", width: 38 },
        { header: "Email admin", width: 32 },
        { header: "Loại thực thể", width: 20 },
        { header: "Mã thực thể", width: 38 },
        { header: "Hành động", width: 34 },
        { header: "Tiêu đề", width: 32 },
        { header: "Mô tả", width: 42 },
        { header: "Giá trị cũ", width: 45 },
        { header: "Giá trị mới", width: 45 },
        { header: "Metadata", width: 45 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.planAuditLogs.map((log) => [
        log.logId,
        log.adminUserId,
        log.adminEmail,
        log.entityType,
        log.entityId,
        log.actionType,
        log.title,
        log.description,
        log.oldValue,
        log.newValue,
        log.metadata,
        asDate(log.createdAt),
      ]),
    },
    {
      name: "Bảng điểm",
      title: "Bảng điểm toàn thời gian",
      description: "Xếp hạng ALL_TIME của toàn bộ người dùng.",
      columns: [
        { header: "Hạng", width: 10, numFmt: NUMBER_FORMAT },
        { header: "Mã người dùng", width: 38 },
        { header: "Họ tên", width: 26 },
        { header: "Email", width: 32 },
        { header: "Điểm", width: 16, numFmt: NUMBER_FORMAT },
        { header: "Chuỗi ngày", width: 15, numFmt: NUMBER_FORMAT },
        { header: "Ngày ghi điểm cuối", width: 20, numFmt: DATE_FORMAT },
      ],
      rows: data.leaderboard.map((entry) => [
        entry.rank,
        entry.userId,
        entry.fullName,
        entry.email,
        entry.points,
        entry.streakDays,
        asDate(entry.lastPointDate),
      ]),
    },
    {
      name: "Feedback",
      title: "Feedback người dùng",
      description: "Toàn bộ phản hồi và trạng thái xử lý.",
      columns: [
        { header: "Mã feedback", width: 38 },
        { header: "Mã người dùng", width: 38 },
        { header: "Họ tên", width: 26 },
        { header: "Email", width: 32 },
        { header: "Loại", width: 18 },
        { header: "Tiêu đề", width: 34 },
        { header: "Nội dung", width: 60 },
        { header: "URL liên quan", width: 45 },
        { header: "Ảnh đính kèm", width: 45 },
        { header: "Trạng thái", width: 18 },
        { header: "Ghi chú admin", width: 42 },
        { header: "Phản hồi admin", width: 42 },
        { header: "Phản hồi lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.feedback.map((item) => [
        item.feedbackId,
        item.userId,
        item.userFullName,
        item.userEmail,
        item.type,
        item.title,
        item.content,
        item.relatedUrl,
        item.imageUrl,
        item.status,
        item.adminNote,
        item.adminReply ?? null,
        asDate(item.repliedAt),
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Bài viết CĐ",
      title: "Bài viết cộng đồng",
      description: "Bài viết và trạng thái kiểm duyệt.",
      columns: [
        { header: "Mã bài viết", width: 38 },
        { header: "Mã tác giả", width: 38 },
        { header: "Tên tác giả", width: 26 },
        { header: "Email tác giả", width: 32 },
        { header: "Nội dung", width: 60 },
        { header: "Hashtag", width: 36 },
        { header: "Trạng thái", width: 22 },
        { header: "Lượt thích", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Bình luận", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Báo cáo", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Ghi chú admin", width: 38 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.communityPosts.map((item) => [
        item.postId,
        item.author?.userId ?? null,
        item.author?.fullName ?? null,
        item.author?.email ?? null,
        item.content,
        item.hashtags.join(", "),
        item.status,
        item.likeCount,
        item.commentCount,
        item.reportCount,
        item.adminNote ?? null,
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Bình luận CĐ",
      title: "Bình luận cộng đồng",
      description: "Bình luận và trạng thái kiểm duyệt.",
      columns: [
        { header: "Mã bình luận", width: 38 },
        { header: "Mã bài viết", width: 38 },
        { header: "Mã tác giả", width: 38 },
        { header: "Tên tác giả", width: 26 },
        { header: "Email tác giả", width: 32 },
        { header: "Nội dung", width: 60 },
        { header: "Trạng thái", width: 22 },
        { header: "Báo cáo", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Ghi chú admin", width: 38 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.communityComments.map((item) => [
        item.commentId,
        item.postId,
        item.author?.userId ?? null,
        item.author?.fullName ?? null,
        item.author?.email ?? null,
        item.content,
        item.status,
        item.reportCount,
        item.adminNote ?? null,
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Báo cáo CĐ",
      title: "Báo cáo nội dung cộng đồng",
      description: "Báo cáo bài viết, bình luận và tin nhắn.",
      columns: [
        { header: "Mã báo cáo", width: 38 },
        { header: "Loại đối tượng", width: 18 },
        { header: "Mã đối tượng", width: 38 },
        { header: "Mã người báo cáo", width: 38 },
        { header: "Người báo cáo", width: 26 },
        { header: "Email người báo cáo", width: 32 },
        { header: "Lý do", width: 48 },
        { header: "Trạng thái", width: 18 },
        { header: "Ghi chú admin", width: 40 },
        { header: "Duyệt lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.communityReports.map((item) => [
        item.reportId,
        item.targetType,
        item.targetId,
        item.reporter?.userId ?? null,
        item.reporter?.fullName ?? null,
        item.reporter?.email ?? null,
        item.reason,
        item.status,
        item.adminNote ?? null,
        asDate(item.reviewedAt),
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Phòng CĐ",
      title: "Phòng cộng đồng",
      description: "Danh sách và trạng thái các phòng cộng đồng.",
      columns: [
        { header: "Mã phòng", width: 38 },
        { header: "Tên phòng", width: 30 },
        { header: "Mô tả", width: 50 },
        { header: "Chế độ", width: 18 },
        { header: "Trạng thái", width: 18 },
        { header: "Mã chủ phòng", width: 38 },
        { header: "Chủ phòng", width: 26 },
        { header: "Thành viên tối đa", width: 20, numFmt: NUMBER_FORMAT },
        { header: "Thành viên hiện tại", width: 22, numFmt: NUMBER_FORMAT },
        { header: "Báo cáo", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Ghi chú admin", width: 40 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.communityRooms.map((item) => [
        item.roomId,
        item.name,
        item.description,
        item.mode,
        item.status,
        item.owner?.userId ?? null,
        item.owner?.fullName ?? null,
        item.maxMembers,
        item.memberCount,
        item.reportCount,
        item.adminNote ?? null,
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Từ khóa chặn",
      title: "Danh sách từ khóa chặn",
      description: "Từ khóa dùng trong kiểm duyệt cộng đồng.",
      columns: [
        { header: "Mã từ khóa", width: 18, numFmt: NUMBER_FORMAT },
        { header: "Từ khóa", width: 32 },
        { header: "Mã người tạo", width: 38 },
        { header: "Người tạo", width: 26 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.blacklistKeywords.map((item) => [
        item.wordId,
        item.keyword,
        item.createdBy?.userId ?? null,
        item.createdBy?.fullName ?? null,
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Quiz Pack",
      title: "Quiz Pack Marketplace",
      description: "Tất cả trạng thái nội dung trên Marketplace.",
      columns: [
        { header: "Mã item", width: 38 },
        { header: "Mã pack", width: 38 },
        { header: "Mã phiên bản", width: 38 },
        { header: "Phiên bản", width: 12, numFmt: NUMBER_FORMAT },
        { header: "Tiêu đề", width: 36 },
        { header: "Creator", width: 26 },
        { header: "Workspace nguồn", width: 30 },
        { header: "Môn học", width: 22 },
        { header: "Giá", width: 16, numFmt: COIN_FORMAT },
        { header: "Số chương", width: 14, numFmt: NUMBER_FORMAT },
        { header: "Số quiz", width: 12, numFmt: NUMBER_FORMAT },
        { header: "Số câu hỏi", width: 15, numFmt: NUMBER_FORMAT },
        { header: "Điểm creator", width: 16, numFmt: NUMBER_FORMAT },
        { header: "Điểm xác thực", width: 18, numFmt: NUMBER_FORMAT },
        { header: "Trạng thái chất lượng", width: 23 },
        { header: "Điểm chất lượng", width: 19, numFmt: NUMBER_FORMAT },
        { header: "Chất lượng hiện hành", width: 22 },
        { header: "Ghi chú duyệt", width: 42 },
        { header: "Trạng thái", width: 20 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.marketplaceItems.map((item) => [
        item.itemId,
        item.packId ?? null,
        item.versionId ?? null,
        item.versionNo ?? null,
        item.title,
        item.creatorName ?? null,
        item.sourceWorkspaceName ?? null,
        item.subject,
        item.priceCoins,
        item.chapterCount,
        item.quizCount,
        item.questionCount,
        item.creatorValidationScore ?? null,
        item.validationScore ?? null,
        item.qualityStatus ?? null,
        item.qualityScore ?? null,
        item.qualityCurrent ?? null,
        item.reviewNote ?? null,
        item.status,
        asDate(item.createdAt),
      ]),
    },
    {
      name: "Báo cáo MP",
      title: "Báo cáo Marketplace",
      description: "Báo cáo nội dung Quiz Pack và kết quả xử lý.",
      columns: [
        { header: "Mã báo cáo", width: 38 },
        { header: "Mã pack", width: 38 },
        { header: "Mã phiên bản", width: 38 },
        { header: "Phiên bản", width: 12, numFmt: NUMBER_FORMAT },
        { header: "Tiêu đề", width: 34 },
        { header: "Loại đối tượng", width: 20 },
        { header: "Tham chiếu đối tượng", width: 38 },
        { header: "Danh mục", width: 24 },
        { header: "Mô tả", width: 50 },
        { header: "Trạng thái", width: 18 },
        { header: "Kết quả xử lý", width: 44 },
        { header: "Có bằng chứng", width: 18 },
        { header: "URL bằng chứng", width: 45 },
        { header: "Người báo cáo", width: 26 },
        { header: "Người xử lý", width: 26 },
        { header: "Duyệt lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.marketplaceReports.map((item) => [
        item.reportId,
        item.packId,
        item.packVersionId,
        item.versionNo,
        item.versionTitle,
        item.targetType,
        item.targetRef,
        item.category,
        item.description,
        item.status,
        item.resolutionNote,
        item.hasEvidence,
        item.evidenceUrl,
        item.reporterName,
        item.reviewedByName,
        asDate(item.reviewedAt),
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Tranh chấp MP",
      title: "Tranh chấp Marketplace",
      description: "Yêu cầu hoàn Coin và quyết định xử lý.",
      columns: [
        { header: "Mã tranh chấp", width: 38 },
        { header: "Mã giao dịch", width: 38 },
        { header: "Mã pack", width: 38 },
        { header: "Mã phiên bản", width: 38 },
        { header: "Phiên bản", width: 12, numFmt: NUMBER_FORMAT },
        { header: "Tiêu đề", width: 34 },
        { header: "Giá bán", width: 16, numFmt: COIN_FORMAT },
        { header: "Lý do", width: 24 },
        { header: "Mô tả", width: 50 },
        { header: "Trạng thái", width: 20 },
        { header: "Quyết định", width: 44 },
        { header: "Coin hoàn", width: 16, numFmt: COIN_FORMAT },
        { header: "Mã giao dịch hoàn", width: 38 },
        { header: "Mã người mua", width: 38 },
        { header: "Người mua", width: 26 },
        { header: "Admin xử lý", width: 26 },
        { header: "Quyết định lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Hoàn lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.marketplaceDisputes.map((item) => [
        item.disputeId,
        item.saleId,
        item.packId,
        item.packVersionId,
        item.versionNo,
        item.versionTitle,
        item.saleCoinAmount,
        item.reason,
        item.description,
        item.status,
        item.decisionNote,
        item.refundCoinAmount,
        item.refundWalletTransactionId,
        item.buyerId,
        item.buyerName,
        item.adminActorName,
        asDate(item.decidedAt),
        asDate(item.refundedAt),
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Rút tiền Creator",
      title: "Yêu cầu rút tiền Creator",
      description: "Thông tin đối soát và trạng thái chi trả.",
      columns: [
        { header: "Mã yêu cầu", width: 38 },
        { header: "Mã Creator", width: 38 },
        { header: "Creator", width: 26 },
        { header: "Email", width: 32 },
        { header: "Coin yêu cầu", width: 18, numFmt: COIN_FORMAT },
        { header: "VND đã trả", width: 18, numFmt: VND_FORMAT },
        { header: "Trạng thái", width: 18 },
        { header: "Ngân hàng", width: 24 },
        { header: "Mã ngân hàng", width: 18 },
        { header: "Chủ tài khoản", width: 28 },
        { header: "Số tài khoản", width: 22 },
        { header: "URL QR", width: 45 },
        { header: "Mã admin", width: 38 },
        { header: "Mã chuyển khoản", width: 30 },
        { header: "Lý do từ chối", width: 42 },
        { header: "Ghi chú", width: 42 },
        { header: "Tạo lúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: data.payouts.map((item) => [
        item.payoutId,
        item.creatorUserId,
        item.creatorName,
        item.creatorEmail,
        item.requestedAmount,
        item.paidVndAmount,
        item.status,
        item.bankName,
        item.bankCode,
        item.accountHolder,
        item.accountNumberMasked,
        item.qrViewUrl,
        item.adminActorUserId,
        item.externalTransferReference,
        item.rejectionReason,
        item.notes,
        asDate(item.createdAt),
        asDate(item.updatedAt),
      ]),
    },
    {
      name: "Hệ thống",
      title: "Cấu hình hệ thống",
      description: "Trạng thái bảo trì và thông báo chung tại thời điểm xuất.",
      columns: [
        { header: "Hạng mục", width: 24 },
        { header: "Mã cấu hình", width: 38 },
        { header: "Đã bật", width: 14 },
        { header: "Đang hoạt động", width: 20 },
        { header: "Loại", width: 16 },
        { header: "Tiêu đề", width: 36 },
        { header: "Nội dung", width: 60 },
        { header: "Bắt đầu", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Kết thúc", width: 20, numFmt: DATE_TIME_FORMAT },
        { header: "Người cập nhật", width: 28 },
        { header: "Cập nhật lúc", width: 20, numFmt: DATE_TIME_FORMAT },
      ],
      rows: [
        ...(data.maintenance ? [[
          "Bảo trì",
          data.maintenance.maintenanceId,
          data.maintenance.enabled,
          data.maintenance.active,
          null,
          null,
          data.maintenance.message,
          asDate(data.maintenance.startAt),
          asDate(data.maintenance.endAt),
          data.maintenance.updatedBy,
          asDate(data.maintenance.updatedAt),
        ] satisfies ExcelCellValue[]] : []),
        ...(data.announcement ? [[
          "Thông báo",
          data.announcement.announcementId ?? null,
          data.announcement.enabled,
          data.announcement.active,
          data.announcement.type,
          data.announcement.title,
          data.announcement.message,
          asDate(data.announcement.startAt),
          asDate(data.announcement.endAt),
          data.announcement.updatedBy ?? null,
          asDate(data.announcement.updatedAt),
        ] satisfies ExcelCellValue[]] : []),
      ],
    },
  ];

  const informationRows: ExcelCellValue[][] = [
    ["Thông tin", "Xuất lúc", asDate(data.generatedAt), "", "Dữ liệu quản trị nội bộ; cần lưu trữ và chia sẻ an toàn."],
    ["Thông tin", "Số sheet dữ liệu", sheets.length, "sheet", "Không tính sheet Thông tin xuất."],
    ...sheets.map((sheet) => ["Sheet", sheet.name, sheet.rows.length, "bản ghi", sheet.description] satisfies ExcelCellValue[]),
    ...data.errors.map((error) => ["Lỗi tải", error.section, null, "", error.message] satisfies ExcelCellValue[]),
  ];

  return [
    {
      name: "Thông tin xuất",
      title: "Thông tin file xuất dữ liệu admin",
      description: "Mục lục, số bản ghi và lỗi tải dữ liệu (nếu có).",
      columns: [
        { header: "Loại", width: 18 },
        { header: "Hạng mục", width: 32 },
        { header: "Giá trị", width: 20, numFmt: NUMBER_FORMAT },
        { header: "Đơn vị", width: 14 },
        { header: "Ghi chú", width: 60 },
      ],
      rows: informationRows,
    },
    ...sheets,
  ];
}

function styleSheet(worksheet: Worksheet, sheet: ExportSheet): void {
  const columnCount = Math.max(sheet.columns.length, 1);
  worksheet.mergeCells(1, 1, 1, columnCount);
  worksheet.mergeCells(2, 1, 2, columnCount);

  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = sheet.title;
  titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(1).height = 30;

  const descriptionCell = worksheet.getCell(2, 1);
  descriptionCell.value = `${sheet.description} • ${sheet.rows.length.toLocaleString("vi-VN")} bản ghi`;
  descriptionCell.font = { italic: true, color: { argb: "FF64748B" }, size: 10 };
  descriptionCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(2).height = 24;

  const headerRow = worksheet.getRow(4);
  headerRow.values = sheet.columns.map((column) => column.header);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: BORDER_COLOR } },
      left: { style: "thin", color: { argb: BORDER_COLOR } },
      bottom: { style: "thin", color: { argb: BORDER_COLOR } },
      right: { style: "thin", color: { argb: BORDER_COLOR } },
    };
  });

  sheet.columns.forEach((column, index) => {
    const worksheetColumn = worksheet.getColumn(index + 1);
    worksheetColumn.width = Math.min(Math.max(column.width, 10), 60);
    if (column.numFmt) worksheetColumn.numFmt = column.numFmt;
  });

  if (sheet.rows.length === 0) {
    worksheet.mergeCells(5, 1, 5, columnCount);
    const emptyCell = worksheet.getCell(5, 1);
    emptyCell.value = "Không có dữ liệu.";
    emptyCell.font = { italic: true, color: { argb: "FF94A3B8" } };
    emptyCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(5).height = 28;
  } else {
    sheet.rows.forEach((rowValues, rowIndex) => {
      const row = worksheet.addRow(rowValues);
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        cell.border = {
          bottom: { style: "hair", color: { argb: BORDER_COLOR } },
        };
        if (rowIndex % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALTERNATE_ROW_FILL } };
        }
      });
    });
  }

  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: columnCount },
  };
  worksheet.views = [{ state: "frozen", ySplit: 4 }];
  worksheet.pageSetup = {
    orientation: columnCount > 8 ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  worksheet.properties.defaultRowHeight = 20;
}

export async function createAdminWorkbook(data: AdminExportData): Promise<Workbook> {
  const { Workbook: ExcelWorkbook } = await import("exceljs");
  const workbook = new ExcelWorkbook();
  workbook.creator = "SkillSprint Admin";
  workbook.company = "SkillSprint";
  workbook.subject = "Xuất toàn bộ dữ liệu quản trị";
  workbook.title = "SkillSprint Admin Export";
  workbook.created = asDate(data.generatedAt) ?? new Date();
  workbook.modified = new Date();

  buildSheets(data).forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name, {
      properties: { tabColor: { argb: TITLE_FILL } },
    });
    styleSheet(worksheet, sheet);
  });

  return workbook;
}

function buildFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `SkillSprint_Admin_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.xlsx`;
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportAllAdminDataToExcel(): Promise<AdminExcelExportResult> {
  const data = await getAdminExportData();
  const workbook = await createAdminWorkbook(data);
  const output = await workbook.xlsx.writeBuffer();
  const fileName = buildFileName(new Date(data.generatedAt));
  downloadBuffer(output, fileName);

  const sheets = buildSheets(data);
  return {
    fileName,
    sheetCount: sheets.length,
    recordCount: sheets.slice(1).reduce((total, sheet) => total + sheet.rows.length, 0),
    errorCount: data.errors.length,
  };
}
