import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { marketplaceService } from "../../../api/marketplace";
import { MarketplaceItemPage } from "./MarketplaceViews";

vi.mock("../../../api/marketplace", () => ({
  marketplaceService: {
    getItem: vi.fn(),
    getVersionReviews: vi.fn(),
    getReviews: vi.fn(),
    getWallet: vi.fn(),
    purchase: vi.fn(),
    purchaseVersion: vi.fn(),
  },
}));

vi.mock("../../components/marketplace/MarketplaceLeaderboardCard", () => ({
  default: () => <div>Bảng xếp hạng</div>,
}));

describe("MarketplaceItemPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketplaceService.getItem).mockResolvedValue({
      itemId: "pack-1",
      versionId: "version-2",
      versionNo: 2,
      title: "Quiz Pack an toàn",
      description: "Mô tả",
      subject: "Frontend",
      creatorName: "Creator",
      creatorAvatarUrl: null,
      priceCoins: 100,
      chapterCount: 0,
      quizCount: 0,
      questionCount: 0,
      averageRating: 4,
      reviewCount: 1,
      chapters: [],
      previewQuestions: [],
    } as never);
    vi.mocked(marketplaceService.getVersionReviews).mockResolvedValue({
      packId: "pack-1",
      versionId: "version-2",
      versionNo: 2,
      averageRating: 5,
      reviewCount: 1,
      reviews: [{
        reviewId: "review-1",
        packId: "pack-1",
        versionId: "version-2",
        versionNo: 2,
        reviewerName: "Buyer",
        rating: 5,
        comment: "Đúng phiên bản",
        createdAt: "2026-07-19T00:00:00Z",
        updatedAt: "2026-07-19T00:00:00Z",
      }],
    });
  });

  it("renders canonical version reviews without a public review editor", async () => {
    render(<MemoryRouter initialEntries={["/marketplace/items/pack-1"]}><Routes>
      <Route path="/marketplace/items/:itemId" element={<MarketplaceItemPage />} />
    </Routes></MemoryRouter>);

    expect(await screen.findByText("Đánh giá phiên bản 2")).toBeInTheDocument();
    expect(screen.getByText("Đúng phiên bản")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "5.0 ★ · 1 đánh giá")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await waitFor(() => expect(marketplaceService.getVersionReviews).toHaveBeenCalledWith("version-2"));
    expect(marketplaceService.getReviews).not.toHaveBeenCalled();
  });
});
