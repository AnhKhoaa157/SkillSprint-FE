import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketplaceOpsAdmin from "./MarketplaceOpsAdmin";
import type { AdminMarketplaceDispute, MarketplaceVersionMetrics } from "../../../api/admin/marketplaceOpsAdminTypes";
import * as service from "../../../api/admin/marketplaceOpsAdminService";

vi.mock("../../../api/admin/marketplaceOpsAdminService");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const approvedDispute: AdminMarketplaceDispute = {
  disputeId: "d-1",
  saleId: "sale-1",
  packVersionId: "v-1",
  packId: "p-1",
  versionNo: 2,
  versionTitle: "Java",
  saleCoinAmount: 100,
  reason: "POOR_QUALITY",
  description: "Kém",
  status: "APPROVED",
  decisionNote: "ok",
  decidedAt: "2026-07-19T00:00:00Z",
  refundedAt: null,
  refundCoinAmount: null,
  refundWalletTransactionId: null,
  createdAt: "2026-07-18T00:00:00Z",
  updatedAt: "2026-07-19T00:00:00Z",
  allowedActions: ["COMPLETE_REFUND"],
  buyerId: "buyer-1",
  buyerName: "Buyer",
  adminActorName: "Admin",
};

const metrics: MarketplaceVersionMetrics = {
  versionId: "v-1", packId: "p-1", versionNo: 2, versionTitle: "Java",
  learnerCount: 10, completedLearnerCount: 4, completionRate: 0.4,
  averageRating: 4.5, reviewCount: 8,
  reportCount: 5, openReportCount: 2, openReportRate: 0.4,
  rankedAttemptCount: 20, suspiciousRankedAttemptCount: 1, suspiciousRankedAttemptRate: 0.05,
  disputeCount: 3, refundedDisputeCount: 2, refundRate: 0.2, refundedCoinAmount: 200, recognizedPlatformRevenue: 160,
};

describe("MarketplaceOpsAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(service.getAdminDisputes).mockResolvedValue({
      items: [approvedDispute], page: 0, size: 50, totalItems: 1, totalPages: 1, first: true, last: true,
    });
    vi.mocked(service.getAdminDispute).mockResolvedValue(approvedDispute);
  });

  it("completes a refund for an approved dispute and refreshes state", async () => {
    vi.mocked(service.completeAdminDisputeRefund).mockResolvedValue({
      ...approvedDispute, status: "REFUNDED", refundCoinAmount: 100, refundedAt: "2026-07-20T00:00:00Z", allowedActions: [],
    });
    render(<MarketplaceOpsAdmin />);

    await userEvent.click(await screen.findByText(/Chất lượng kém · 100 Coin/));
    const drawer = await screen.findByRole("dialog");
    await userEvent.click(within(drawer).getByRole("button", { name: "Thực hiện hoàn tiền" }));

    await waitFor(() => expect(service.completeAdminDisputeRefund).toHaveBeenCalledWith("d-1"));
  });

  it("renders version metric cards after lookup", async () => {
    vi.mocked(service.getAdminVersionMetrics).mockResolvedValue(metrics);
    render(<MarketplaceOpsAdmin />);

    await userEvent.click(screen.getByRole("button", { name: "Chỉ số chất lượng" }));
    await userEvent.type(screen.getByLabelText("Version ID"), "v-1");
    await userEvent.click(screen.getByRole("button", { name: "Xem chỉ số" }));

    expect(await screen.findByText("Tỷ lệ hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("4/10 người học")).toBeInTheDocument();
    expect(screen.getByText("4.50")).toBeInTheDocument();
    expect(screen.getByText("8 lượt đánh giá")).toBeInTheDocument();
  });

  it("shows an error state when disputes fail to load", async () => {
    vi.mocked(service.getAdminDisputes).mockRejectedValue(new Error("boom"));
    render(<MarketplaceOpsAdmin />);

    expect(await screen.findByText("Không thể tải dữ liệu")).toBeInTheDocument();
  });
});
