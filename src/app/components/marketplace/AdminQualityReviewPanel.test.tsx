import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MarketplaceQualityJob } from "../../../api/marketplace";
import { AdminQualityReviewPanel } from "./AdminQualityReviewPanel";

const failedJob: MarketplaceQualityJob = {
  jobId: "job-1",
  versionId: "version-1",
  status: "FAILED",
  score: 70,
  currentSnapshot: true,
  retryCount: 0,
  maxRetries: 2,
  errorCode: null,
  startedAt: "2026-07-19T00:00:00Z",
  completedAt: "2026-07-19T00:01:00Z",
  createdAt: "2026-07-19T00:00:00Z",
  report: {
    passingScore: 90,
    blockingIssueCount: 1,
    chapterCount: 1,
    questionCount: 20,
    issues: [{ code: "MISSING_EVIDENCE", severity: "BLOCKING", chapterSequenceNo: 1, questionId: "question-123", message: "Thiếu bằng chứng nguồn." }],
  },
};

describe("AdminQualityReviewPanel", () => {
  it("explains why a failed quality check blocks publication", () => {
    render(<AdminQualityReviewPanel latest={failedJob} history={[failedJob]} />);

    expect(screen.getByText("Chưa đủ điều kiện xuất bản")).toBeInTheDocument();
    expect(screen.getByText("Thiếu bằng chứng nguồn.")).toBeInTheDocument();
    expect(screen.getByText("Lịch sử kiểm định (1)")).toBeInTheDocument();
  });

  it("shows an actionable empty state when no job exists", () => {
    render(<AdminQualityReviewPanel latest={null} />);

    expect(screen.getByText(/Creator chưa chạy kiểm định/)).toBeInTheDocument();
    expect(screen.getByText("Chưa kiểm định")).toBeInTheDocument();
  });

  it("lets an admin queue validation for a legacy pending pack", async () => {
    const onQueue = vi.fn();
    render(<AdminQualityReviewPanel latest={null} canQueue onQueue={onQueue} />);

    await userEvent.click(screen.getByRole("button", { name: "Chạy kiểm định cho pack cũ" }));

    expect(onQueue).toHaveBeenCalledOnce();
  });

  it("recognizes only a current passed snapshot", () => {
    render(<AdminQualityReviewPanel latest={{ ...failedJob, status: "PASSED", score: 96, currentSnapshot: true, report: { ...failedJob.report!, blockingIssueCount: 0, issues: [] } }} />);

    expect(screen.getByText("Đã đạt kiểm định")).toBeInTheDocument();
    expect(screen.queryByText("Chưa đủ điều kiện xuất bản")).not.toBeInTheDocument();
  });

  it("treats a stale passed result as blocked", () => {
    render(<AdminQualityReviewPanel latest={{ ...failedJob, status: "PASSED", score: 96, currentSnapshot: false, report: { ...failedJob.report!, blockingIssueCount: 0, issues: [] } }} />);

    expect(screen.getByText("Cần kiểm định lại")).toBeInTheDocument();
    expect(screen.getByText("Chưa đủ điều kiện xuất bản")).toBeInTheDocument();
  });
});
