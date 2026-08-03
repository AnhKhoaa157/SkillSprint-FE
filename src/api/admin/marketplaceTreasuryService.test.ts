import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import {
  getPlatformTreasuryMonthlySummaries,
  getPlatformTreasurySubscriptionPurchaseSummary,
} from "./marketplaceTreasuryService";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("marketplaceTreasuryService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests reconciled treasury summaries for the selected number of months", async () => {
    const summaries = [{
      month: "2026-08",
      vndInflow: 300000,
      subscriptionPaymentVnd: 200000,
      subscriptionPurchaserCount: 8,
      coinTopUpVnd: 100000,
      vndOutflow: 100000,
      vndNetPosition: 200000,
      commissionCoinEarned: 50,
      commissionCoinReversed: 10,
      commissionCoinNetPosition: 40,
    }];
    vi.mocked(requestJson).mockResolvedValueOnce({ data: summaries } as never);

    await expect(getPlatformTreasuryMonthlySummaries(12)).resolves.toEqual(summaries);

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/treasury/monthly-summaries?months=12");
  });

  it("counts purchasers for the selected service plan and date range", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ data: { purchaserCount: 8 } } as never);

    await expect(getPlatformTreasurySubscriptionPurchaseSummary({
      from: "2026-08-01T00:00:00+07:00",
      to: "2026-09-01T00:00:00+07:00",
      planId: "plan-1",
    })).resolves.toEqual({ purchaserCount: 8 });

    expect(requestJson).toHaveBeenCalledWith(
      "/api/admin/marketplace/treasury/subscription-purchases/summary?from=2026-08-01T00%3A00%3A00%2B07%3A00&to=2026-09-01T00%3A00%3A00%2B07%3A00&planId=plan-1",
    );
  });
});
