import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationResponse } from "../../api/core/skillSprintModels";
import { getActivePublicAnnouncement } from "../../api/system/systemAnnouncementService";
import communityRoomService from "../../api/community/communityRoomService";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/utilities/notificationsService";
import { toast } from "sonner";
import { NotificationProvider, useNotifications } from "./NotificationProvider";

type SocketFrameHandler = (frame: { body: string }) => void;
type MockSocketConfig = {
  onConnect?: () => void;
  subscriptions: SocketFrameHandler[];
};

const stompState = vi.hoisted(() => ({ configs: [] as MockSocketConfig[] }));

vi.mock("../../api/core/apiClient", () => ({
  getAuthToken: vi.fn(() => "header.eyJzdWIiOiJ1c2VyLTEifQ.signature"),
}));

vi.mock("../../api/utilities/notificationsService", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("../../api/system/systemAnnouncementService", () => ({
  getActivePublicAnnouncement: vi.fn(),
}));

vi.mock("../../api/community/communityRoomService", () => ({
  default: { getMyInvites: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@stomp/stompjs", () => ({
  Client: class {
    private readonly config: MockSocketConfig;

    constructor(config: unknown) {
      this.config = config as MockSocketConfig;
      this.config.subscriptions = [];
      stompState.configs.push(this.config);
    }

    activate(): void {}
    deactivate(): Promise<void> { return Promise.resolve(); }
    subscribe(_destination: string, callback: SocketFrameHandler): void {
      this.config.subscriptions.push(callback);
    }
  },
}));

const emptyInvites = {
  items: [],
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
};

function notification(notificationId: string, read = false): NotificationResponse {
  return {
    notificationId,
    workspaceId: "workspace-1",
    type: "ROADMAP_READY",
    title: `Notification ${notificationId}`,
    message: "Nội dung thông báo",
    read,
    readAt: read ? "2026-07-16T00:00:00.000Z" : null,
    createdAt: "2026-07-16T00:00:00.000Z",
  };
}

function NotificationConsumer({ name }: { name: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <section>
      <output data-testid={`${name}-count`}>{unreadCount}</output>
      <output data-testid={`${name}-items`}>
        {notifications.map((item) => `${item.notificationId}:${item.read ? "read" : "unread"}`).join(",")}
      </output>
      <button onClick={() => void markAsRead("n1")}>Đọc n1</button>
      <button onClick={() => void markAllAsRead()}>Đọc tất cả</button>
    </section>
  );
}

function renderProvider(withSecondConsumer = false) {
  return render(
    <NotificationProvider>
      <NotificationConsumer name="dashboard" />
      {withSecondConsumer && <NotificationConsumer name="page" />}
    </NotificationProvider>,
  );
}

describe("NotificationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stompState.configs.length = 0;
    vi.mocked(getNotifications).mockResolvedValue([notification("n1")]);
    vi.mocked(getActivePublicAnnouncement).mockResolvedValue(null);
    vi.mocked(communityRoomService.getMyInvites).mockResolvedValue(emptyInvites);
    vi.mocked(markNotificationRead).mockResolvedValue();
    vi.mocked(markAllNotificationsRead).mockResolvedValue();
  });

  it("shares read state between the dashboard and NotificationsPage consumers", async () => {
    renderProvider(true);

    await waitFor(() => expect(screen.getByTestId("dashboard-count")).toHaveTextContent("1"));
    expect(screen.getByTestId("page-count")).toHaveTextContent("1");

    fireEvent.click(screen.getAllByRole("button", { name: "Đọc n1" })[0]);

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith("n1"));
    expect(screen.getByTestId("dashboard-count")).toHaveTextContent("0");
    expect(screen.getByTestId("page-count")).toHaveTextContent("0");
    expect(screen.getByTestId("page-items")).toHaveTextContent("n1:read");
  });

  it("marks all backend notifications read and updates every shared consumer", async () => {
    vi.mocked(getNotifications).mockResolvedValue([notification("n1"), notification("n2")]);
    renderProvider(true);

    await waitFor(() => expect(screen.getByTestId("dashboard-count")).toHaveTextContent("2"));
    fireEvent.click(screen.getAllByRole("button", { name: "Đọc tất cả" })[0]);

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("dashboard-count")).toHaveTextContent("0");
    expect(screen.getByTestId("page-items")).toHaveTextContent("n1:read,n2:read");
  });

  it("does not increase the unread badge for a duplicate WebSocket notification", async () => {
    renderProvider();

    await waitFor(() => expect(stompState.configs).toHaveLength(1));
    act(() => stompState.configs[0].onConnect?.());
    await waitFor(() => expect(stompState.configs[0].subscriptions).toHaveLength(1));
    await waitFor(() => expect(screen.getByTestId("dashboard-count")).toHaveTextContent("1"));

    act(() => stompState.configs[0].subscriptions[0]({ body: JSON.stringify(notification("n1")) }));

    expect(screen.getByTestId("dashboard-count")).toHaveTextContent("1");
    expect(toast).not.toHaveBeenCalledWith("Notification n1", expect.anything());
  });

  it("refreshes after reconnect and when the browser tab becomes visible", async () => {
    renderProvider();

    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(1));
    act(() => stompState.configs[0].onConnect?.());
    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(2));

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(3));
  });

  it("keeps the notification unread and shows a Vietnamese error toast when mark-read fails", async () => {
    vi.mocked(markNotificationRead).mockRejectedValueOnce(new Error("Network error"));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("dashboard-count")).toHaveTextContent("1"));
    fireEvent.click(screen.getByRole("button", { name: "Đọc n1" }));

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.",
    ));
    expect(screen.getByTestId("dashboard-count")).toHaveTextContent("1");
    expect(screen.getByTestId("dashboard-items")).toHaveTextContent("n1:unread");
  });

  it("keeps all backend notifications unread when the bulk API fails", async () => {
    vi.mocked(markAllNotificationsRead).mockRejectedValueOnce(new Error("Network error"));
    vi.mocked(getNotifications).mockResolvedValue([notification("n1"), notification("n2")]);
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("dashboard-count")).toHaveTextContent("2"));
    fireEvent.click(screen.getByRole("button", { name: "Đọc tất cả" }));

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại.",
    ));
    expect(screen.getByTestId("dashboard-count")).toHaveTextContent("2");
    expect(screen.getByTestId("dashboard-items")).toHaveTextContent("n1:unread,n2:unread");
  });
});
