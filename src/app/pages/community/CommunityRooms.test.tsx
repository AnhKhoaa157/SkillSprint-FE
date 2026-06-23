import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommunityRooms from "./CommunityRooms";
import { useSubscription } from "../../../hooks/useSubscription";
import { MemoryRouter } from "react-router";

vi.mock("../../../hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

vi.mock("../../../api/community/communityRoomService", () => ({
  default: {
    getMyRooms: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
    getMyInvites: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
    discoverRooms: vi.fn().mockResolvedValue({ items: [], page: 0, last: true }),
  }
}));

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
});
