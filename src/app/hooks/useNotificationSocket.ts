import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { toast } from "sonner";
import { getAuthToken } from "../../api/core/apiClient";
import { API_BASE } from "../../api/core/config";
import { getNotifications, markNotificationRead } from "../../api/utilities/notificationsService";
import type { NotificationResponse } from "../../api/core/skillSprintModels";
import { getActivePublicAnnouncement } from "../../api/system/systemAnnouncementService";

const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

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
    case "SYSTEM_INFO": return "📢";
    case "SYSTEM_WARNING": return "🚨";
    default: return "🔔";
  }
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
  const aliveRef = useRef(true);

  // Load history from REST on mount + active public announcement
  useEffect(() => {
    let active = true;
    Promise.all([
      getNotifications().catch(() => [] as NotificationResponse[]),
      getActivePublicAnnouncement().catch(() => null)
    ])
      .then(([data, ann]) => {
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

        setNotifications(history);
        setUnreadCount(unreadCountBase);
      });
    return () => { active = false; };
  }, []);

  // STOMP WebSocket lifecycle
  useEffect(() => {
    aliveRef.current = true;
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
        if (!aliveRef.current) return;
        setConnected(true);

        client.subscribe(
          `/topic/users/${userId}/notifications`,
          (frame: IMessage) => {
            if (!aliveRef.current) return;
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
                duration: 5000,
                icon: toastIcon(incoming.type),
                position: "top-right",
              });
            } catch {
              // Ignore malformed STOMP frames
            }
          },
        );
      },

      onDisconnect: () => { if (aliveRef.current) setConnected(false); },
      onStompError: () => { if (aliveRef.current) setConnected(false); },
      onWebSocketError: () => { if (aliveRef.current) setConnected(false); },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      aliveRef.current = false;
      client.deactivate();
    };
  }, []); // intentionally empty — token/userId are stable per session

  const markAsRead = useCallback(async (notificationId: string) => {
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
