import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreatorQualityPanel, isCreatorReviewReady, isQualityReady, QualityStatusBadge } from "./CreatorQualityPanel";
import type { MarketplaceQualityJob } from "../../../api/marketplace";

const job: MarketplaceQualityJob = {
  jobId: "job-1",
  versionId: "version-1",
  status: "FAILED",
  score: 75,
  currentSnapshot: true,
  retryCount: 0,
  maxRetries: 2,
  errorCode: null,
  startedAt: "2026-07-19T00:00:01Z",
  completedAt: "2026-07-19T00:00:02Z",
  createdAt: "2026-07-19T00:00:00Z",
  report: {
    passingScore: 80,
    blockingIssueCount: 1,
    chapterCount: 4,
    questionCount: 20,
    issues: [{ code: "MISSING_EVIDENCE", severity: "BLOCKING", chapterSequenceNo: 2, questionId: "question-1", message: "Câu hỏi chưa có bằng chứng nguồn." }],
  },
};

describe("CreatorQualityPanel", () => {
  it("shows safe issue details and allows retrying a failed job", () => {
    const onStart = vi.fn();
    render(<CreatorQualityPanel job={job} loading={false} starting={false} active={false} error={null} onStart={onStart} onRetry={vi.fn()} />);

    expect(screen.getByText("Chưa đạt kiểm định")).toBeInTheDocument();
    expect(screen.getByText(/Câu hỏi chưa có bằng chứng nguồn/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chạy lại" }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("does not tell the Creator to fix hidden issues when the job has no report", () => {
    render(<CreatorQualityPanel job={{ ...job, report: null }} loading={false} starting={false} active={false} error={null} onStart={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByText("Kiểm định chưa tạo được báo cáo lỗi")).toBeInTheDocument();
    expect(screen.getByText(/Không có lỗi nội dung cụ thể để bạn sửa/)).toBeInTheDocument();
    expect(screen.queryByText("Cần xử lý trước khi gửi duyệt")).not.toBeInTheDocument();
  });

  it("shows a system error code instead of asking the Creator to fix content", () => {
    render(<CreatorQualityPanel job={{ ...job, status: "ERROR", retryCount: 2, errorCode: "QUALITY_VALIDATION_ERROR", report: null }} loading={false} starting={false} active={false} error={null} onStart={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByText("Kiểm định gặp lỗi hệ thống")).toBeInTheDocument();
    expect(screen.getByText("Mã lỗi: QUALITY_VALIDATION_ERROR")).toBeInTheDocument();
    expect(screen.queryByText("Kiểm định chưa tạo được báo cáo lỗi")).not.toBeInTheDocument();
  });

  it("distinguishes a stale pass from a current pass", () => {
    const { rerender } = render(<QualityStatusBadge status="PASSED" currentSnapshot={false} />);
    expect(screen.getByText("Cần kiểm định lại")).toBeInTheDocument();

    rerender(<QualityStatusBadge status="PASSED" currentSnapshot />);
    expect(screen.getByText("Đã đạt kiểm định")).toBeInTheDocument();
    expect(isQualityReady("PASSED", true)).toBe(true);
    expect(isQualityReady("PASSED", false)).toBe(false);
    expect(isCreatorReviewReady(90, "PASSED", true)).toBe(true);
    expect(isCreatorReviewReady(89, "PASSED", true)).toBe(false);
    expect(isCreatorReviewReady(100, "PASSED", false)).toBe(false);
  });
});
