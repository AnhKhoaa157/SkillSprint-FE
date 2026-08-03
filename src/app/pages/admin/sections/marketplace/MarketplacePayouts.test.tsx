import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminMarketplacePayouts } from "../../../../../api/admin";
import type { CreatorPayout } from "../../../../../api/marketplace";
import MarketplacePayouts from "./MarketplacePayouts";

vi.mock("../../../../../api/admin", () => ({
  approveMarketplacePayout: vi.fn(),
  completeMarketplacePayout: vi.fn(),
  getAdminMarketplacePayouts: vi.fn(),
  getMarketplacePayoutTimeline: vi.fn(),
  rejectMarketplacePayout: vi.fn(),
  startMarketplacePayoutProcessing: vi.fn(),
}));

const payout: CreatorPayout = {
  payoutId: "payout-1",
  creatorUserId: "creator-1",
  creatorName: "Nguyễn An",
  creatorEmail: "an@example.com",
  requestedAmount: 100000,
  paidVndAmount: null,
  status: "PROCESSING",
  bankName: "MB Bank",
  bankCode: "MBB",
  accountHolder: "NGUYEN AN",
  accountNumberMasked: null,
  qrViewUrl: "https://example.test/payout-qr.png",
  adminActorUserId: null,
  externalTransferReference: null,
  rejectionReason: null,
  notes: null,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

describe("MarketplacePayouts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the creator QR in an in-page dialog", async () => {
    vi.mocked(getAdminMarketplacePayouts).mockResolvedValueOnce([payout]);

    render(<MarketplacePayouts />);

    fireEvent.click(await screen.findByRole("button", { name: "Xem QR" }));

    expect(screen.getByRole("dialog", { name: "QR của Nguyễn An" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mã QR nhận tiền của Nguyễn An" })).toHaveAttribute("src", payout.qrViewUrl);

    fireEvent.click(screen.getByRole("button", { name: "Đóng QR" }));

    expect(screen.queryByRole("dialog", { name: "QR của Nguyễn An" })).not.toBeInTheDocument();
  });
});
