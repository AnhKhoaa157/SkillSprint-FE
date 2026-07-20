import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceDisputePanel } from "./MarketplaceDisputePanel";
import marketplaceService from "../../../api/marketplace/marketplaceService";
import type { MarketplaceDispute, MarketplaceDisputeEligibility } from "../../../api/marketplace/marketplaceTypes";

vi.mock("../../../api/marketplace/marketplaceService", () => ({
  default: {
    getVersionDisputeEligibility: vi.fn(),
    createDispute: vi.fn(),
  },
}));

const eligible: MarketplaceDisputeEligibility = {
  saleId: "sale-1",
  eligible: true,
  ineligibilityReason: null,
  existingDispute: null,
};

const openDispute: MarketplaceDispute = {
  disputeId: "d-1",
  saleId: "sale-1",
  packVersionId: "v-1",
  packId: "p-1",
  versionNo: 1,
  versionTitle: "Pack",
  saleCoinAmount: 100,
  reason: "POOR_QUALITY",
  description: "Kém",
  status: "OPEN",
  decisionNote: null,
  decidedAt: null,
  refundedAt: null,
  refundCoinAmount: null,
  refundWalletTransactionId: null,
  createdAt: "2026-07-19T00:00:00Z",
  updatedAt: "2026-07-19T00:00:00Z",
  allowedActions: [],
};

describe("MarketplaceDisputePanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets an eligible buyer submit a dispute and refreshes to the timeline", async () => {
    vi.mocked(marketplaceService.getVersionDisputeEligibility)
      .mockResolvedValueOnce(eligible)
      .mockResolvedValueOnce({ ...eligible, eligible: false, ineligibilityReason: "DISPUTE_ACTIVE", existingDispute: openDispute });
    vi.mocked(marketplaceService.createDispute).mockResolvedValue(openDispute);

    render(<MarketplaceDisputePanel open versionId="v-1" onOpenChange={vi.fn()} />);

    await userEvent.click(await screen.findByRole("radio", { name: "Chất lượng kém" }));
    await userEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    await waitFor(() =>
      expect(marketplaceService.createDispute).toHaveBeenCalledWith(
        expect.objectContaining({ saleId: "sale-1", reason: "POOR_QUALITY" }),
      ),
    );
    // Authoritative refetch shows the current dispute timeline, not an optimistic guess.
    expect(await screen.findByText("Đã tiếp nhận")).toBeInTheDocument();
  });

  it("explains ineligibility without a form", async () => {
    vi.mocked(marketplaceService.getVersionDisputeEligibility).mockResolvedValue({
      saleId: null,
      eligible: false,
      ineligibilityReason: "ALREADY_REFUNDED",
      existingDispute: null,
    });

    render(<MarketplaceDisputePanel open versionId="v-1" onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Giao dịch này đã được hoàn tiền.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });
});
