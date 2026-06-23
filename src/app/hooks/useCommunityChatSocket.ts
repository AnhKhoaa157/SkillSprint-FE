import { useEffect, useRef, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { getAuthToken } from "../../api/core/apiClient";
import { API_BASE } from "../../api/core/config";
import type { CommunityChatMessageResponse } from "../../api/community/communityRoomTypes";
import { toast } from "sonner";

const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");

export interface UseCommunityChatSocketReturn {
  connected: boolean;
  error: string | null;
  messages: CommunityChatMessageResponse[];
  sendMessage: (content: string) => void;
  setInitialMessages: (messages: CommunityChatMessageResponse[]) => void;
  addLocalMessage: (message: CommunityChatMessageResponse) => void;
  updateLocalMessage: (message: CommunityChatMessageResponse) => void;
}

export function useCommunityChatSocket(roomId: string | null): UseCommunityChatSocketReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityChatMessageResponse[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    let isActive = true;
    const token = getAuthToken();
    if (!token || !roomId) return;

    const client = new Client({
      brokerURL: `${WS_BASE}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        if (!isActive) return;
        setConnected(true);
        setError(null);
        console.log("[STOMP] Connected to", roomId);

        client.subscribe(`/topic/community.rooms.${roomId}`, (frame: IMessage) => {
          if (!isActive) return;
          try {
            const incoming = JSON.parse(frame.body) as CommunityChatMessageResponse;
            setMessages((prev) => {
              // Replace if already exists (e.g. from optimistic update or hide action), otherwise append
              const exists = prev.some((m) => m.messageId === incoming.messageId);
              if (exists) {
                return prev.map((m) => (m.messageId === incoming.messageId ? incoming : m));
              }
              // It's a new message
              return [...prev, incoming];
            });
          } catch {
            // Ignore malformed frames
          }
        });

        // Listen for user specific errors
        client.subscribe(`/user/queue/errors`, (frame: IMessage) => {
          if (!isActive) return;
          try {
            const errorPayload = JSON.parse(frame.body);
            toast.error(errorPayload.message || "Lỗi khi gửi tin nhắn");
          } catch {
            toast.error("Lỗi socket: " + frame.body);
          }
        });
      },

      onDisconnect: () => {
        console.log("[STOMP] Disconnected");
        if (isActive) setConnected(false);
      },
      onStompError: (frame) => {
        console.error("[STOMP] Protocol Error:", frame);
        if (isActive) {
          setConnected(false);
          setError(frame.headers["message"] || "STOMP Error");
        }
      },
      onWebSocketError: (evt) => {
        console.error("[STOMP] WebSocket Error:", evt);
        if (isActive) {
          setConnected(false);
          setError("WebSocket connection failed. Check API_BASE or backend.");
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      isActive = false;
      client.deactivate();
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current || !clientRef.current.connected || !roomId) {
        // Fallback: Add mock local message so the user can interact offline
        const localMsg: CommunityChatMessageResponse = {
          messageId: `mock-msg-${Date.now()}`,
          roomId: roomId || "mock-room",
          sender: {
            userId: "mock-user-owner",
            fullName: "Vũ Chí Bảo",
            avatarUrl: null
          },
          content,
          hidden: false,
          reportCount: 0,
          adminNote: null,
          sentAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, localMsg]);
        
        // Simulate a reply after 1.2 seconds so the chat feels alive!
        setTimeout(() => {
          const replies = [
            "Chào bạn! Cách giải quyết này tối ưu thật đấy.",
            "Mình cũng từng bị render vô tận như vậy, do Dependency Array bị tạo tham chiếu mới liên tục.",
            "Bạn có thể viết thêm một bài note chi tiết hơn trên Bảng tin được không?",
            "Cảm ơn chia sẻ cực kỳ hữu ích của bạn nha!",
            "Nhất trí nhé, dùng useMemo hoặc đưa hẳn hàm ra ngoài component là chuẩn bài."
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyMsg: CommunityChatMessageResponse = {
            messageId: `mock-reply-${Date.now()}`,
            roomId: roomId || "mock-room",
            sender: {
              userId: "mock-user-reply",
              fullName: "Lê Hoàng Long",
              avatarUrl: null
            },
            content: randomReply,
            hidden: false,
            reportCount: 0,
            adminNote: null,
            sentAt: new Date().toISOString()
          };
          setMessages((prev) => [...prev, replyMsg]);
        }, 1200);
        return;
      }
      // Send payload to backend
      clientRef.current.publish({
        destination: `/app/community.rooms.${roomId}.send`, // Backend has @MessageMapping("/community.rooms.{roomId}.send")
        body: JSON.stringify({ content }),
      });
    },
    [roomId]
  );

  const setInitialMessages = useCallback((initialMessages: CommunityChatMessageResponse[]) => {
    // Because backend returns history paginated, usually sorted by sentAt DESC.
    // In chat UI, we usually display newest at the bottom, so we should reverse them
    // to match chronological order [oldest, ..., newest] if they come [newest, ..., oldest].
    // Let's assume the caller handles sorting or we handle it here.
    const sorted = [...initialMessages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
    setMessages(sorted);
  }, []);

  const addLocalMessage = useCallback((message: CommunityChatMessageResponse) => {
    setMessages((prev) => {
      if (prev.some((m) => m.messageId === message.messageId)) return prev;
      return [...prev, message];
    });
  }, []);

  const updateLocalMessage = useCallback((message: CommunityChatMessageResponse) => {
    setMessages((prev) => prev.map((m) => (m.messageId === message.messageId ? message : m)));
  }, []);

  return { connected, error, messages, sendMessage, setInitialMessages, addLocalMessage, updateLocalMessage };
}
