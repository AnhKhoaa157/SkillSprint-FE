import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { marketplaceService } from "../../../api/marketplace";
import MarketplaceLearningHub from "./MarketplaceLearningHub";

vi.mock("../../../api/marketplace", () => ({
  marketplaceService: {
    getMyPacks: vi.fn(),
    getVersionProgress: vi.fn(),
    getPracticeAttemptHistory: vi.fn(),
    getVersionReviewContext: vi.fn(),
    upsertVersionReview: vi.fn(),
    startOrResumePracticeAttempt: vi.fn(),
    submitPracticeAttempt: vi.fn(),
  },
}));

vi.mock("./RankedQuizExperience", () => ({
  default: ({ onCompleted }: { onCompleted?: () => void | Promise<void> }) => <button type="button" onClick={() => void onCompleted?.()}>Hoàn thành Ranked mô phỏng</button>,
}));

const pack = {
  itemId: "pack-1",
  versionId: "version-1",
  versionNo: 2,
  title: "Pack luyện tập",
};

const progress = {
  versionId: "version-1",
  versionNo: 2,
  totalChapterCount: 1,
  totalQuizCount: 1,
  completedChapterCount: 0,
  completedQuizCount: 0,
  completionPercent: 0,
  firstActivityAt: null,
  lastActivityAt: null,
  reviewEligible: false,
  chapters: [{
    chapterSequenceNo: 1,
    chapterTitle: "Chương nền tảng",
    completed: false,
    bestScore: null,
    attemptCount: 0,
    lastCompletedAt: null,
  }],
};

describe("MarketplaceLearningHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketplaceService.getMyPacks).mockResolvedValue([pack] as never);
    vi.mocked(marketplaceService.getVersionProgress).mockResolvedValue(progress);
    vi.mocked(marketplaceService.getPracticeAttemptHistory).mockResolvedValue([]);
    vi.mocked(marketplaceService.getVersionReviewContext).mockResolvedValue({
      packId: "pack-1",
      versionId: "version-1",
      versionNo: 2,
      eligible: false,
      ineligibilityReason: "QUIZ_COMPLETION_REQUIRED",
      currentUserReview: null,
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  function renderHub(entry = "/my-packs/pack-1?versionId=version-1") {
    return render(<MemoryRouter initialEntries={[entry]}><Routes>
      <Route path="/my-packs/:itemId" element={<MarketplaceLearningHub />} />
    </Routes></MemoryRouter>);
  }

  it("loads the owned version and shows Practice progress by default", async () => {
    renderHub();

    expect(await screen.findByText("Luyện tập theo chương")).toBeInTheDocument();
    expect(screen.getByText("Chương nền tảng")).toBeInTheDocument();
    expect(screen.getByText("Học tiếp theo")).toBeInTheDocument();
    expect(screen.getByText("0/1 chương hoàn thành")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Practice" })).toHaveAttribute("aria-selected", "true");
    expect(marketplaceService.getVersionProgress).toHaveBeenCalledWith("version-1");
    expect(marketplaceService.getPracticeAttemptHistory).toHaveBeenCalledWith("version-1");
    expect(marketplaceService.getVersionReviewContext).toHaveBeenCalledWith("version-1");
    expect(screen.getByText(/Hoàn thành ít nhất một Practice hoặc Ranked Quiz/)).toBeInTheDocument();
  });

  it("submits a review only through the owned version context", async () => {
    vi.mocked(marketplaceService.getVersionReviewContext).mockResolvedValue({
      packId: "pack-1",
      versionId: "version-1",
      versionNo: 2,
      eligible: true,
      ineligibilityReason: null,
      currentUserReview: null,
    });
    vi.mocked(marketplaceService.upsertVersionReview).mockResolvedValue({
      reviewId: "review-1",
      packId: "pack-1",
      versionId: "version-1",
      versionNo: 2,
      reviewerName: "Learner",
      rating: 5,
      comment: "Rất hữu ích",
      createdAt: "2026-07-19T00:00:00Z",
      updatedAt: "2026-07-19T00:00:00Z",
    });
    renderHub();

    fireEvent.click(await screen.findByRole("radio", { name: "5 sao" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Rất hữu ích" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));

    await waitFor(() => expect(marketplaceService.upsertVersionReview).toHaveBeenCalledWith("version-1", {
      rating: 5,
      comment: "Rất hữu ích",
    }));
  });

  it("starts the selected chapter without exposing answer metadata", async () => {
    vi.mocked(marketplaceService.startOrResumePracticeAttempt).mockResolvedValue({
      attemptId: "attempt-1",
      versionId: "version-1",
      versionNo: 2,
      chapterSequenceNo: 1,
      chapterTitle: "Chương nền tảng",
      quizTitle: "Quiz chương 1",
      status: "IN_PROGRESS",
      startedAt: "2026-07-18T00:00:00Z",
      questionCount: 1,
      questions: [{
        questionId: "question-1",
        type: "SINGLE_CHOICE",
        text: "Câu hỏi an toàn",
        options: [{ optionId: "option-1", label: "A", text: "Lựa chọn A" }],
      }],
    });
    renderHub();

    fireEvent.click(await screen.findByRole("button", { name: "Bắt đầu" }));

    await waitFor(() => expect(marketplaceService.startOrResumePracticeAttempt).toHaveBeenCalledWith("version-1", 1));
    expect(await screen.findByText("Câu hỏi an toàn")).toBeInTheDocument();
    expect(screen.queryByText(/đáp án đúng/i)).not.toBeInTheDocument();
  });

  it("refreshes review eligibility after a Ranked completion", async () => {
    renderHub();
    await screen.findByText("Luyện tập theo chương");
    expect(marketplaceService.getVersionReviewContext).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "Ranked" }));
    fireEvent.click(await screen.findByRole("button", { name: "Hoàn thành Ranked mô phỏng" }));

    await waitFor(() => expect(marketplaceService.getVersionReviewContext).toHaveBeenCalledTimes(2));
  });
});
