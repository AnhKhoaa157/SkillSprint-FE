import { beforeEach, describe, expect, it, vi } from "vitest";
import { adjustAdminWallet, getAdminWallet } from "./adminWalletService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("adminWalletService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads an admin wallet with recent audit entries", async () => {
    const wallet = { userId: "user-1", balance: 120, recentTransactions: [] };
    vi.mocked(requestJson).mockResolvedValueOnce({ data: wallet, message: "Success" } as never);

    await expect(getAdminWallet("user-1")).resolves.toEqual(wallet);
    expect(requestJson).toHaveBeenCalledWith("/api/admin/wallet/user-1");
  });

  it("sends an explicit signed amount and audit reason", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ data: { userId: "user-1", balance: 95 }, message: "Success" } as never);

    await expect(adjustAdminWallet("user-1", { amount: -25, reason: "Hoàn Coin hỗ trợ" })).resolves.toEqual({ userId: "user-1", balance: 95 });
    expect(requestJson).toHaveBeenCalledWith("/api/admin/wallet/user-1/adjust", {
      method: "POST",
      body: JSON.stringify({ amount: -25, reason: "Hoàn Coin hỗ trợ" }),
    });
  });
});
