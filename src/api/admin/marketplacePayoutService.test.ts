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

  it("uses the lifecycle endpoints and exact completion payload", async () => {
    const payout = { payoutId: "payout-1" };
    vi.mocked(requestJson)
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout })
      .mockResolvedValueOnce({ success: true, code: 200, message: "Success", data: payout });

    await approveMarketplacePayout("payout-1");
    await startMarketplacePayoutProcessing("payout-1");
    await completeMarketplacePayout("payout-1", "FT-1", "Đã đối soát");
    await rejectMarketplacePayout("payout-1", "QR không hợp lệ", true);

    expect(requestJson).toHaveBeenNthCalledWith(1, "/api/admin/marketplace/payouts/payout-1/approve", { method: "PATCH" });
    expect(requestJson).toHaveBeenNthCalledWith(2, "/api/admin/marketplace/payouts/payout-1/processing", { method: "PATCH" });
    expect(requestJson).toHaveBeenNthCalledWith(3, "/api/admin/marketplace/payouts/payout-1/complete", { method: "PATCH", body: JSON.stringify({ externalTransferReference: "FT-1", notes: "Đã đối soát" }) });
    expect(requestJson).toHaveBeenNthCalledWith(4, "/api/admin/marketplace/payouts/payout-1/fail", { method: "PATCH", body: JSON.stringify({ reason: "QR không hợp lệ" }) });
  });
});
