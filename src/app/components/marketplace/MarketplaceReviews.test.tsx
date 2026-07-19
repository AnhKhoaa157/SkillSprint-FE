import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MarketplaceReviewContext } from "../../../api/marketplace";
import { MarketplaceReviewEditor, MarketplaceReviewList } from "./MarketplaceReviews";

const eligibleContext: MarketplaceReviewContext = {
  packId: "pack-1",
  versionId: "version-1",
  versionNo: 2,
  eligible: true,
  ineligibilityReason: null,
  currentUserReview: null,
};

describe("MarketplaceReviews", () => {
  it("submits an accessible star rating for the exact version context", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MarketplaceReviewEditor context={eligibleContext} loading={false} error={null} saving={false} onRetry={vi.fn()} onSave={onSave} />);

    await userEvent.click(screen.getByRole("radio", { name: "4 sao" }));
    await userEvent.type(screen.getByRole("textbox"), "Nội dung rõ ràng");
    await userEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));

    expect(onSave).toHaveBeenCalledWith({ rating: 4, comment: "Nội dung rõ ràng" });
  });

  it("explains why quiz completion is required", () => {
    render(<MarketplaceReviewEditor context={{ ...eligibleContext, eligible: false, ineligibilityReason: "QUIZ_COMPLETION_REQUIRED" }} loading={false} error={null} saving={false} onRetry={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText(/Hoàn thành ít nhất một Practice hoặc Ranked Quiz/)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("renders a version review list without editing controls", () => {
    render(<MarketplaceReviewList reviews={[{ reviewId: "review-1", reviewerName: "Learner", rating: 5, comment: "Tốt", createdAt: "2026-07-19T00:00:00Z", updatedAt: "2026-07-19T00:00:00Z" }]} />);

    expect(screen.getByText("Learner")).toBeInTheDocument();
    expect(screen.getByLabelText("5 trên 5 sao")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
