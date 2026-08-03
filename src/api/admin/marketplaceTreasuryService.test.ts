import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import { getPlatformTreasuryMonthlySummaries } from "./marketplaceTreasuryService";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("marketplaceTreasuryService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests reconciled treasury summaries for the selected number of months", async () => {
    const summaries = [{
      month: "2026-08",
      vndInflow: 300000,
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
});
