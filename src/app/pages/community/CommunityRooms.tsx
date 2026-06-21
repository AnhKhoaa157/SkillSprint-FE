import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Plus, Users, Hash, Shield, MessageSquare, Lock, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import communityRoomService from "../../../api/community/communityRoomService";
import type { CommunityRoomResponse, CommunityRoomMode, CreateCommunityRoomRequest } from "../../../api/community/communityRoomTypes";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Tạo phòng cộng đồng</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên phòng *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Hội lập trình web"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về phòng..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chế độ</label>
              <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value as CommunityRoomMode })}
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="INVITE_ONLY">Chỉ mời</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thành viên tối đa</label>
              <Input
                type="number"
                min={2}
                max={500}
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? "Đang tạo..." : "Tạo phòng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CommunityRooms() {
  const [activeTab, setActiveTab] = useState<"MY_ROOMS" | "DISCOVER">("MY_ROOMS");
  const [rooms, setRooms] = useState<CommunityRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

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

  const ModeBadge = ({ mode }: { mode: CommunityRoomMode }) => {
    switch (mode) {
      case "PUBLIC":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full"><Hash className="w-3 h-3"/> Công khai</span>;
      case "INVITE_ONLY":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full"><Shield className="w-3 h-3"/> Chỉ mời</span>;
      case "PRIVATE":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-full"><Lock className="w-3 h-3"/> Riêng tư</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/community")} className="text-slate-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Phòng Cộng Đồng</h1>
            <p className="text-slate-500">Tham gia các phòng chat để trao đổi, học hỏi cùng mọi người</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Tạo phòng mới
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab("MY_ROOMS")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "MY_ROOMS" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Phòng của tôi
          </button>
          <button
            onClick={() => setActiveTab("DISCOVER")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "DISCOVER" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Khám phá
          </button>
        </div>

        {activeTab === "DISCOVER" && (
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm phòng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="w-40 h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Tất cả chế độ</option>
              <option value="PUBLIC">Công khai</option>
              <option value="INVITE_ONLY">Chỉ mời</option>
            </select>
          </div>
        )}
      </div>

      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Không tìm thấy phòng nào</h3>
          <p className="text-slate-500 mt-1 mb-6">
            {activeTab === "MY_ROOMS" ? "Bạn chưa tham gia phòng nào." : "Thử thay đổi bộ lọc tìm kiếm."}
          </p>
          {activeTab === "MY_ROOMS" && (
            <Button variant="outline" onClick={() => setActiveTab("DISCOVER")}>
              Khám phá phòng mới
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.roomId} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1" title={room.name}>{room.name}</h3>
                  <ModeBadge mode={room.mode} />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
                  {room.description || "Không có mô tả."}
                </p>
                <div className="flex items-center text-xs text-slate-500 mb-5 gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.memberCount} / {room.maxMembers}
                  </span>
                  <span>Tạo ngày: {format(new Date(room.createdAt), "dd/MM/yyyy")}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100">
                  {room.joined ? (
                    <Link to={`/app/community/rooms/${room.roomId}`} className="block">
                      <Button variant="outline" className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                        Vào phòng chat
                      </Button>
                    </Link>
                  ) : room.banned ? (
                    <Button disabled className="w-full bg-slate-100 text-slate-500">
                      Đã bị cấm
                    </Button>
                  ) : room.status === "LOCKED" ? (
                    <Button disabled className="w-full bg-slate-100 text-slate-500">
                      Đã khóa
                    </Button>
                  ) : room.mode === "INVITE_ONLY" ? (
                    <Button variant="outline" disabled className="w-full">
                      Cần lời mời
                    </Button>
                  ) : (
                    <Button onClick={() => handleJoinRoom(room.roomId)} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                      Tham gia
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => fetchRooms(true)} disabled={loading}>
                {loading ? "Đang tải..." : "Tải thêm"}
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
