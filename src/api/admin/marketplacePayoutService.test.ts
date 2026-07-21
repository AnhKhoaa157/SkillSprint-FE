import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import { approveMarketplacePayout, completeMarketplacePayout, getAdminMarketplacePayouts, rejectMarketplacePayout, startMarketplacePayoutProcessing } from "./marketplacePayoutService";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("marketplacePayoutService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists payout requests with an optional status filter", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: [] });
    await expect(getAdminMarketplacePayouts("REQUESTED")).resolves.toEqual([]);
    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/payouts?status=REQUESTED");
  });

  it("uses lifecycle endpoints and sends the paid VND amount", async () => {
    const payout = { payoutId: "payout-1" };
    vi.mocked(requestJson)
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout });

    await approveMarketplacePayout("payout-1");
    await startMarketplacePayoutProcessing("payout-1");
    await completeMarketplacePayout("payout-1", "FT-1", 80000, "reconciled");
    await rejectMarketplacePayout("payout-1", "invalid QR", true);

    expect(requestJson).toHaveBeenNthCalledWith(1, "/api/admin/marketplace/payouts/payout-1/approve", { method: "PATCH" });
    expect(requestJson).toHaveBeenNthCalledWith(2, "/api/admin/marketplace/payouts/payout-1/processing", { method: "PATCH" });
    expect(requestJson).toHaveBeenNthCalledWith(3, "/api/admin/marketplace/payouts/payout-1/complete", { method: "PATCH", body: JSON.stringify({ externalTransferReference: "FT-1", paidVndAmount: 80000, notes: "reconciled" }) });
    expect(requestJson).toHaveBeenNthCalledWith(4, "/api/admin/marketplace/payouts/payout-1/fail", { method: "PATCH", body: JSON.stringify({ reason: "invalid QR" }) });
  });
});
