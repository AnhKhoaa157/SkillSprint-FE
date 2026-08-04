import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommunityRooms from "./CommunityRooms";
import { useSubscription } from "../../../hooks/useSubscription";
import { MemoryRouter } from "react-router";
import communityRoomService from "../../../api/community/communityRoomService";

vi.mock("../../../hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

vi.mock("../../../api/community/communityRoomService", () => ({
  default: {
    getMyRooms: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
    getMyInvites: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
    discoverRooms: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
  }
}));

const ownerRoom = {
  roomId: "room-1",
  name: "Phòng Flutter",
  description: "Cùng học Flutter",
  mode: "PUBLIC" as const,
  status: "ACTIVE" as const,
  owner: { userId: "owner-1", fullName: "Chủ phòng" },
  maxMembers: 50,
  memberCount: 3,
  reportCount: 0,
  myRole: "OWNER" as const,
  joined: true,
  banned: false,
  createdAt: "2026-08-04T00:00:00Z",
  updatedAt: "2026-08-04T00:00:00Z",
};

describe("CommunityRooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show upgrade block when subscription plan is FREE", () => {
    vi.mocked(useSubscription).mockReturnValue({
      planId: "FREE",
      planName: "Starter",
      rawPlanId: "free",
      rawPlanType: "FREE",
      planMeta: { label: "Starter", badge: "FREE", upgradeLabel: "Upgrade", upgradeSubtext: "" },
      loading: false,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <CommunityRooms />
      </MemoryRouter>
    );

    expect(screen.getByText("Phòng cộng đồng dành cho gói nâng cấp")).toBeInTheDocument();
  });

  it("should render rooms normally when subscription plan is PREMIUM", () => {
    vi.mocked(useSubscription).mockReturnValue({
      planId: "PREMIUM",
      planName: "Premium",
      rawPlanId: "premium",
      rawPlanType: "PREMIUM",
      planMeta: { label: "Premium", badge: "PREMIUM", upgradeLabel: "Upgrade", upgradeSubtext: "" },
      loading: false,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <CommunityRooms />
      </MemoryRouter>
    );

    expect(screen.getByText("Phòng Cộng Đồng")).toBeInTheDocument();
    expect(screen.queryByText("Phòng cộng đồng dành cho gói nâng cấp")).not.toBeInTheDocument();
  });
  it("lets the room owner rename a room", async () => {
    const user = userEvent.setup();
    vi.mocked(useSubscription).mockReturnValue({
      planId: "PREMIUM", planName: "Premium", rawPlanId: "premium", rawPlanType: "PREMIUM",
      planMeta: { label: "Premium", badge: "PREMIUM", upgradeLabel: "Upgrade", upgradeSubtext: "" },
      loading: false, refresh: vi.fn(),
    });
    vi.mocked(communityRoomService.getMyRooms).mockResolvedValueOnce({
      items: [ownerRoom], page: 0, size: 20, totalItems: 1, totalPages: 1, first: true, last: true,
    });
    vi.mocked(communityRoomService.updateRoom).mockResolvedValueOnce({ ...ownerRoom, name: "Flutter nâng cao" });

    render(<MemoryRouter><CommunityRooms /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "Đổi tên phòng" }));
    const input = screen.getByLabelText("Tên phòng mới");
    await user.clear(input);
    await user.type(input, "Flutter nâng cao");
    await user.click(screen.getByRole("button", { name: "Lưu tên mới" }));

    await waitFor(() => {
      expect(communityRoomService.updateRoom).toHaveBeenCalledWith("room-1", { name: "Flutter nâng cao" });
    });
  });

  it("lets the room owner delete a room after app confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(useSubscription).mockReturnValue({
      planId: "PREMIUM", planName: "Premium", rawPlanId: "premium", rawPlanType: "PREMIUM",
      planMeta: { label: "Premium", badge: "PREMIUM", upgradeLabel: "Upgrade", upgradeSubtext: "" },
      loading: false, refresh: vi.fn(),
    });
    vi.mocked(communityRoomService.getMyRooms).mockResolvedValueOnce({
      items: [ownerRoom], page: 0, size: 20, totalItems: 1, totalPages: 1, first: true, last: true,
    });
    vi.mocked(communityRoomService.deleteRoom).mockResolvedValueOnce();

    render(<MemoryRouter><CommunityRooms /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "Xóa phòng" }));
    expect(screen.getByText("Xóa phòng cộng đồng?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa phòng" }));

    await waitFor(() => {
      expect(communityRoomService.deleteRoom).toHaveBeenCalledWith("room-1");
    });
  });
});
