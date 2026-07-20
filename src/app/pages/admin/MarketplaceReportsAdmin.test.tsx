import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketplaceReportsAdmin from "./MarketplaceReportsAdmin";
import type { AdminMarketplaceReport } from "../../../api/admin/marketplaceReportAdminTypes";
import * as service from "../../../api/admin/marketplaceReportAdminService";

vi.mock("../../../api/admin/marketplaceReportAdminService");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const openReport: AdminMarketplaceReport = {
  reportId: "report-1",
  packVersionId: "version-1",
  packId: "pack-1",
  versionNo: 2,
  versionTitle: "Java Basics",
  targetType: "QUESTION",
  targetRef: "q-1",
  category: "INCORRECT_ANSWER",
  description: "Đáp án sai",
  status: "OPEN",
  resolutionNote: null,
  evidenceUrl: null,
  hasEvidence: false,
  reviewedAt: null,
  createdAt: "2026-07-19T00:00:00Z",
  updatedAt: "2026-07-19T00:00:00Z",
  reporterId: "buyer-1",
  reporterName: "Buyer One",
  reviewedByName: null,
};

describe("MarketplaceReportsAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(service.getAdminMarketplaceReports).mockResolvedValue({
      items: [openReport], page: 0, size: 50, totalItems: 1, totalPages: 1, first: true, last: true,
    });
    vi.mocked(service.getAdminMarketplaceReport).mockResolvedValue(openReport);
  });

  it("lists reports and resolves one with a note", async () => {
    vi.mocked(service.updateAdminMarketplaceReportStatus).mockResolvedValue({
      ...openReport, status: "RESOLVED", resolutionNote: "Đã sửa", reviewedByName: "Admin",
    });
    render(<MarketplaceReportsAdmin />);

    await userEvent.click(await screen.findByText(/Đáp án sai · Câu hỏi/));
    const drawer = await screen.findByRole("dialog");
    await userEvent.type(within(drawer).getByPlaceholderText(/Ghi lại quyết định/), "Đã sửa");
    await userEvent.click(within(drawer).getByRole("button", { name: "Đã xử lý" }));

    await waitFor(() =>
      expect(service.updateAdminMarketplaceReportStatus).toHaveBeenCalledWith("report-1", {
        status: "RESOLVED",
        resolutionNote: "Đã sửa",
      }),
    );
  });

  it("shows an error state when the list fails to load", async () => {
    vi.mocked(service.getAdminMarketplaceReports).mockRejectedValue(new Error("boom"));
    render(<MarketplaceReportsAdmin />);

    expect(await screen.findByText("Không thể tải danh sách báo cáo")).toBeInTheDocument();
  });

  it("offers no transitions for a terminal report", async () => {
    vi.mocked(service.getAdminMarketplaceReport).mockResolvedValue({ ...openReport, status: "RESOLVED" });
    render(<MarketplaceReportsAdmin />);

    await userEvent.click(await screen.findByText(/Đáp án sai · Câu hỏi/));

    expect(await screen.findByText(/không còn hành động khả dụng/)).toBeInTheDocument();
  });
});
