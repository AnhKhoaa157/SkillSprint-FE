import { describe, it, expect, vi, beforeEach } from "vitest";
import { communityRoomService } from "./communityRoomService";
import { skillSprintApiClient, extractApiData } from "../core";

vi.mock("../core", () => ({
  skillSprintApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  extractApiData: vi.fn(),
}));

describe("communityRoomService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rooms", () => {
    it("should create room", async () => {
      const mockRoom = { roomId: "room1" };
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: { data: mockRoom } } as any);
      vi.mocked(extractApiData).mockReturnValueOnce(mockRoom);

      const payload = { name: "Test Room", type: "PUBLIC" as any, mode: "PUBLIC" as any, maxMembers: 50 };
      const result = await communityRoomService.createRoom(payload as any);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms", payload);
      expect(result).toEqual(mockRoom);
    });

    it("should discover rooms", async () => {
      const mockPage = { items: [] };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { data: mockPage } } as any);
      vi.mocked(extractApiData).mockReturnValueOnce(mockPage);

      const result = await communityRoomService.discoverRooms(1, 10, "LATEST", "query");

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms?page=1&size=10&mode=LATEST&search=query");
      expect(result).toEqual(mockPage);
    });

    it("should get my rooms", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({} as any);
      await communityRoomService.getMyRooms(0, 5);
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms/me?page=0&size=5");
    });

    it("should get room", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({} as any);
      await communityRoomService.getRoom("r1");
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms/r1");
    });

    it("should update room", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);
      await communityRoomService.updateRoom("r1", { name: "Updated" });
      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/community/rooms/r1", { name: "Updated" });
    });

    it("should delete room", async () => {
      vi.mocked(skillSprintApiClient.delete).mockResolvedValueOnce({} as any);
      await communityRoomService.deleteRoom("r1");
      expect(skillSprintApiClient.delete).toHaveBeenCalledWith("/api/community/rooms/r1");
    });

    it("should join room", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.joinRoom("r1");
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/r1/join");
    });

    it("should leave room", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.leaveRoom("r1");
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/r1/leave");
    });
  });

  describe("Members", () => {
    it("should get members", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({} as any);
      await communityRoomService.getMembers("r1", 0, 10);
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms/r1/members?page=0&size=10");
    });

    it("should update member role", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);
      await communityRoomService.updateMemberRole("r1", "u1", { role: "ADMIN" } as any);
      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/community/rooms/r1/members/u1/role", { role: "ADMIN" });
    });

    it("should mute member", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);
      await communityRoomService.muteMember("r1", "u1", { muteDurationMinutes: 60 });
      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/community/rooms/r1/members/u1/mute", { muteDurationMinutes: 60 });
    });

    it("should kick member", async () => {
      vi.mocked(skillSprintApiClient.delete).mockResolvedValueOnce({} as any);
      await communityRoomService.kickMember("r1", "u1");
      expect(skillSprintApiClient.delete).toHaveBeenCalledWith("/api/community/rooms/r1/members/u1");
    });
  });

  describe("Invites", () => {
    it("should invite member", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.inviteMember("r1", { inviteeUserId: "u1" });
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/r1/invites", { inviteeUserId: "u1" });
    });

    it("should accept invite", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.acceptInvite("CODE123");
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/invites/CODE123/accept");
    });

    it("should decline invite", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.declineInvite("CODE123");
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/invites/CODE123/decline");
    });
  });

  describe("Pins", () => {
    it("should get pins", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({} as any);
      await communityRoomService.getPins("r1");
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms/r1/pins");
    });

    it("should create pin", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.createPin("r1", { title: "Pin", content: "c", itemType: "MESSAGE" } as any);
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/r1/pins", { title: "Pin", content: "c", itemType: "MESSAGE" });
    });

    it("should reorder pins", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);
      await communityRoomService.reorderPins("r1", { pinIds: ["p1"] });
      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/community/rooms/r1/pins/reorder", { pinIds: ["p1"] });
    });

    it("should delete pin", async () => {
      vi.mocked(skillSprintApiClient.delete).mockResolvedValueOnce({} as any);
      await communityRoomService.deletePin("r1", "p1");
      expect(skillSprintApiClient.delete).toHaveBeenCalledWith("/api/community/rooms/r1/pins/p1");
    });
  });

  describe("Messages", () => {
    it("should get chat messages", async () => {
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({} as any);
      await communityRoomService.getMessageHistory("r1", 0, 20);
      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/rooms/r1/messages?page=0&size=20");
    });

    it("should report message", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);
      await communityRoomService.reportMessage("r1", "m1", { targetType: "MESSAGE", targetId: "m1", reason: "Spam" });
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/rooms/r1/messages/m1/report", { targetType: "MESSAGE", targetId: "m1", reason: "Spam" });
    });

    it("should hide message", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);
      await communityRoomService.hideMessage("r1", "m1", { hidden: true, adminNote: "Offensive" });
      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/community/rooms/r1/messages/m1/hide", { hidden: true, adminNote: "Offensive" });
    });
  });
});
