import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { marketplaceService } from "../../../api/marketplace";
import RankedQuizExperience from "./RankedQuizExperience";

vi.mock("../../../api/marketplace", () => ({
  marketplaceService: {
    getMyPacks: vi.fn(),
    getRankedAttemptHistory: vi.fn(),
    startOrResumeRankedAttempt: vi.fn(),
    submitRankedAttempt: vi.fn(),
  },
}));

vi.mock("../../../api/marketplace/useMarketplaceLeaderboard", () => ({
  refreshMarketplaceLeaderboard: vi.fn(),
}));

vi.mock("../../components/marketplace/MarketplaceLeaderboardCard", () => ({
  default: () => <div>Bảng xếp hạng</div>,
}));

describe("RankedQuizExperience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketplaceService.getMyPacks).mockResolvedValue([{
      itemId: "pack-1",
      versionId: "version-1",
      versionNo: 2,
      title: "Ranked Pack",
    }] as never);
    vi.mocked(marketplaceService.getRankedAttemptHistory).mockResolvedValue([]);
    vi.mocked(marketplaceService.startOrResumeRankedAttempt).mockResolvedValue({
      attemptId: "attempt-1",
      versionId: "version-1",
      versionNo: 2,
      status: "IN_PROGRESS",
      attemptDate: "2026-07-19",
      attemptNumber: 1,
      startedAt: "2026-07-19T00:00:00Z",
      expiresAt: "2099-07-19T00:30:00Z",
      totalQuestionCount: 1,
      attemptsRemaining: 2,
      questions: [{
        questionId: "question-1",
        type: "SINGLE_CHOICE",
        text: "Câu hỏi Ranked",
        options: [{ optionId: "option-1", label: "A", text: "Lựa chọn A" }],
      }],
    });
    vi.mocked(marketplaceService.submitRankedAttempt).mockResolvedValue({
      attemptId: "attempt-1",
      versionId: "version-1",
      score: 100,
      correctCount: 1,
      questionCount: 1,
      durationSeconds: 10,
      completedAt: "2026-07-19T00:00:10Z",
      suspicious: false,
      leaderboardEligible: true,
    });
  });

  it("notifies the parent after a successful server submission", async () => {
    const onCompleted = vi.fn();
    render(<MemoryRouter initialEntries={["/my-packs/pack-1?versionId=version-1"]}><Routes>
      <Route path="/my-packs/:itemId" element={<RankedQuizExperience embedded onCompleted={onCompleted} />} />
    </Routes></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "Bắt đầu Quiz xếp hạng" }));
    fireEvent.click(await screen.findByRole("button", { name: /Lựa chọn A/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài (1/1)" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Nộp bài" }));

    await waitFor(() => expect(marketplaceService.submitRankedAttempt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
  });
});
