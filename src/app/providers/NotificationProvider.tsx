import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactElement } from "react";
import { toast } from "sonner";
import type { NotificationResponse } from "../../api/core/skillSprintModels";
import { getActivePublicAnnouncement } from "../../api/system/systemAnnouncementService";
import communityRoomService from "../../api/community/communityRoomService";
import type { CommunityRoomInviteResponse } from "../../api/community/communityRoomTypes";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/utilities/notificationsService";
import { toastIcon, useNotificationSocket } from "../hooks/useNotificationSocket";

const ROOM_INVITE_NOTIFICATION_PREFIX = "community-room-invite-";
const SYSTEM_ANNOUNCEMENT_NOTIFICATION_PREFIX = "sys-ann-";
const ROOM_INVITE_POLL_MS = 30_000;

type NotificationContextValue = {
  notifications: NotificationResponse[];
  unreadCount: number;
  connected: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function inviteReadKey(inviteId: string): string {
  return `community_room_invite_notification_read:${inviteId}`;
}

function isRoomInviteNotification(notificationId: string): boolean {
  return notificationId.startsWith(ROOM_INVITE_NOTIFICATION_PREFIX);
}

function isSystemAnnouncement(notificationId: string): boolean {
  return notificationId.startsWith(SYSTEM_ANNOUNCEMENT_NOTIFICATION_PREFIX);
}

function isBackendNotification(notification: NotificationResponse): boolean {
  return !isRoomInviteNotification(notification.notificationId) && !isSystemAnnouncement(notification.notificationId);
}

function hasReadInviteNotification(inviteId: string): boolean {
  try {
    return localStorage.getItem(inviteReadKey(inviteId)) === "1";
  } catch {
    return false;
  }
}

function markInviteNotificationRead(inviteId: string): void {
  try {
    localStorage.setItem(inviteReadKey(inviteId), "1");
  } catch {
    // The invite remains read in the current session even if storage is unavailable.
  }
}

function hasReadSystemAnnouncement(announcementKey: string): boolean {
  try {
    return localStorage.getItem("dismissed_announcement_id") === announcementKey;
  } catch {
    return false;
  }
}

function inviteToNotification(invite: CommunityRoomInviteResponse): NotificationResponse {
  const inviterName = invite.inviter?.fullName?.trim() || "Một thành viên SkillSprint";
  const read = hasReadInviteNotification(invite.inviteId);

  return {
    notificationId: `${ROOM_INVITE_NOTIFICATION_PREFIX}${invite.inviteId}`,
    workspaceId: `community-room:${invite.roomId}`,
    type: "COMMUNITY_ROOM_INVITE",
    title: `Lời mời vào phòng ${invite.roomName}`,
    message: `${inviterName} đã mời bạn tham gia phòng cộng đồng này.`,
    read,
    readAt: read ? new Date().toISOString() : null,
    createdAt: invite.createdAt,
  };
}

function dedupeNotifications(notifications: NotificationResponse[]): NotificationResponse[] {
  const seen = new Set<string>();
  return notifications.filter((notification) => {
    if (seen.has(notification.notificationId)) {
      return false;
    }

    seen.add(notification.notificationId);
    return true;
  });
}

function mergeInviteNotifications(
  current: NotificationResponse[],
  inviteNotifications: NotificationResponse[],
): NotificationResponse[] {
  const nonInvites = current.filter((notification) => !isRoomInviteNotification(notification.notificationId));
  const systemAnnouncements = nonInvites.filter((notification) => isSystemAnnouncement(notification.notificationId));
  const remainingNotifications = nonInvites.filter((notification) => !isSystemAnnouncement(notification.notificationId));

  return dedupeNotifications([...systemAnnouncements, ...inviteNotifications, ...remainingNotifications]);
}

function markRead(notification: NotificationResponse, readAt: string): NotificationResponse {
  return notification.read ? notification : { ...notification, read: true, readAt };
}

export function NotificationProvider({ children }: PropsWithChildren): ReactElement {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const notificationsRef = useRef<NotificationResponse[]>([]);
  const socketNotificationIdsRef = useRef(new Set<string>());
  const isMountedRef = useRef(false);

  const commitNotifications = useCallback((updater: (current: NotificationResponse[]) => NotificationResponse[]) => {
    const next = updater(notificationsRef.current);
    notificationsRef.current = next;
    setNotifications(next);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const [backendNotifications, announcement, invitesResult] = await Promise.all([
      getNotifications(),
      getActivePublicAnnouncement().catch(() => null),
      communityRoomService.getMyInvites(0, 20).catch(() => null),
    ]);

    if (!isMountedRef.current) return;

    const backendIds = new Set(backendNotifications.map((notification) => notification.notificationId));
    const pendingSocketNotifications = notificationsRef.current.filter(
      (notification) => socketNotificationIdsRef.current.has(notification.notificationId) && !backendIds.has(notification.notificationId),
    );

    backendIds.forEach((notificationId) => socketNotificationIdsRef.current.delete(notificationId));

    const inviteNotifications = (invitesResult?.items ?? [])
      .filter((invite) => invite.status === "PENDING")
      .map(inviteToNotification);

    const systemAnnouncements: NotificationResponse[] = [];
    if (announcement?.active) {
      const announcementKey = announcement.announcementId || `${announcement.title}|${announcement.message}`;
      const read = hasReadSystemAnnouncement(announcementKey);
      systemAnnouncements.push({
        notificationId: `${SYSTEM_ANNOUNCEMENT_NOTIFICATION_PREFIX}${announcementKey}`,
        title: announcement.title,
        message: announcement.message || "",
        type: announcement.type === "WARNING" ? "SYSTEM_WARNING" : "SYSTEM_INFO",
        read,
        readAt: read ? new Date().toISOString() : null,
        createdAt: announcement.updatedAt || new Date().toISOString(),
        workspaceId: "system",
      });
    }

    commitNotifications(() => dedupeNotifications([
      ...systemAnnouncements,
      ...inviteNotifications,
      ...backendNotifications.filter(isBackendNotification),
      ...pendingSocketNotifications,
    ]));
  }, [commitNotifications]);

  const syncRoomInviteNotifications = useCallback(async (notifyNew: boolean) => {
    const result = await communityRoomService.getMyInvites(0, 20);
    const inviteNotifications = result.items
      .filter((invite) => invite.status === "PENDING")
      .map(inviteToNotification);
    const knownInviteIds = new Set(
      notificationsRef.current
        .filter((notification) => isRoomInviteNotification(notification.notificationId))
        .map((notification) => notification.notificationId),
    );

    commitNotifications((current) => mergeInviteNotifications(current, inviteNotifications));

    if (notifyNew) {
      inviteNotifications
        .filter((notification) => !notification.read && !knownInviteIds.has(notification.notificationId))
        .forEach((notification) => {
          toast(notification.title, {
            description: notification.message,
            duration: 3000,
            closeButton: true,
            icon: toastIcon(notification.type),
            position: "top-right",
          });
        });
    }
  }, [commitNotifications]);

  const handleSocketNotification = useCallback((notification: NotificationResponse) => {
    if (notificationsRef.current.some((item) => item.notificationId === notification.notificationId)) {
      return;
    }

    socketNotificationIdsRef.current.add(notification.notificationId);
    commitNotifications((current) => [notification, ...current]);
    toast(notification.title, {
      description: notification.message,
      duration: 2000,
      closeButton: true,
      icon: toastIcon(notification.type),
      position: "top-right",
    });
  }, [commitNotifications]);

  const connected = useNotificationSocket({
    onConnected: () => { void refreshNotifications().catch(() => {}); },
    onNotification: handleSocketNotification,
  });

  useEffect(() => {
    isMountedRef.current = true;
    void refreshNotifications().catch(() => {});

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void syncRoomInviteNotifications(true).catch(() => {});
    }, ROOM_INVITE_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [syncRoomInviteNotifications]);

  useEffect(() => {
    const handleInvitesChanged = () => {
      void syncRoomInviteNotifications(false).catch(() => {});
    };

    window.addEventListener("community-room-invites-changed", handleInvitesChanged);
    return () => window.removeEventListener("community-room-invites-changed", handleInvitesChanged);
  }, [syncRoomInviteNotifications]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const notification = notificationsRef.current.find((item) => item.notificationId === notificationId);
    if (!notification || notification.read) return;

    const readAt = new Date().toISOString();
    if (isRoomInviteNotification(notificationId)) {
      markInviteNotificationRead(notificationId.replace(ROOM_INVITE_NOTIFICATION_PREFIX, ""));
      commitNotifications((current) => current.map((item) => item.notificationId === notificationId ? markRead(item, readAt) : item));
      return;
    }

    if (isSystemAnnouncement(notificationId)) {
      try {
        localStorage.setItem("dismissed_announcement_id", notificationId.replace(SYSTEM_ANNOUNCEMENT_NOTIFICATION_PREFIX, ""));
        window.dispatchEvent(new Event("system_announcement_dismissed"));
      } catch {
        // A blocked localStorage must not prevent the local synthetic notification from being dismissed.
      }

      commitNotifications((current) => current.map((item) => item.notificationId === notificationId ? markRead(item, readAt) : item));
      return;
    }

    try {
      await markNotificationRead(notificationId);
      if (!isMountedRef.current) return;

      commitNotifications((current) => current.map((item) => item.notificationId === notificationId ? markRead(item, readAt) : item));
    } catch {
      toast.error("Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.");
    }
  }, [commitNotifications]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notificationsRef.current.filter((notification) => !notification.read);
    const unreadBackendNotifications = unreadNotifications.filter(isBackendNotification);

    if (unreadBackendNotifications.length > 0) {
      try {
        await markAllNotificationsRead();
      } catch {
        toast.error("Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại.");
        return;
      }
    }

    if (!isMountedRef.current) return;

    const readAt = new Date().toISOString();
    const unreadNotificationIds = new Set(unreadNotifications.map((notification) => notification.notificationId));
    const unreadLocalNotifications = unreadNotifications.filter((notification) => !isBackendNotification(notification));

    unreadLocalNotifications.forEach((notification) => {
      if (isRoomInviteNotification(notification.notificationId)) {
        markInviteNotificationRead(notification.notificationId.replace(ROOM_INVITE_NOTIFICATION_PREFIX, ""));
      } else if (isSystemAnnouncement(notification.notificationId)) {
        try {
          localStorage.setItem("dismissed_announcement_id", notification.notificationId.replace(SYSTEM_ANNOUNCEMENT_NOTIFICATION_PREFIX, ""));
          window.dispatchEvent(new Event("system_announcement_dismissed"));
        } catch {
          // Synthetic notifications are still updated in memory when storage is unavailable.
        }
      }
    });

    commitNotifications((current) => current.map((notification) => (
      unreadNotificationIds.has(notification.notificationId) ? markRead(notification, readAt) : notification
    )));
  }, [commitNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    connected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  }), [connected, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
