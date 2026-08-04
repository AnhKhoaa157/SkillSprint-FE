import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import CommunityRoomChat from "./CommunityRoomChat";
import communityRoomService from "../../../api/community/communityRoomService";
import { useSubscription } from "../../../hooks/useSubscription";

vi.mock("../../../hooks/useSubscription", () => ({ useSubscription: vi.fn() }));

vi.mock("../../hooks/useCommunityChatSocket", () => ({
  useCommunityChatSocket: () => ({
    connected: true,
    error: null,
    messages: [],
    sendMessage: vi.fn(),
    setInitialMessages: vi.fn(),
    addLocalMessage: vi.fn(),
    updateLocalMessage: vi.fn(),
  }),
}));

vi.mock("../../../api/community/communityRoomService", () => ({
  default: {
    getRoom: vi.fn(),
    getMessageHistory: vi.fn(),
    getMembers: vi.fn(),
    getPins: vi.fn(),
    getMyRooms: vi.fn(),
    updateRoom: vi.fn(),
  },
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

function mockRoomLoad(): void {
  vi.mocked(communityRoomService.getRoom).mockResolvedValue(ownerRoom);
  vi.mocked(communityRoomService.getMessageHistory).mockResolvedValue({
    items: [], page: 0, size: 50, totalItems: 0, totalPages: 0, first: true, last: true,
  });
  vi.mocked(communityRoomService.getMembers).mockResolvedValue({
    items: [], page: 0, size: 100, totalItems: 0, totalPages: 0, first: true, last: true,
  });
  vi.mocked(communityRoomService.getPins).mockResolvedValue([]);
  vi.mocked(communityRoomService.getMyRooms).mockResolvedValue({
    items: [ownerRoom], page: 0, size: 15, totalItems: 1, totalPages: 1, first: true, last: true,
  });
}

describe("CommunityRoomChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    vi.mocked(useSubscription).mockReturnValue({
      planId: "PREMIUM", planName: "Premium", rawPlanId: "premium", rawPlanType: "PREMIUM",
      planMeta: { label: "Premium", badge: "PREMIUM", upgradeLabel: "Upgrade", upgradeSubtext: "" },
      loading: false, refresh: vi.fn(),
    });
    mockRoomLoad();
  });

  it("shows owner room controls in the chat sidebar and updates the room name", async () => {
    const user = userEvent.setup();
    vi.mocked(communityRoomService.updateRoom).mockResolvedValueOnce({ ...ownerRoom, name: "Flutter nâng cao" });

    render(
      <MemoryRouter initialEntries={["/app/community/rooms/room-1"]}>
        <Routes><Route path="/app/community/rooms/:roomId" element={<CommunityRoomChat />} /></Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Đổi tên phòng" }));
    const input = screen.getByDisplayValue("Phòng Flutter");
    await user.clear(input);
    await user.type(input, "Flutter nâng cao");
    await user.click(screen.getByRole("button", { name: "Lưu tên mới" }));

    await waitFor(() => {
      expect(communityRoomService.updateRoom).toHaveBeenCalledWith("room-1", { name: "Flutter nâng cao" });
    });
  });

  it("requires private before an owner changes the room mode", async () => {
    const user = userEvent.setup();
    vi.mocked(communityRoomService.updateRoom).mockResolvedValueOnce({ ...ownerRoom, mode: "PRIVATE" });

    render(
      <MemoryRouter initialEntries={["/app/community/rooms/room-1"]}>
        <Routes><Route path="/app/community/rooms/:roomId" element={<CommunityRoomChat />} /></Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Chuyển sang riêng tư" }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByPlaceholderText("private");
    expect(within(dialog).getByRole("button", { name: "Chuyển sang riêng tư" })).toBeDisabled();
    await user.type(input, "private");
    expect(within(dialog).getByRole("button", { name: "Chuyển sang riêng tư" })).toBeEnabled();
    await user.click(within(dialog).getByRole("button", { name: "Chuyển sang riêng tư" }));

    await waitFor(() => {
      expect(communityRoomService.updateRoom).toHaveBeenCalledWith("room-1", { mode: "PRIVATE" });
    });
  });
});
