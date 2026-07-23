import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUsers } from "../../../../../api/admin/adminUserService";
import { getAdminWallet } from "../../../../../api/admin/adminWalletService";
import CoinWalletSection from "./CoinWalletSection";
import { CoinWalletAuditSection } from "../../userDetail/CoinWalletAuditSection";

vi.mock("../../../../../api/admin/adminUserService", () => ({ getAdminUsers: vi.fn() }));
vi.mock("../../../../../api/admin/adminWalletService", () => ({ getAdminWallet: vi.fn(), adjustAdminWallet: vi.fn() }));

const wallet = { userId: "user-1", balance: 240, recentTransactions: [] };

describe("CoinWalletSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminUsers).mockResolvedValue({
      content: [{ id: "user-1", email: "learner@example.com", fullName: "Nguyễn An" }],
      totalElements: 1,
    } as never);
    vi.mocked(getAdminWallet).mockResolvedValue(wallet);
  });

  it("opens the selected wallet in a dialog instead of navigating to user detail", async () => {
    const user = userEvent.setup();
    render(<CoinWalletSection />);

    await user.click(await screen.findByRole("button", { name: "Mở ví" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Ví của Nguyễn An");
    expect(screen.getByRole("button", { name: "Điều chỉnh Coin" })).toBeVisible();
    expect(getAdminWallet).toHaveBeenCalledWith("user-1");
  });

  it("loads the next user page when more results are available", async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminUsers)
      .mockResolvedValueOnce({
        content: [{ id: "user-1", email: "learner@example.com", fullName: "Nguyễn An" }],
        totalElements: 2,
      } as never)
      .mockResolvedValueOnce({
        content: [{ id: "user-2", email: "learner-2@example.com", fullName: "Trần Bình" }],
        totalElements: 2,
      } as never);

    render(<CoinWalletSection />);

    await user.click(await screen.findByRole("button", { name: "Tải thêm người dùng" }));

    expect(await screen.findByText("Trần Bình")).toBeInTheDocument();
    expect(getAdminUsers).toHaveBeenLastCalledWith(undefined, 1, 20);
  });

  it("keeps wallet adjustment unavailable in user detail", async () => {
    render(<CoinWalletAuditSection userId="user-1" />);

    await screen.findByText("SỐ DƯ HIỆN TẠI");

    expect(screen.queryByRole("button", { name: "Điều chỉnh Coin" })).not.toBeInTheDocument();
  });
});
