import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceReportDialog } from "./MarketplaceReportDialog";
import marketplaceService from "../../../api/marketplace/marketplaceService";

vi.mock("../../../api/marketplace/marketplaceService", () => ({
  default: {
    createContentReport: vi.fn(),
    uploadReportEvidence: vi.fn(),
  },
}));

const target = { packVersionId: "version-1", targetType: "QUESTION" as const, targetRef: "q-1", label: "Câu 3" };

describe("MarketplaceReportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a report with the locked target and selected category", async () => {
    vi.mocked(marketplaceService.createContentReport).mockResolvedValue({} as never);
    render(<MarketplaceReportDialog open target={target} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveClass("bg-white", "text-slate-900");
    await userEvent.click(screen.getByRole("radio", { name: "Đáp án sai" }));
    await userEvent.type(screen.getByRole("textbox"), "Câu này sai đáp án");
    await userEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    await waitFor(() =>
      expect(marketplaceService.createContentReport).toHaveBeenCalledWith(
        expect.objectContaining({
          packVersionId: "version-1",
          targetType: "QUESTION",
          targetRef: "q-1",
          category: "INCORRECT_ANSWER",
          description: "Câu này sai đáp án",
        }),
      ),
    );
    expect(await screen.findByText("Đã gửi báo cáo")).toBeInTheDocument();
  });

  it("shows a conflict message when a duplicate report is rejected", async () => {
    vi.mocked(marketplaceService.createContentReport).mockRejectedValue({ status: 409 });
    render(<MarketplaceReportDialog open target={target} onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Gây hiểu nhầm" }));
    await userEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/đang xử lý cho nội dung này/);
  });

  it("keeps the submit button disabled until a reason is chosen", () => {
    render(<MarketplaceReportDialog open target={target} onOpenChange={vi.fn()} timerNote="Đồng hồ vẫn chạy." />);

    expect(screen.getByRole("button", { name: "Gửi báo cáo" })).toBeDisabled();
    expect(screen.getByText("Đồng hồ vẫn chạy.")).toBeInTheDocument();
  });
});
