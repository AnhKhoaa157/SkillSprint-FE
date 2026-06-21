import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Send, Users, Pin, MoreVertical, ArrowLeft, Loader2, ArrowUp, ArrowDown, UserPlus, Flag, Shield, Lock, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

import communityRoomService from "../../../api/community/communityRoomService";
import { useCommunityChatSocket } from "../../hooks/useCommunityChatSocket";
import type { 
  CommunityRoomResponse, 
  CommunityRoomMemberResponse, 
  CommunityPinResponse,
  CommunityChatMessageResponse 
} from "../../../api/community/communityRoomTypes";
import { getStoredAuthSession } from "../../../api/auth/authService";

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
  
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  
  // Right sidebar state
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "PINS">("MEMBERS");

  const { connected, error, messages, sendMessage, setInitialMessages } = useCommunityChatSocket(roomId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const [createPinModalOpen, setCreatePinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState({ title: "", content: "", linkUrl: "" });

  useEffect(() => {
    if (!roomId) return;
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const [roomData, msgHistory, membersData, pinsData] = await Promise.all([
        communityRoomService.getRoom(roomId!),
        communityRoomService.getMessageHistory(roomId!, 0, 50),
        communityRoomService.getMembers(roomId!, 0, 100), // Get first 100 members
        communityRoomService.getPins(roomId!),
      ]);

      setRoom(roomData);
      setInitialMessages(msgHistory.items);
      setMembers(membersData.items);
      setPins(pinsData);
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
      toast.success("Đã gửi lời mời");
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
      toast.success("Đã ghim thành công");
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
    if (!confirm("Bạn có chắc chắn muốn xóa ghim này?")) return;
    try {
      await communityRoomService.deletePin(roomId!, pinId);
      toast.success("Xóa ghim thành công");
      setPins(pins.filter(p => p.pinId !== pinId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa ghim");
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!confirm("Kick thành viên này khỏi phòng?")) return;
    try {
      await communityRoomService.kickMember(roomId!, memberId);
      toast.success("Kick thành công");
      setMembers(members.filter(m => m.user?.userId !== memberId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi kick");
    }
  };

  if (loading || !room) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isModerator = room.myRole === "OWNER" || room.myRole === "MODERATOR";

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-white border-r border-slate-200 shadow-sm relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/community/rooms")} className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {room.name}
                {room.mode === "PRIVATE" && <Lock className="w-4 h-4 text-slate-400" />}
                {room.mode === "INVITE_ONLY" && <Shield className="w-4 h-4 text-slate-400" />}
              </h2>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/> {room.memberCount} thành viên</span>
                {error ? (
                  <span className="text-red-500 text-xs">Lỗi: {error}</span>
                ) : connected ? (
                  <span className="text-emerald-500 text-xs">Đã kết nối</span>
                ) : (
                  <span className="text-orange-500 text-xs">Đang kết nối...</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Right Sidebar Toggle */}
          <div className="lg:hidden flex gap-2">
            <Button variant={activeTab === "MEMBERS" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("MEMBERS")}>
              <Users className="w-4 h-4" />
            </Button>
            <Button variant={activeTab === "PINS" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("PINS")}>
              <Pin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {messages.map((msg, idx) => {
            const isMe = msg.sender?.userId === currentUserId;
            const isHidden = msg.hidden;
            
            return (
              <div key={msg.messageId || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <img
                    src={msg.sender?.avatarUrl || "/default-avatar.png"}
                    alt={msg.sender?.fullName || "User"}
                    className="w-8 h-8 rounded-full shrink-0 object-cover border border-slate-200"
                  />
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{msg.sender?.fullName || "Người dùng"}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(msg.sentAt), "HH:mm")}</span>
                    </div>
                    
                    <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      isHidden ? "bg-slate-200 text-slate-500 italic line-through" :
                      isMe ? "bg-orange-500 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                    }`}>
                      {isHidden ? "Tin nhắn đã bị ẩn" : msg.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-50 border-slate-200 rounded-full px-5"
              disabled={!connected}
            />
            <Button type="submit" disabled={!inputMessage.trim() || !connected} className="rounded-full w-10 h-10 p-0 bg-orange-500 hover:bg-orange-600">
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Sidebar (Desktop only or toggled on Mobile) */}
      <div className="w-80 bg-white flex flex-col shrink-0 lg:flex">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === "MEMBERS" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            onClick={() => setActiveTab("MEMBERS")}
          >
            <Users className="w-4 h-4" /> Thành viên ({room.memberCount})
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === "PINS" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            onClick={() => setActiveTab("PINS")}
          >
            <Pin className="w-4 h-4" /> Ghim ({pins.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "MEMBERS" ? (
            <div className="space-y-4">
              {isModerator && (
                <Button variant="outline" className="w-full border-dashed flex gap-2" onClick={() => setInviteModalOpen(true)}>
                  <UserPlus className="w-4 h-4" /> Mời thêm thành viên
                </Button>
              )}
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.memberId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={member.user?.avatarUrl || "/default-avatar.png"} alt={member.user?.fullName || ""} className="w-8 h-8 rounded-full border border-slate-200" />
                        {member.role === "OWNER" && <div className="absolute -bottom-1 -right-1 bg-amber-500 p-0.5 rounded-full"><ShieldAlert className="w-2.5 h-2.5 text-white"/></div>}
                        {member.role === "MODERATOR" && <div className="absolute -bottom-1 -right-1 bg-blue-500 p-0.5 rounded-full"><Shield className="w-2.5 h-2.5 text-white"/></div>}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{member.user?.fullName}</div>
                        <div className="text-xs text-slate-500">{member.role}</div>
                      </div>
                    </div>
                    {isModerator && member.user?.userId !== currentUserId && member.role !== "OWNER" && (
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleKickMember(member.user?.userId || "")}>
                        Kick
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isModerator && (
                <Button variant="outline" className="w-full border-dashed flex gap-2" onClick={() => setCreatePinModalOpen(true)}>
                  <Pin className="w-4 h-4" /> Thêm ghim mới
                </Button>
              )}
              {pins.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Chưa có tin nhắn ghim</div>
              ) : (
                <div className="space-y-3">
                  {pins.map(pin => (
                    <div key={pin.pinId} className="bg-amber-50 border border-amber-100 p-3 rounded-lg relative group">
                      {isModerator && (
                        <button onClick={() => handleDeletePin(pin.pinId)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          &times;
                        </button>
                      )}
                      <h4 className="font-semibold text-sm text-slate-800 pr-4">{pin.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{pin.content}</p>
                      {pin.linkUrl && (
                        <a href={pin.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-600 hover:underline mt-2 inline-block">Xem đính kèm</a>
                      )}
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        <span>Bởi {pin.pinnedBy?.fullName}</span>
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

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Mời thành viên</h2>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email người được mời</label>
                <Input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Gửi lời mời</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Pin Modal */}
      {createPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Ghim tin nhắn</h2>
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề *</label>
                <Input required value={newPin.title} onChange={(e) => setNewPin({ ...newPin, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung *</label>
                <textarea
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  value={newPin.content}
                  onChange={(e) => setNewPin({ ...newPin, content: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link đính kèm (Tuỳ chọn)</label>
                <Input type="url" value={newPin.linkUrl} onChange={(e) => setNewPin({ ...newPin, linkUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setCreatePinModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Lưu Pin</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
