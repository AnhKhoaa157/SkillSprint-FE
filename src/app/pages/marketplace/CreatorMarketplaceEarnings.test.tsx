import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { marketplaceService } from "../../../api/marketplace";
import CreatorMarketplaceEarnings from "./CreatorMarketplaceEarnings";

vi.mock("../../../api/marketplace", () => ({
  marketplaceService: {
    getCreatorEarnings: vi.fn(),
    getCreatorPayoutDestination: vi.fn(),
    getCreatorPayouts: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("CreatorMarketplaceEarnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketplaceService.getCreatorEarnings).mockResolvedValue({
      availableAmount: 10000,
      pendingAmount: 5000,
      reservedAmount: 2500,
      paidAmount: 7500,
      earnings: [],
    });
    vi.mocked(marketplaceService.getCreatorPayoutDestination).mockResolvedValue({
      destinationId: "destination-1",
      bankName: "MB Bank",
      bankCode: "MBB",
      accountHolder: "Creator",
      accountNumberMasked: "**** 1234",
      qrViewUrl: null,
      updatedAt: null,
    });
    vi.mocked(marketplaceService.getCreatorPayouts).mockResolvedValue([{
      payoutId: "payout-1",
      creatorUserId: "creator-1",
      creatorName: "Creator",
      creatorEmail: "creator@example.com",
      requestedAmount: 10000,
      paidVndAmount: null,
      status: "REQUESTED",
      bankName: "MB Bank",
      bankCode: "MBB",
      accountHolder: "Creator",
      accountNumberMasked: "**** 1234",
      qrViewUrl: null,
      adminActorUserId: null,
      externalTransferReference: null,
      rejectionReason: null,
      notes: null,
      createdAt: "2026-07-22T00:00:00Z",
      updatedAt: "2026-07-22T00:00:00Z",
    }]);
  });

  it("presents Creator payout balances and requests in VND, not spendable Coin", async () => {
    render(<CreatorMarketplaceEarnings />);

    expect(await screen.findByText("Bước 2 · Rút VND")).toBeInTheDocument();
    expect(screen.getByLabelText("Số tiền muốn rút (VND)")).toBeInTheDocument();
    expect(screen.getAllByText("10.000 ₫")).not.toHaveLength(0);
    expect(screen.queryByText("Bước 2 · Rút Coin")).not.toBeInTheDocument();
    expect(screen.queryByText("Số Coin muốn rút")).not.toBeInTheDocument();
  });
});
