import { beforeEach, describe, expect, it, vi } from "vitest";
import marketplaceService from "./marketplaceService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
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

  it("cancels the selected pending SePay Coin top-up", async () => {
    const payment = { paymentId: "payment-1", purpose: "COIN_TOP_UP", status: "CANCELED", packageKey: "COIN_10000", coinAmount: 10000, amount: 10000, currency: "VND", paymentCode: "TOPUP-payment-1", qrUrl: "https://example.test/qr.png", bank: { bankCode: "MB", accountNumber: "123", accountName: "SKILLSPRINT" }, expiredAt: "2026-07-16T10:00:00Z" };
    vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: payment } } as never);

    await expect(marketplaceService.cancelSepayTopUp("payment-1")).resolves.toEqual(payment);
    expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/marketplace/wallet/top-ups/payment-1/cancel");
  });

  it("purchases a pack version with the supplied idempotency key", async () => {
    const receipt = { saleId: "sale-1", entitlementId: "entitlement-1", packId: "pack-1", packVersionId: "version-2", versionNo: 2, upgrade: true, originalGrossCoinAmount: 100, discountCoinAmount: 20, grossCoinAmount: 80, creatorAmount: 64, platformAmount: 16, remainingCoinBalance: 920, purchasedAt: "2026-07-17T00:00:00Z" };
    vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: receipt } } as never);

    await expect(marketplaceService.purchaseVersion("version-2", "key-1")).resolves.toEqual(receipt);
    expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/marketplace/versions/version-2/purchase/coins", { idempotencyKey: "key-1" });
  });

  it("returns no destination when a Creator has not saved payout details yet", async () => {
    vi.mocked(skillSprintApiClient.get).mockRejectedValueOnce({ response: { status: 404 } });

    await expect(marketplaceService.getCreatorPayoutDestination()).resolves.toBeNull();
  });

  it("gets the Creator earnings and payout history", async () => {
    const earnings = { pendingAmount: 25, reservedAmount: 10, paidAmount: 40, availableAmount: 15, earnings: [] };
    const payouts = [{ payoutId: "payout-1", requestedAmount: 10, status: "REQUESTED" }];
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: earnings } } as never).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: payouts } } as never);

    await expect(marketplaceService.getCreatorEarnings()).resolves.toEqual(earnings);
    await expect(marketplaceService.getCreatorPayouts()).resolves.toEqual(payouts);
    expect(skillSprintApiClient.get).toHaveBeenNthCalledWith(1, "/api/marketplace/creator/earnings");
    expect(skillSprintApiClient.get).toHaveBeenNthCalledWith(2, "/api/marketplace/creator/payouts");
  });

  it("normalizes purchased pack content for the learning page", async () => {
    const pack = {
      itemId: "pack-1",
      title: "Basic math",
      subject: "Math",
      questionCount: 1,
      content: {
        chapters: [{
          sequenceNo: 1,
          title: "Chapter 1",
          summary: "Number practice.",
          quiz: {
            questions: [{
              questionId: "question-1",
              text: "What is 1 + 1?",
              options: [{ optionId: "option-1", label: "A", text: "2" }],
            }],
          },
        }],
      },
    };
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: pack } } as never);

    await expect(marketplaceService.getMyPack("pack-1")).resolves.toEqual({
      itemId: "pack-1",
      title: "Basic math",
      subject: "Math",
      questionCount: 1,
      description: "",
      chapters: [{
        chapterId: "chapter-1",
        title: "Chapter 1",
        summary: "Number practice.",
        questions: [{
          questionId: "question-1",
          question: "What is 1 + 1?",
          options: [{ optionId: "option-1", text: "2" }],
        }],
      }],
      questions: [{
        questionId: "question-1",
        question: "What is 1 + 1?",
        options: [{ optionId: "option-1", text: "2" }],
      }],
    });
    expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/marketplace/my-packs/pack-1");
  });

  it("returns empty content when a purchased pack has no chapters", async () => {
    const pack = { itemId: "pack-1", title: "Empty pack", subject: "Math", questionCount: 0, content: {} };
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 200, message: "Success", data: pack } } as never);

    await expect(marketplaceService.getMyPack("pack-1")).resolves.toMatchObject({ chapters: [], questions: [] });
  });
});
