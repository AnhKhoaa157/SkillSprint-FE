import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMarketplaceReviewDetail } from "../../../api/admin/marketplaceAdminService";
import type { AdminMarketplaceDetail } from "../../../api/admin/marketplaceAdminTypes";
import MarketplaceAdmin from "./MarketplaceAdmin";

vi.mock("../../../api/admin/marketplaceAdminService", () => ({
  getMarketplaceItems: vi.fn(),
  getMarketplaceReviewDetail: vi.fn(),
  queueAdminMarketplaceQuality: vi.fn(),
  updateMarketplaceReviewStatus: vi.fn(),
}));

const detail: AdminMarketplaceDetail = {
  itemId: "item-1",
  versionId: "version-1",
  versionNo: 1,
  title: "REST API Pack",
  creatorName: "Creator",
  subject: "Backend",
  priceCoins: 100,
  chapterCount: 1,
  quizCount: 1,
  questionCount: 1,
  creatorValidationScore: 95,
  qualityJob: null,
  qualityJobHistory: [],
  createdAt: "2026-07-19T00:00:00Z",
  status: "PENDING_REVIEW",
  chapters: [{
    chapterId: "chapter-1",
    sequenceNo: 1,
    title: "REST",
    quizzes: [{
      quizId: "quiz-1",
      title: "Quiz",
      questions: [{
        questionId: "question-1",
        question: "What is PUT?",
        explanation: "Idempotent update.",
        evidence: { sourceStepId: "step-1", sourceChunkIds: ["chunk-1"], explanation: "From step 1" },
        options: [{ optionId: "option-1", label: "A", text: "Update", correct: true }],
      }],
    }],
  }],
};

function renderPage(value: AdminMarketplaceDetail) {
  vi.mocked(getMarketplaceReviewDetail).mockResolvedValueOnce(value);
  return render(<MemoryRouter initialEntries={["/admin/marketplace/item-1"]}><Routes><Route path="/admin/marketplace/:itemId" element={<MarketplaceAdmin />} /></Routes></MemoryRouter>);
}

describe("MarketplaceAdmin moderation detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps reject available but blocks publish without a current quality pass", async () => {
    renderPage(detail);

    expect(await screen.findByRole("heading", { name: "REST API Pack" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Phê duyệt & xuất bản/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeEnabled();
    expect(screen.getByText("Bằng chứng nguồn")).toBeInTheDocument();
  });

  it("enables publish for a passed current snapshot", async () => {
    renderPage({
      ...detail,
      qualityJob: {
        jobId: "job-1",
        versionId: "version-1",
        status: "PASSED",
        score: 96,
        currentSnapshot: true,
        retryCount: 0,
        maxRetries: 2,
        startedAt: null,
        completedAt: "2026-07-19T00:01:00Z",
        createdAt: "2026-07-19T00:00:00Z",
        report: { passingScore: 90, blockingIssueCount: 0, chapterCount: 1, questionCount: 1, issues: [] },
      },
    });

    expect(await screen.findByRole("button", { name: /Phê duyệt & xuất bản/ })).toBeEnabled();
  });
});
