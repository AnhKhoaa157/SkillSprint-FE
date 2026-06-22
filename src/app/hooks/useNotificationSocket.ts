import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { toast } from "sonner";
import { getAuthToken } from "../../api/core/apiClient";
import { API_BASE } from "../../api/core/config";
import { getNotifications, markNotificationRead } from "../../api/utilities/notificationsService";
import type { NotificationResponse } from "../../api/core/skillSprintModels";
import { getActivePublicAnnouncement } from "../../api/system/systemAnnouncementService";
import communityRoomService from "../../api/community/communityRoomService";
import type { CommunityRoomInviteResponse } from "../../api/community/communityRoomTypes";

const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");
const ROOM_INVITE_NOTIFICATION_PREFIX = "community-room-invite-";
const ROOM_INVITE_POLL_MS = 30_000;

function decodeJwtUserId(token: string): string | null {
  try {
    const payloadB64 = token.split(".")[1];
    const json = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return (
      (typeof json.sub === "string" ? json.sub : null) ??
      (typeof json.userId === "string" ? json.userId : null) ??
      (typeof json.user_id === "string" ? json.user_id : null) ??
      null
    );
  } catch {
    return null;
  }
}

type NotificationType =
  | "MATERIAL_ANALYSIS_DONE"
  | "MATERIAL_PROCESSING_FAILED"
  | "ROADMAP_READY"
  | "TASK_REMINDER"
  | "TASK_OVERDUE"
  | "AI_SCHEDULE_READY"
  | "FEEDBACK_REPLIED"
  | "COMMUNITY_ROOM_INVITE"
  | "SYSTEM_INFO"
  | "SYSTEM_WARNING"
  | string;

function toastIcon(type: NotificationType): string {
  switch (type) {
    case "MATERIAL_ANALYSIS_DONE": return "📚";
    case "MATERIAL_PROCESSING_FAILED": return "❌";
    case "ROADMAP_READY": return "🗺️";
    case "TASK_REMINDER": return "⏰";
    case "TASK_OVERDUE": return "⚠️";
    case "AI_SCHEDULE_READY": return "🤖";
    case "FEEDBACK_REPLIED": return "💬";
    case "COMMUNITY_ROOM_INVITE": return "👥";
    case "SYSTEM_INFO": return "📢";
    case "SYSTEM_WARNING": return "🚨";
    default: return "🔔";
  }
}

function inviteReadKey(inviteId: string): string {
  return `community_room_invite_notification_read:${inviteId}`;
}

function isRoomInviteNotification(notificationId: string): boolean {
  return notificationId.startsWith(ROOM_INVITE_NOTIFICATION_PREFIX);
}

function hasReadInviteNotification(inviteId: string): boolean {
  try {
    return localStorage.getItem(inviteReadKey(inviteId)) === "1";
  } catch {
    return false;
  }
}

function markInviteNotificationRead(inviteId: string) {
  try {
    localStorage.setItem(inviteReadKey(inviteId), "1");
  } catch {}
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

function mergeInviteNotifications(
  current: NotificationResponse[],
  inviteNotifications: NotificationResponse[]
): NotificationResponse[] {
  const nonInvite = current.filter((notification) => !isRoomInviteNotification(notification.notificationId));
  const systemAnnouncements = nonInvite.filter((notification) => notification.notificationId.startsWith("sys-ann-"));
  const rest = nonInvite.filter((notification) => !notification.notificationId.startsWith("sys-ann-"));

  return [...systemAnnouncements, ...inviteNotifications, ...rest];
}

export interface UseNotificationSocketReturn {
  notifications: NotificationResponse[];
  unreadCount: number;
  connected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
}

export function useNotificationSocket(): UseNotificationSocketReturn {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const knownInviteNotificationIdsRef = useRef<Set<string>>(new Set());

  const syncRoomInviteNotifications = useCallback(async (notifyNew = false) => {
    const res = await communityRoomService.getMyInvites(0, 20);
    const inviteNotifications = res.items
      .filter((invite) => invite.status === "PENDING")
      .map(inviteToNotification);

    const nextInviteIds = new Set(inviteNotifications.map((notification) => notification.notificationId));
    const newInviteNotifications = inviteNotifications.filter(
      (notification) =>
        !knownInviteNotificationIdsRef.current.has(notification.notificationId) && !notification.read
    );

    knownInviteNotificationIdsRef.current = nextInviteIds;

    setNotifications((prev) => {
      const next = mergeInviteNotifications(prev, inviteNotifications);
      setUnreadCount(next.filter((notification) => !notification.read).length);
      return next;
    });

    if (notifyNew) {
      newInviteNotifications.forEach((notification) => {
        toast(notification.title, {
          description: notification.message,
          duration: 3000,
          closeButton: true,
          icon: toastIcon(notification.type),
          position: "top-right",
        });
      });
    }
  }, []);

  // Load history from REST on mount + active public announcement
  useEffect(() => {
    let active = true;
    Promise.all([
      getNotifications().catch(() => [] as NotificationResponse[]),
      getActivePublicAnnouncement().catch(() => null),
      communityRoomService.getMyInvites(0, 20).catch(() => null)
    ])
      .then(([data, ann, invites]) => {
        if (!active) return;
        
        let history = [...data];
        let unreadCountBase = history.filter((n) => !n.read).length;
        
        if (ann && ann.active) {
          const annKey = ann.announcementId || `${ann.title}|${ann.message}`;
          const isRead = localStorage.getItem("dismissed_announcement_id") === annKey;
          
          const syntheticAnn: NotificationResponse = {
            notificationId: `sys-ann-${annKey}`,
            title: ann.title,
            message: ann.message || "",
            type: ann.type === "WARNING" ? "SYSTEM_WARNING" : "SYSTEM_INFO",
            read: isRead,
            readAt: isRead ? new Date().toISOString() : null,
            createdAt: ann.updatedAt || new Date().toISOString(),
            workspaceId: "system",
          };
          
          history.unshift(syntheticAnn);
          if (!isRead) {
            unreadCountBase += 1;
          }
        }

        const inviteNotifications = (invites?.items ?? [])
          .filter((invite) => invite.status === "PENDING")
          .map(inviteToNotification);

        knownInviteNotificationIdsRef.current = new Set(
          inviteNotifications.map((notification) => notification.notificationId)
        );

        history = mergeInviteNotifications(history, inviteNotifications);
        unreadCountBase = history.filter((notification) => !notification.read).length;

        setNotifications(history);
        setUnreadCount(unreadCountBase);
      });
    return () => { active = false; };
  }, []);

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

  // STOMP WebSocket lifecycle
  useEffect(() => {
    let isActive = true;
    const token = getAuthToken();
    if (!token) return;

    const userId = decodeJwtUserId(token);
    if (!userId) return;

    const client = new Client({
      brokerURL: `${WS_BASE}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 6000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        if (!isActive) return;
        setConnected(true);

        client.subscribe(
          `/topic/users/${userId}/notifications`,
          (frame: IMessage) => {
            if (!isActive) return;
            try {
              const incoming = JSON.parse(frame.body) as NotificationResponse;

              setNotifications((prev) => {
                // Guard against duplicates
                if (prev.some((n) => n.notificationId === incoming.notificationId)) return prev;
                // Insert after synthetic announcement if it's unread/new, otherwise just at top
                return [incoming, ...prev];
              });
              setUnreadCount((c) => c + 1);

              toast(incoming.title, {
                description: incoming.message,
                // 2s auto-dismiss; sonner owns the timer (with cleanup + pause-on-hover).
                duration: 2000,
                closeButton: true,
                icon: toastIcon(incoming.type),
                position: "top-right",
              });
            } catch {
              // Ignore malformed STOMP frames
            }
          },
        );
      },

      onDisconnect: () => { if (isActive) setConnected(false); },
      onStompError: () => { if (isActive) setConnected(false); },
      onWebSocketError: () => { if (isActive) setConnected(false); },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      isActive = false;
      client.deactivate();
    };
  }, []); // intentionally empty — token/userId are stable per session

  const markAsRead = useCallback(async (notificationId: string) => {
    if (isRoomInviteNotification(notificationId)) {
      const inviteId = notificationId.replace(ROOM_INVITE_NOTIFICATION_PREFIX, "");
      markInviteNotificationRead(inviteId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      return;
    }

    if (notificationId.startsWith("sys-ann-")) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        const annKey = notificationId.replace("sys-ann-", "");
        localStorage.setItem("dismissed_announcement_id", annKey);
        // Dispatch custom event so GlobalAnnouncementBanner can hide if it's mounted
        window.dispatchEvent(new Event("system_announcement_dismissed"));
      } catch {}
      return;
    }

    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Non-critical; silently ignore
    }
  }, []);

  return { notifications, unreadCount, connected, markAsRead };
}

// Helpers exported for the notification item renderer
export { toastIcon };
export type { NotificationType };
