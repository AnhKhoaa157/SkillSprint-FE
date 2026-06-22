import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Plus, Users, Hash, Shield, MessageSquare, Lock, ArrowLeft, CalendarDays, MailCheck, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import communityRoomService from "../../../api/community/communityRoomService";
import type {
  CommunityRoomResponse,
  CommunityRoomMode,
  CommunityRoomInviteResponse,
  CreateCommunityRoomRequest
} from "../../../api/community/communityRoomTypes";

// Thêm Modal Dialog đơn giản (dùng HTML native dialog hoặc custom)
// Tạm dùng div overlay cho Modal
function CreateRoomModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCommunityRoomRequest>({
    name: "",
    description: "",
    mode: "PUBLIC",
    maxMembers: 50,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await communityRoomService.createRoom(formData);
      toast.success("Tạo phòng thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo phòng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Tạo phòng cộng đồng</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên phòng <span className="text-rose-500">*</span></label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Hội lập trình web"
                className="h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                rows={3}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về phòng..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chế độ</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as CommunityRoomMode })}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer transition-all"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="INVITE_ONLY">Chỉ mời</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thành viên tối đa</label>
                <Input
                  type="number"
                  min={2}
                  max={500}
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
                  className="h-11 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-medium hover:bg-slate-100">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl shadow-md shadow-orange-500/20 font-semibold px-6">
                {loading ? "Đang tạo..." : "Tạo phòng"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CommunityRooms() {
  const [activeTab, setActiveTab] = useState<"MY_ROOMS" | "DISCOVER">("MY_ROOMS");
  const [rooms, setRooms] = useState<CommunityRoomResponse[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CommunityRoomInviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const res = await communityRoomService.getMyInvites(0, 20);
      setPendingInvites(res.items.filter((invite) => invite.status === "PENDING"));
    } catch (err: any) {
      toast.error(err.message || "Không thể tải lời mời phòng");
    } finally {
      setInvitesLoading(false);
    }
  };

  const fetchRooms = async (isLoadMore = false) => {
    try {
      const currentPage = isLoadMore ? page + 1 : 0;
      setLoading(!isLoadMore);
      
      let res;
      if (activeTab === "MY_ROOMS") {
        res = await communityRoomService.getMyRooms(currentPage, 12);
      } else {
        res = await communityRoomService.discoverRooms(currentPage, 12, modeFilter || undefined, search || undefined);
      }

      if (isLoadMore) {
        setRooms((prev) => [...prev, ...res.items]);
      } else {
        setRooms(res.items);
      }
      setPage(res.page);
      setHasMore(!res.last);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    if (activeTab === "MY_ROOMS") {
      fetchInvites();
    }
  }, [activeTab, modeFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchRooms();
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await communityRoomService.joinRoom(roomId);
      toast.success("Đã tham gia phòng");
      navigate(`/app/community/rooms/${roomId}`);
    } catch (err: any) {
      toast.error(err.message || "Không thể tham gia phòng");
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      setInviteActionId(inviteId);
      const acceptedRoom = await communityRoomService.acceptInvite(inviteId);
      toast.success("Đã chấp nhận lời mời");
      setPendingInvites((prev) => prev.filter((invite) => invite.inviteId !== inviteId));
      window.dispatchEvent(new Event("community-room-invites-changed"));
      navigate(`/app/community/rooms/${acceptedRoom.roomId}`);
    } catch (err: any) {
      toast.error(err.message || "Không thể chấp nhận lời mời");
    } finally {
      setInviteActionId(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setInviteActionId(inviteId);
      await communityRoomService.declineInvite(inviteId);
      toast.success("Đã từ chối lời mời");
      setPendingInvites((prev) => prev.filter((invite) => invite.inviteId !== inviteId));
      window.dispatchEvent(new Event("community-room-invites-changed"));
    } catch (err: any) {
      toast.error(err.message || "Không thể từ chối lời mời");
    } finally {
      setInviteActionId(null);
    }
  };

  const ModeBadge = ({ mode }: { mode: CommunityRoomMode }) => {
    switch (mode) {
      case "PUBLIC":
        return <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full"><Hash className="w-3 h-3"/> Công khai</span>;
      case "INVITE_ONLY":
        return <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full"><Shield className="w-3 h-3"/> Chỉ mời</span>;
      case "PRIVATE":
        return <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"><Lock className="w-3 h-3"/> Riêng tư</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/community")} className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Phòng Cộng Đồng</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Khám phá và tham gia các không gian học tập chung</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0 shadow-lg shadow-orange-500/25 rounded-full px-6 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/40">
          <Plus className="w-4 h-4 mr-2" /> Tạo phòng mới
        </Button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur rounded-2xl shrink-0 border border-slate-200/50">
          <button
            onClick={() => setActiveTab("MY_ROOMS")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === "MY_ROOMS" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            Phòng của tôi
          </button>
          <button
            onClick={() => setActiveTab("DISCOVER")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === "DISCOVER" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            Khám phá
          </button>
        </div>

        {activeTab === "DISCOVER" && (
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="Tìm kiếm phòng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-white border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
              />
            </div>
            <select 
              value={modeFilter} 
              onChange={(e) => setModeFilter(e.target.value)} 
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer min-w-[140px]"
            >
              <option value="">Tất cả chế độ</option>
              <option value="PUBLIC">Công khai</option>
              <option value="INVITE_ONLY">Chỉ mời</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === "MY_ROOMS" && (invitesLoading || pendingInvites.length > 0) && (
        <section className="mb-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <MailCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Lời mời vào phòng</h2>
                <p className="text-sm font-medium text-slate-500">Các phòng đang chờ bạn xác nhận tham gia.</p>
              </div>
            </div>
            {pendingInvites.length > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                {pendingInvites.length} lời mời
              </span>
            )}
          </div>

          {invitesLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[0, 1].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pendingInvites.map((invite) => {
                const isBusy = inviteActionId === invite.inviteId;

                return (
                  <div key={invite.inviteId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900" title={invite.roomName}>
                          {invite.roomName}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Mời bởi {invite.inviter?.fullName || "thành viên SkillSprint"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Hết hạn {format(new Date(invite.expiresAt), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                      <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={Boolean(inviteActionId)}
                        onClick={() => handleDeclineInvite(invite.inviteId)}
                        className="h-9 rounded-xl text-slate-600 hover:bg-white"
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Từ chối
                      </Button>
                      <Button
                        type="button"
                        disabled={Boolean(inviteActionId)}
                        onClick={() => handleAcceptInvite(invite.inviteId)}
                        className="h-9 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                      >
                        {isBusy ? "Đang xử lý..." : "Chấp nhận"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Content */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-100 animate-pulse rounded-2xl border border-slate-200/50" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Không tìm thấy phòng nào</h3>
          <p className="text-slate-500 mt-2 mb-8 max-w-sm">
            {activeTab === "MY_ROOMS" ? "Bạn chưa tham gia phòng cộng đồng nào. Hãy khám phá và tìm phòng phù hợp nhé!" : "Không có phòng nào khớp với tìm kiếm của bạn. Thử thay đổi từ khóa."}
          </p>
          {activeTab === "MY_ROOMS" && (
            <Button onClick={() => setActiveTab("DISCOVER")} className="bg-slate-900 text-white rounded-full px-6 hover:bg-slate-800 shadow-md">
              Khám phá ngay
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.roomId} className="group bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 flex flex-col relative overflow-hidden">
                {/* Subtle background decor glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-100/40 to-rose-100/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 leading-tight group-hover:text-orange-600 transition-colors" title={room.name}>
                      {room.name}
                    </h3>
                    <div className="shrink-0">
                      <ModeBadge mode={room.mode} />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1">
                    {room.description || <span className="italic text-slate-400">Không có mô tả.</span>}
                  </p>
                  
                  <div className="flex items-center text-[13px] font-medium text-slate-500 mb-6 gap-5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="flex items-center gap-1.5" title="Số thành viên">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-slate-700">{room.memberCount}</span> / {room.maxMembers}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1.5" title="Ngày tạo">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      {format(new Date(room.createdAt), "dd/MM/yyyy")}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    {room.joined ? (
                      <Link to={`/app/community/rooms/${room.roomId}`} className="block">
                        <Button variant="outline" className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 rounded-xl font-bold h-11 transition-all">
                          Vào phòng chat
                        </Button>
                      </Link>
                    ) : room.banned ? (
                      <Button disabled className="w-full bg-slate-100 text-slate-400 rounded-xl font-semibold h-11">
                        <Shield className="w-4 h-4 mr-2" /> Đã bị cấm
                      </Button>
                    ) : room.status === "LOCKED" ? (
                      <Button disabled className="w-full bg-slate-100 text-slate-400 rounded-xl font-semibold h-11">
                        <Lock className="w-4 h-4 mr-2" /> Đã khóa
                      </Button>
                    ) : room.mode === "INVITE_ONLY" ? (
                      <Button variant="outline" disabled className="w-full rounded-xl font-semibold h-11 text-slate-500">
                        Cần lời mời
                      </Button>
                    ) : (
                      <Button onClick={() => handleJoinRoom(room.roomId)} className="w-full bg-slate-900 text-white hover:bg-orange-500 rounded-xl font-bold h-11 transition-colors duration-300 shadow-md">
                        Tham gia ngay
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-10 text-center">
              <Button variant="outline" onClick={() => fetchRooms(true)} disabled={loading} className="rounded-full px-8 font-medium hover:bg-slate-50">
                {loading ? "Đang tải..." : "Tải thêm phòng"}
              </Button>
            </div>
          )}
        </>
      )}

      <CreateRoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setActiveTab("MY_ROOMS");
          fetchRooms();
        }} 
      />
    </div>
  );
}
