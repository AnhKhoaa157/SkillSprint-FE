import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Send, Users, Pin, ArrowLeft, Loader2, UserPlus, Shield, Lock, ShieldAlert, Hash, X, Plus, ExternalLink, Trash2, Smile, Bold, Italic, Code, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AnimatePresence, motion } from "motion/react";

import communityRoomService from "../../../api/community/communityRoomService";
import { useCommunityChatSocket } from "../../hooks/useCommunityChatSocket";
import type { 
  CommunityRoomResponse, 
  CommunityRoomMemberResponse, 
  CommunityPinResponse,
} from "../../../api/community/communityRoomTypes";
import { getStoredAuthSession } from "../../../api/auth/authService";

function UserAvatar({ name, url, className = "w-8.5 h-8.5" }: { name?: string | null; url?: string | null; className?: string }) {
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    setIsError(false);
  }, [url]);

  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const bgColor = React.useMemo(() => {
    if (!name) return "bg-slate-200 text-slate-650";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-orange-100 text-orange-700",
      "bg-[#FF6B00]/10 text-[#FF6B00]",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700",
      "bg-rose-100 text-rose-700",
      "bg-indigo-100 text-indigo-700",
      "bg-sky-100 text-sky-700",
      "bg-amber-100 text-amber-700",
    ];
    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  if (!url || isError) {
    return (
      <div className={`shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider select-none shadow-sm ring-1 ring-slate-100/50 ${bgColor} ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name || "User"}
      onError={() => setIsError(true)}
      className={`shrink-0 rounded-full object-cover border border-white shadow-sm ring-1 ring-slate-100/50 ${className}`}
    />
  );
}

function MessageContent({ content, isHidden }: { content: string; isHidden: boolean }) {
  if (isHidden) {
    return <span className="text-slate-400 italic line-through">Tin nhắn đã bị ẩn bởi kiểm duyệt viên</span>;
  }

  // Detect code blocks ```language ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, matchIndex)
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "code",
      value: match[2]
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex)
    });
  }

  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.type === "code") {
          return (
            <div key={idx} className="my-2 rounded-xl overflow-hidden border border-slate-700/30 shadow-xs bg-[#1E1E1E]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2D2D2D] text-slate-400 text-[10px] font-mono border-b border-slate-800">
                <span>{(part.language || "CODE").toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(part.value || "");
                    toast.success("Đã sao chép mã nguồn!");
                  }}
                  className="hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-700 text-[9px] font-bold uppercase tracking-wider text-slate-300"
                >
                  Sao chép
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto select-text leading-relaxed">
                <code>{part.value}</code>
              </pre>
            </div>
          );
        }
        return (
          <span key={idx} className="whitespace-pre-wrap break-words inline-block w-full text-slate-700">
            {part.value}
          </span>
        );
      })}
    </div>
  );
}

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

export default function CommunityRoomChat() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentUserId = React.useMemo(() => {
    const session = getStoredAuthSession();
    if (!session) return null;
    return decodeJwtUserId(session.accessToken);
  }, []);

  const [room, setRoom] = useState<CommunityRoomResponse | null>(null);
  const [members, setMembers] = useState<CommunityRoomMemberResponse[]>([]);
  const [pins, setPins] = useState<CommunityPinResponse[]>([]);
  const [myRooms, setMyRooms] = useState<CommunityRoomResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  
  // Right sidebar state
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "PINS">("MEMBERS");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const { connected, error, messages, sendMessage, setInitialMessages } = useCommunityChatSocket(roomId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const [createPinModalOpen, setCreatePinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState({ title: "", content: "", linkUrl: "" });

  const isModerator = React.useMemo(() => {
    if (!currentUserId || !members.length) return false;
    const currentMember = members.find(m => m.user?.userId === currentUserId);
    return currentMember?.role === "OWNER" || currentMember?.role === "MODERATOR";
  }, [currentUserId, members]);

  // Reactions state
  const [reactions, setReactions] = useState<Record<string, Array<{ emoji: string; count: number; active: boolean }>>>({});

  useEffect(() => {
    if (!roomId) return;
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const [roomData, msgHistory, membersData, pinsData, myRoomsData] = await Promise.all([
        communityRoomService.getRoom(roomId!),
        communityRoomService.getMessageHistory(roomId!, 0, 50),
        communityRoomService.getMembers(roomId!, 0, 100),
        communityRoomService.getPins(roomId!),
        communityRoomService.getMyRooms(0, 15).catch(() => ({ items: [] }))
      ]);

      setRoom(roomData);
      setInitialMessages(msgHistory.items);
      setMembers(membersData.items);
      setPins(pinsData);
      setMyRooms(myRoomsData.items || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải dữ liệu phòng");
      navigate("/app/community/rooms");
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage.trim());
    setInputMessage("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communityRoomService.inviteMember(roomId!, { inviteeEmail: inviteEmail });
      toast.success("Đã gửi lời mời tham gia phòng!");
      setInviteModalOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi mời thành viên");
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requestPayload = {
        ...newPin,
        itemType: newPin.linkUrl ? "DOCUMENT_URL" : "ANNOUNCEMENT"
      } as any;
      await communityRoomService.createPin(roomId!, requestPayload);
      toast.success("Đã ghim tin nhắn này thành công!");
      setCreatePinModalOpen(false);
      setNewPin({ title: "", content: "", linkUrl: "" });
      // Reload pins
      const pinsData = await communityRoomService.getPins(roomId!);
      setPins(pinsData);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ghim");
    }
  };

  const handleDeletePin = async (pinId: string) => {
    if (!confirm("Bạn có chắc chắn muốn gỡ ghim này?")) return;
    try {
      await communityRoomService.deletePin(roomId!, pinId);
      toast.success("Đã gỡ ghim thành công!");
      setPins(pins.filter(p => p.pinId !== pinId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gỡ ghim");
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!confirm("Bạn có chắc muốn trục xuất thành viên này khỏi phòng?")) return;
    try {
      await communityRoomService.kickMember(roomId!, memberId);
      toast.success("Trục xuất thành viên thành công");
      setMembers(members.filter(m => m.user?.userId !== memberId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi trục xuất thành viên");
    }
  };

  if (loading || !room) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF6B00] mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị phòng chat...</p>
        </div>
      </div>
    );
  }

  const formatTimeSafely = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return format(d, "HH:mm");
    } catch {
      return "";
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setReactions(prev => {
      const current = prev[messageId] || [
        { emoji: "👍", count: 2, active: false },
        { emoji: "❤️", count: 1, active: false },
        { emoji: "🔥", count: 3, active: false },
      ];
      const updated = current.map(r => {
        if (r.emoji === emoji) {
          return {
            ...r,
            count: r.active ? r.count - 1 : r.count + 1,
            active: !r.active,
          };
        }
        return r;
      });
      return { ...prev, [messageId]: updated };
    });
  };

  const getMsgReactions = (msgId: string, idx: number) => {
    const key = msgId || String(idx);
    if (!reactions[key]) {
      const initial = [
        { emoji: "👍", count: Math.floor(Math.abs(Math.sin(idx)) * 4) + 1, active: false },
        { emoji: "❤️", count: Math.floor(Math.abs(Math.cos(idx)) * 2), active: false },
        { emoji: "🔥", count: Math.floor(Math.abs(Math.sin(idx * 2)) * 3), active: false },
      ].filter(r => r.count > 0);
      return initial;
    }
    return reactions[key];
  };

  // Rich text formatting helper
  const insertFormat = (type: "bold" | "italic" | "code") => {
    const textarea = document.getElementById("chat-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.slice(start, end);
    
    const offset = type === "bold" ? 2 : type === "italic" ? 1 : 14;
    const placeholder = type === "bold" ? "chữ đậm" : type === "italic" ? "chữ nghiêng" : "// code tại đây";
    let formatted = selected;
    
    if (type === "bold") formatted = "**" + (selected || placeholder) + "**";
    else if (type === "italic") formatted = "*" + (selected || placeholder) + "*";
    else if (type === "code") formatted = String.fromCharCode(96, 96, 96) + "javascript\n" + (selected || placeholder) + "\n" + String.fromCharCode(96, 96, 96);
    
    setInputMessage(text.slice(0, start) + formatted + text.slice(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offset, start + offset + (selected || placeholder).length);
    }, 50);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50/50 overflow-hidden relative font-sans antialiased">
      {/* Decorative ambient spots */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-slate-50/20 backdrop-blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[10%] left-[15%] h-[350px] w-[350px] rounded-full bg-orange-200/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full bg-[#FF6B00]/5 blur-[150px] pointer-events-none z-0" />
      
      {/* COLUMN 1: LEFT SIDEBAR */}
      <div className="w-66 bg-white/85 backdrop-blur-md flex flex-col shrink-0 hidden md:flex border-r border-slate-200/50 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <div className="p-4.5 border-b border-slate-200/50 flex items-center justify-between">
          <span className="font-extrabold text-xs tracking-wider uppercase text-slate-805 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#FF6B00]" /> Kênh thảo luận
          </span>
          <Link to="/app/community/rooms" className="text-slate-400 hover:text-[#FF6B00] hover:bg-orange-50/60 transition-all p-1.5 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Phòng học của tôi
          </div>
          <div className="space-y-1 mt-1">
            {myRooms.map((r) => {
              const isActive = r.roomId === roomId;
              return (
                <Link 
                  key={r.roomId} 
                  to={`/app/community/rooms/${r.roomId}`}
                  className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 relative border border-transparent ${
                    isActive 
                      ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-[#FF6B00] border-orange-500/15 font-bold shadow-[0_2px_12px_rgba(255,107,0,0.03)]" 
                      : "text-slate-600 hover:bg-slate-100/55 hover:text-slate-900 font-semibold"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF6B00] rounded-r-lg" />
                  )}
                  <Hash className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FF6B00]" : "text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity"}`} />
                  <span className="truncate">{r.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 bg-white/30 border-t border-slate-200/50">
          <Link to="/app/community/rooms">
            <button 
              type="button"
              className="w-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-650 hover:text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 h-9.5 transition-all shadow-xs"
            >
              Khám phá phòng khác
            </button>
          </Link>
        </div>
      </div>
 
      {/* COLUMN 2: CENTER CHAT AREA */}
      <div className="flex flex-1 flex-col bg-white/35 backdrop-blur-md relative z-10 border-r border-slate-200/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/50 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/community/rooms")} className="text-slate-500 md:hidden shrink-0 hover:bg-slate-100 rounded-xl h-9.5 w-9.5 border border-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-sm font-black text-slate-850 flex items-center gap-2">
                <span className="text-[#FF6B00] font-black">#</span> {room.name}
                {room.mode === "PRIVATE" && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                {room.mode === "INVITE_ONLY" && <Shield className="w-3.5 h-3.5 text-slate-400" />}
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-450 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" /> {room.memberCount} thành viên
                </span>
                <span className="text-slate-300">•</span>
                {connected ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Trực tuyến
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-550 animate-pulse" /> Giả lập Offline
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Right Sidebar Toggle */}
          <div className="lg:hidden flex gap-2">
            <Button 
              variant={activeTab === "MEMBERS" && showMobileSidebar ? "default" : "outline"} 
              size="icon" 
              className={`h-9 w-9 rounded-xl ${activeTab === "MEMBERS" && showMobileSidebar ? "bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white" : "text-slate-655"}`}
              onClick={() => { setActiveTab("MEMBERS"); setShowMobileSidebar(!showMobileSidebar); }}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeTab === "PINS" && showMobileSidebar ? "default" : "outline"} 
              size="icon" 
              className={`h-9 w-9 rounded-xl ${activeTab === "PINS" && showMobileSidebar ? "bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white" : "text-slate-655"}`}
              onClick={() => { setActiveTab("PINS"); setShowMobileSidebar(!showMobileSidebar); }}
            >
              <Pin className="w-4 h-4" />
            </Button>
          </div>
        </div>
 
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto py-5 space-y-3.5 [scrollbar-width:thin] scroll-smooth bg-slate-50/10">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50/80 text-[#FF6B00] border border-orange-100/40 shadow-xs mb-4">
                  <Hash className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Chào mừng đến với #{room.name}!</h3>
                <p className="text-xs text-slate-455 mt-2 font-bold leading-relaxed">
                  Đây là khởi đầu lịch sử trò chuyện của phòng học này. Hãy gửi tin nhắn đầu tiên của bạn để chia sẻ kiến thức nhé!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender?.userId === currentUserId || msg.sender?.userId === "mock-user-owner";
              const isHidden = msg.hidden;
              
              // Discord/Slack grouping logic
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isSameSender = prevMsg && prevMsg.sender?.userId === msg.sender?.userId;
              const isRecent = prevMsg && (new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime() < 120000);
              const isCompact = isSameSender && isRecent;
 
              if (isCompact) {
                return (
                  <div key={msg.messageId || idx} className="group/msg relative flex justify-start items-start px-6 py-1 hover:bg-slate-50/50 transition-colors duration-100">
                    {/* Hover menu */}
                    <div className="absolute right-6 -top-3.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 z-20 flex items-center bg-white border border-slate-200/80 shadow-md rounded-xl p-1 gap-0.5">
                      <button 
                        type="button" 
                        onClick={() => handleToggleReaction(msg.messageId || String(idx), "👍")}
                        className="p-1 hover:bg-slate-100 hover:text-orange-600 rounded-md text-xs transition"
                        title="Thích"
                      >
                        👍
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleToggleReaction(msg.messageId || String(idx), "🔥")}
                        className="p-1 hover:bg-slate-100 hover:text-orange-600 rounded-md text-xs transition"
                        title="Tuyệt vời"
                      >
                        🔥
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setInputMessage(prev => prev ? `@${msg.sender?.fullName} ${prev}` : `@${msg.sender?.fullName} `)}
                        className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md text-slate-500 transition flex items-center justify-center"
                        title="Trả lời"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-8.5 shrink-0 flex justify-end pr-2.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                      <span className="text-[8px] text-slate-400 mt-1 select-none font-bold">
                        {formatTimeSafely(msg.sentAt)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pl-3">
                      <MessageContent content={msg.content} isHidden={!!isHidden} />
                      
                      {/* Emoji Reactions */}
                      {!isHidden && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {getMsgReactions(msg.messageId || String(idx), idx).map((react) => (
                            <button
                              key={react.emoji}
                              onClick={() => handleToggleReaction(msg.messageId || String(idx), react.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-all ${
                                react.active
                                  ? "bg-orange-50 border-[#FF6B00]/30 text-[#FF6B00]"
                                  : "bg-white border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              <span>{react.emoji}</span>
                              <span>{react.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
 
              return (
                <div key={msg.messageId || idx} className="group/msg relative flex justify-start items-start px-6 py-2 hover:bg-slate-50/50 transition-colors duration-100">
                  {/* Hover menu */}
                  <div className="absolute right-6 -top-3.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 z-20 flex items-center bg-white border border-slate-200/80 shadow-md rounded-xl p-1 gap-0.5">
                    <button 
                      type="button" 
                      onClick={() => handleToggleReaction(msg.messageId || String(idx), "👍")}
                      className="p-1 hover:bg-slate-100 hover:text-orange-600 rounded-md text-xs transition"
                      title="Thích"
                    >
                      👍
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleToggleReaction(msg.messageId || String(idx), "🔥")}
                      className="p-1 hover:bg-slate-100 hover:text-orange-600 rounded-md text-xs transition"
                      title="Tuyệt vời"
                    >
                      🔥
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setInputMessage(prev => prev ? `@${msg.sender?.fullName} ${prev}` : `@${msg.sender?.fullName} `)}
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md text-slate-500 transition flex items-center justify-center"
                      title="Trả lời"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    {isModerator && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const mockPinObj: CommunityPinResponse = {
                            pinId: `mock-pin-${Date.now()}`,
                            roomId: roomId || "mock-room",
                            title: `Tin nhắn từ ${msg.sender?.fullName || "Người dùng"}`,
                            content: msg.content,
                            linkUrl: null,
                            sortOrder: 0,
                            createdAt: new Date().toISOString(),
                            pinnedBy: {
                              userId: "mock-user-owner",
                              fullName: "Vũ Chí Bảo",
                              avatarUrl: null
                            }
                          };
                          setPins(prev => [mockPinObj, ...prev]);
                          toast.success("Đã ghim tin nhắn này!");
                        }}
                        className="p-1.5 hover:bg-slate-105 hover:text-[#FF6B00] rounded-md text-slate-500 transition flex items-center justify-center"
                        title="Ghim"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <UserAvatar
                    name={msg.sender?.fullName}
                    url={msg.sender?.avatarUrl}
                    className="w-8.5 h-8.5"
                  />
                  <div className="flex-1 min-w-0 pl-3">
                    <div className="flex items-baseline mb-1">
                      <span className={`text-xs font-black mr-2 hover:underline cursor-pointer ${isMe ? "text-[#FF6B00]" : "text-slate-800"}`}>
                        {msg.sender?.fullName || "Người dùng"}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold tracking-wide">
                        {formatTimeSafely(msg.sentAt)}
                      </span>
                    </div>
                    <MessageContent content={msg.content} isHidden={!!isHidden} />
                    
                    {/* Emoji Reactions */}
                    {!isHidden && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getMsgReactions(msg.messageId || String(idx), idx).map((react) => (
                          <button
                            key={react.emoji}
                            onClick={() => handleToggleReaction(msg.messageId || String(idx), react.emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-all ${
                              react.active
                                ? "bg-orange-50 border-[#FF6B00]/30 text-[#FF6B00]"
                                : "bg-white border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <span>{react.emoji}</span>
                            <span>{react.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
 
        {/* Message Input Box */}
        <div className="px-6 py-4 bg-white shrink-0 border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto bg-slate-50/50 border border-slate-200/80 rounded-2xl shadow-[0_4px_18px_rgba(0,0,0,0.01)] focus-within:border-slate-350 focus-within:bg-white focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <textarea
              id="chat-textarea"
              placeholder={`Gửi tin nhắn đến #${room.name}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              rows={1}
              className="w-full bg-transparent border-0 outline-none resize-none px-4 pt-3.5 pb-2 text-xs text-slate-800 placeholder-slate-400 max-h-32 min-h-[44px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl">
              <div className="flex items-center gap-1 text-slate-455">
                <button 
                  type="button" 
                  onClick={() => insertFormat("bold")}
                  className="p-1.5 hover:bg-slate-200/50 hover:text-slate-700 rounded-lg transition"
                  title="Chữ đậm"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => insertFormat("italic")}
                  className="p-1.5 hover:bg-slate-200/50 hover:text-slate-700 rounded-lg transition"
                  title="Chữ nghiêng"
                >
                  <Italic className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button 
                  type="button" 
                  onClick={() => insertFormat("code")}
                  className="p-1.5 hover:bg-slate-200/50 hover:text-slate-700 rounded-lg transition"
                  title="Khối mã nguồn"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <span className="h-4 w-px bg-slate-200 mx-1" />
                <button 
                  type="button" 
                  onClick={() => toast.info("Đính kèm tệp sẽ sớm khả dụng")}
                  className="p-1.5 hover:bg-slate-200/50 hover:text-slate-700 rounded-lg transition"
                  title="Đính kèm tệp"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => toast.info("Emoji picker đang được tích hợp")}
                  className="p-1.5 hover:bg-slate-200/50 hover:text-slate-700 rounded-lg transition"
                  title="Chèn emoji"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!inputMessage.trim()} 
                className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-[#FF6B00] hover:bg-[#e85f00] disabled:bg-slate-200 disabled:text-slate-455 text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
              >
                <span>Gửi tin</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
 
      {/* COLUMN 3: RIGHT SIDEBAR */}
      <div className={`w-80 bg-white border-l border-slate-200/50 flex flex-col shrink-0 transition-all duration-300 lg:flex relative z-20 ${showMobileSidebar ? "fixed inset-y-0 right-0 shadow-2xl" : "hidden lg:flex"}`}>
        {/* Tabs Switcher */}
        <div className="p-3 shrink-0 border-b border-slate-100 bg-slate-50/40">
          <div className="flex bg-slate-100/70 p-1 rounded-xl gap-1">
            <button 
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg transition-all duration-250 ${
                activeTab === "MEMBERS" 
                  ? "bg-white text-[#FF6B00] shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
              }`}
              onClick={() => setActiveTab("MEMBERS")}
            >
              <Users className="w-3.5 h-3.5" /> Thành viên ({room.memberCount})
            </button>
            <button 
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg transition-all duration-250 ${
                activeTab === "PINS" 
                  ? "bg-white text-[#FF6B00] shadow-xs" 
                  : "text-slate-555 hover:text-slate-800 hover:bg-white/30"
              }`}
              onClick={() => setActiveTab("PINS")}
            >
              <Pin className="w-3.5 h-3.5" /> Ghim ({pins.length})
            </button>
          </div>
        </div>
 
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
          {activeTab === "MEMBERS" ? (
            <div className="space-y-4">
              {isModerator && (
                <button 
                  type="button"
                  className="w-full border border-dashed border-[#FF6B00]/40 hover:border-[#FF6B00] bg-orange-50/5 hover:bg-orange-50/40 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide text-[#FF6B00] transition-all duration-200 h-9.5" 
                  onClick={() => setInviteModalOpen(true)}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Mời thành viên
                </button>
              )}
              
              <div className="space-y-1">
                {members.map(member => (
                  <div key={member.memberId} className="flex items-center justify-between p-2 hover:bg-slate-50/60 rounded-xl group transition-all duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar 
                          name={member.user?.fullName} 
                          url={member.user?.avatarUrl} 
                          className="w-8.5 h-8.5" 
                        />
                        {member.role === "OWNER" && (
                          <div className="absolute -bottom-1 -right-1 bg-amber-500 p-0.5 rounded-full ring-1 ring-white shadow-xs">
                            <ShieldAlert className="w-2.5 h-2.5 text-white"/>
                          </div>
                        )}
                        {member.role === "MODERATOR" && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 p-0.5 rounded-full ring-1 ring-white shadow-xs">
                            <Shield className="w-2.5 h-2.5 text-white"/>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-slate-700 truncate">{member.user?.fullName}</div>
                        <div className={`text-[8px] mt-0.5 font-black uppercase tracking-wider flex items-center gap-1 ${
                          member.role === "OWNER" 
                            ? "text-amber-605" 
                            : member.role === "MODERATOR" 
                            ? "text-blue-605" 
                            : "text-slate-400"
                        }`}>
                          {member.role === "OWNER" ? "Chủ phòng" : member.role === "MODERATOR" ? "Kiểm duyệt" : "Học viên"}
                        </div>
                      </div>
                    </div>
                    
                    {isModerator && member.user?.userId !== currentUserId && member.role !== "OWNER" && (
                      <button 
                        type="button" 
                        className="opacity-0 group-hover:opacity-100 h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition duration-200 border border-transparent hover:border-rose-100" 
                        onClick={() => handleKickMember(member.user?.userId || "")}
                      >
                        Trục xuất
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isModerator && (
                <button 
                  type="button"
                  className="w-full border border-dashed border-[#FF6B00]/40 hover:border-[#FF6B00] bg-orange-50/5 hover:bg-orange-50/40 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide text-[#FF6B00] transition-all duration-200 h-9.5" 
                  onClick={() => setCreatePinModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo tin ghim mới
                </button>
              )}
              
              {pins.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-slate-200/40 text-slate-400 text-xs font-semibold leading-relaxed p-4">
                  Chưa có tin nhắn nào được ghim trong phòng này
                </div>
              ) : (
                <div className="space-y-3">
                  {pins.map(pin => (
                    <div key={pin.pinId} className="relative group overflow-hidden bg-white border border-slate-200/60 p-4 rounded-xl transition-all duration-200 hover:border-slate-300 hover:shadow-xs">
                      {isModerator && (
                        <button
                          type="button"
                          onClick={() => handleDeletePin(pin.pinId)}
                          className="absolute right-2 top-2 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Gỡ ghim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <h4 className="font-bold text-xs text-slate-800 pr-6 flex items-center gap-1.5">
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" /> {pin.title}
                      </h4>
                      
                      <p className="text-[11px] leading-relaxed text-slate-500 mt-2 whitespace-pre-wrap font-normal">{pin.content}</p>
                      
                      {pin.linkUrl && (
                        <a 
                          href={pin.linkUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6B00] hover:text-[#e85f00] mt-3 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Xem tài liệu đính kèm
                        </a>
                      )}
                      
                      <div className="text-[9px] font-bold text-slate-455 mt-3.5 pt-2.5 border-t border-slate-100/70 flex items-center justify-between">
                        <span>Bởi: {pin.pinnedBy?.fullName}</span>
                        <span>{format(new Date(pin.createdAt), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
 
      {/* Close button for Mobile Sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-xs lg:hidden animate-fade-in" onClick={() => setShowMobileSidebar(false)} />
      )}
 
      {/* MODALS SECTION */}
      <AnimatePresence>
        {/* Invite Modal */}
        {inviteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border border-slate-100 relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF6B00]" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Mới thành viên</h3>
                <button type="button" onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-655 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-405 mb-1">Email người tham gia</label>
                  <Input
                    required
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)} className="rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs h-9">Hủy</Button>
                  <Button type="submit" className="rounded-xl bg-[#FF6B00] hover:bg-[#e85f00] font-semibold text-white text-xs h-9 px-5">Gửi lời mời</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
 
        {/* Create Pin Modal */}
        {createPinModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 border border-slate-100 relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF6B00]" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Ghim thông báo & tài liệu</h3>
                <button type="button" onClick={() => setCreatePinModalOpen(false)} className="text-slate-400 hover:text-slate-655 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreatePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tiêu đề *</label>
                  <Input required value={newPin.title} onChange={(e) => setNewPin({ ...newPin, title: e.target.value })} placeholder="VD: Lịch thi đấu hackathon" className="h-10 rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-[#FF6B00]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nội dung chi tiết *</label>
                  <textarea
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-850 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100"
                    rows={3}
                    value={newPin.content}
                    onChange={(e) => setNewPin({ ...newPin, content: e.target.value })}
                    placeholder="Mô tả thông báo hoặc ghi chú..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link tài liệu đính kèm (Tùy chọn)</label>
                  <Input type="url" value={newPin.linkUrl} onChange={(e) => setNewPin({ ...newPin, linkUrl: e.target.value })} placeholder="https://docs.google.com/..." className="h-10 rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-[#FF6B00]" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setCreatePinModalOpen(false)} className="rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs h-9">Hủy</Button>
                  <Button type="submit" className="rounded-xl bg-[#FF6B00] hover:bg-[#e85f00] font-semibold text-white text-xs h-9 px-5">Lưu tin ghim</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
    </div>
  );
}
