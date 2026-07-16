import { beforeEach, describe, expect, it, vi } from "vitest";
import marketplaceService from "./marketplaceService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("marketplaceService creator snapshot endpoints", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets the stored Creator Validation snapshot", async () => {
    const snapshot = { itemId: "pack-1", sourceWorkspaceId: "workspace-1", title: "Pack", chapterCount: 1, quizCount: 1, questionCount: 1, chapters: [] };
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 1000, message: "Success", data: snapshot } } as any);

    await expect(marketplaceService.getCreatorValidationSnapshot("pack-1")).resolves.toEqual(snapshot);
    expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/marketplace/items/pack-1/creator-validation");
  });

  it("refreshes a draft snapshot", async () => {
    const item = { itemId: "pack-1", creatorValidationScore: null };
    vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: { code: 1000, message: "Success", data: item } } as any);

    await expect(marketplaceService.refreshCreatorSnapshot("pack-1")).resolves.toEqual(item);
    expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/marketplace/items/pack-1/refresh-snapshot");
  });

  it("gets the available Coin top-up packages", async () => {
    const packages = [{ packageKey: "COIN_10000", coinAmount: 10000, vndAmount: 10000, currency: "VND" }];
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: packages } } as never);

    await expect(marketplaceService.getTopUpPackages()).resolves.toEqual(packages);
    expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/marketplace/wallet/top-ups/packages");
  });

  it("creates a SePay Coin top-up for the selected package", async () => {
    const payment = { paymentId: "payment-1", purpose: "COIN_TOP_UP", status: "PENDING", packageKey: "COIN_10000", coinAmount: 10000, amount: 10000, currency: "VND", paymentCode: "TOPUP-payment-1", qrUrl: "https://example.test/qr.png", bank: { bankCode: "MB", accountNumber: "123", accountName: "SKILLSPRINT" }, expiredAt: "2026-07-16T10:00:00Z" };
    vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: payment } } as never);

    await expect(marketplaceService.createSepayTopUp("COIN_10000")).resolves.toEqual(payment);
    expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/marketplace/wallet/top-ups/sepay", { packageKey: "COIN_10000" });
  });
});
