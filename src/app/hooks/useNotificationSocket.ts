import { useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { getAuthToken } from "../../api/core/apiClient";
import { API_BASE } from "../../api/core/config";
import type { NotificationResponse } from "../../api/core/skillSprintModels";

const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

function decodeJwtUserId(token: string): string | null {
  try {
    const payloadB64 = token.split(".")[1];
    const json: unknown = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

    if (typeof json !== "object" || json === null) {
      return null;
    }

    const payload = json as Record<string, unknown>;
    return (
      (typeof payload.sub === "string" ? payload.sub : null) ??
      (typeof payload.userId === "string" ? payload.userId : null) ??
      (typeof payload.user_id === "string" ? payload.user_id : null) ??
      null
    );
  } catch {
    return null;
  }
}

function parseNotification(frame: IMessage): NotificationResponse | null {
  try {
    const parsed: unknown = JSON.parse(frame.body);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const notification = parsed as Record<string, unknown>;
    if (
      typeof notification.notificationId !== "string" ||
      typeof notification.title !== "string" ||
      typeof notification.message !== "string" ||
      typeof notification.type !== "string" ||
      typeof notification.read !== "boolean" ||
      typeof notification.createdAt !== "string" ||
      (typeof notification.workspaceId !== "string" && notification.workspaceId !== null) ||
      (typeof notification.readAt !== "string" && notification.readAt !== null)
    ) {
      return null;
    }

    return notification as NotificationResponse;
  } catch {
    return null;
  }
}

export type NotificationType =
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

export function toastIcon(type: NotificationType): string {
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

export interface UseNotificationSocketOptions {
  onConnected: () => void;
  onNotification: (notification: NotificationResponse) => void;
}

export function useNotificationSocket({ onConnected, onNotification }: UseNotificationSocketOptions): boolean {
  const [connected, setConnected] = useState(false);
  const onConnectedRef = useRef(onConnected);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onConnectedRef.current = onConnected;
    onNotificationRef.current = onNotification;
  }, [onConnected, onNotification]);

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
        onConnectedRef.current();
        client.subscribe(`/topic/users/${userId}/notifications`, (frame: IMessage) => {
          if (!isActive) return;

          const notification = parseNotification(frame);
          if (notification) {
            onNotificationRef.current(notification);
          }
        });
      },
      onDisconnect: () => { if (isActive) setConnected(false); },
      onStompError: () => { if (isActive) setConnected(false); },
      onWebSocketError: () => { if (isActive) setConnected(false); },
    });

    client.activate();
    return () => {
      isActive = false;
      void client.deactivate();
    };
  }, []);

  return connected;
}
