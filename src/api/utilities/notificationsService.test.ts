import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  createReminder,
} from "./notificationsService";
import { extractApiData, skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  extractApiData: vi.fn(),
}));

describe("notificationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should fetch all notifications", async () => {
      const mockNotifications = [{ id: "n1", message: "Test" }];
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { success: true, code: "SUCCESS", message: "OK", data: mockNotifications } });
      vi.mocked(extractApiData).mockReturnValueOnce(mockNotifications);

      const result = await getNotifications();

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/notifications");
      expect(extractApiData).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("getUnreadNotifications", () => {
    it("should fetch unread notifications", async () => {
      const mockNotifications = [{ id: "n2", message: "Unread" }];
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { success: true, code: "SUCCESS", message: "OK", data: mockNotifications } });
      vi.mocked(extractApiData).mockReturnValueOnce(mockNotifications);

      const result = await getUnreadNotifications();

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/notifications/unread");
      expect(extractApiData).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("markNotificationRead", () => {
    it("should mark a notification as read", async () => {
      vi.mocked(skillSprintApiClient.patch).mockResolvedValueOnce({} as any);

      await markNotificationRead("notif123");

      expect(skillSprintApiClient.patch).toHaveBeenCalledWith("/api/notifications/notif123/read");
    });
  });

  describe("createReminder", () => {
    it("should create a reminder", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({} as any);

      const payload = { title: "Reminder", reminderTime: "2024-01-01" };
      await createReminder("workspace-1", payload as any);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/workspaces/workspace-1/reminders", payload);
    });
  });
});
