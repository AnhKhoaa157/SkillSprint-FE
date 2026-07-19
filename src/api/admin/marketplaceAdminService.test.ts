import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import { getMarketplaceItems, getMarketplaceReviewDetail, updateMarketplaceReviewStatus } from "./marketplaceAdminService";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("marketplaceAdminService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the pending-review queue by default", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ code: 1000, message: "Success", data: [] } as any);

    await getMarketplaceItems();

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items?status=PENDING_REVIEW");
  });

  it("requests a specific Marketplace item status", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ code: 1000, message: "Success", data: [] } as any);

    await getMarketplaceItems("PUBLISHED");

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items?status=PUBLISHED");
  });

  it("normalizes the immutable content snapshot with answers and evidence", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      code: 1000,
      message: "Success",
      data: {
        itemId: "item-1",
        packId: "pack-1",
        versionId: "version-1",
        versionNo: 2,
        title: "Pack",
        subject: "Backend",
        priceCoins: 100,
        chapterCount: 1,
        quizCount: 1,
        questionCount: 1,
        createdAt: "2026-07-19T00:00:00Z",
        status: "PENDING_REVIEW",
        qualityJob: null,
        qualityJobHistory: [],
        content: {
          chapters: [{
            sequenceNo: 1,
            title: "REST API",
            summary: "HTTP fundamentals",
            quiz: {
              title: "Chapter quiz",
              questions: [{
                questionId: "question-1",
                text: "Which method is idempotent?",
                type: "SINGLE_CHOICE",
                evidence: {
                  sourceStepId: "step-1",
                  sourceChunkIds: ["chunk-1"],
                  explanation: "PUT replaces a resource deterministically.",
                },
                options: [
                  { optionId: "option-1", label: "A", text: "POST", correct: false },
                  { optionId: "option-2", label: "B", text: "PUT", correct: true },
                ],
              }],
            },
          }],
        },
      },
    } as any);

    const detail = await getMarketplaceReviewDetail("item-1");

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items/item-1");
    expect(detail.chapters).toHaveLength(1);
    expect(detail.chapters[0].quizzes?.[0].questions[0]).toMatchObject({
      questionId: "question-1",
      question: "Which method is idempotent?",
      explanation: "PUT replaces a resource deterministically.",
      evidence: { sourceStepId: "step-1", sourceChunkIds: ["chunk-1"] },
    });
    expect(detail.chapters[0].quizzes?.[0].questions[0].options[1]).toMatchObject({
      label: "B",
      text: "PUT",
      correct: true,
    });
  });

  it("keeps the review status response as a summary contract", async () => {
    const summary = {
      itemId: "item-1",
      title: "Pack",
      subject: "Backend",
      priceCoins: 100,
      chapterCount: 1,
      quizCount: 1,
      questionCount: 20,
      createdAt: "2026-07-19T00:00:00Z",
      status: "PUBLISHED",
    };
    vi.mocked(requestJson).mockResolvedValueOnce({ code: 1000, message: "Success", data: summary } as any);

    await expect(updateMarketplaceReviewStatus("item/1", {
      status: "PUBLISHED",
      reviewNote: "Approved",
    })).resolves.toEqual(summary);

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items/item%2F1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "PUBLISHED", reviewNote: "Approved" }),
    });
  });
});
