import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search, Plus, Users, Hash, Shield, Lock, ArrowLeft,
  Compass, Star, Sparkles, Calendar, Flame,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

import communityRoomService from "../../../api/community/communityRoomService";
import type { CommunityRoomResponse, CommunityRoomMode, CreateCommunityRoomRequest } from "../../../api/community/communityRoomTypes";

/* ── Room banner gradients ── */
const ROOM_PALETTES = [
  { bg: "from-[#FF6B00] to-[#FF9A3C]", light: "#FF6B00" },
  { bg: "from-violet-500 to-purple-500",  light: "#8B5CF6" },
  { bg: "from-emerald-500 to-teal-500",   light: "#10B981" },
  { bg: "from-blue-500 to-indigo-500",    light: "#3B82F6" },
  { bg: "from-rose-500 to-pink-500",      light: "#F43F5E" },
  { bg: "from-amber-500 to-orange-400",   light: "#F59E0B" },
  { bg: "from-cyan-500 to-sky-500",       light: "#06B6D4" },
];

function getRoomPalette(id: string) {
  return ROOM_PALETTES[id.charCodeAt(0) % ROOM_PALETTES.length];
}

/* ── Create Room Modal ── */
function CreateRoomModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCommunityRoomRequest>({
    name: "", description: "", mode: "PUBLIC", maxMembers: 50,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await communityRoomService.createRoom(formData);
      toast.success("Tạo phòng thành công!");
      onSuccess(); onClose();
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo phòng");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Orange accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C]" />

        <div className="px-6 pt-6 pb-2">
          <h2 className="text-[16px] font-black text-slate-900">Tạo phòng học tập mới</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Kết nối và thảo luận cùng cộng đồng SkillSprint</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Tên phòng *</label>
            <input required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Hội lập trình ReactJS"
              className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Mô tả phòng</label>
            <textarea className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10 resize-none"
              rows={3} value={formData.description || ""}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chia sẻ mục đích của phòng chat này..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Chế độ</label>
              <select value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value as CommunityRoomMode })}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#FF6B00]">
                <option value="PUBLIC">Công khai</option>
                <option value="INVITE_ONLY">Chỉ lời mời</option>
                <option value="PRIVATE">Riêng tư</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Số thành viên</label>
              <input type="number" min={2} max={500} value={formData.maxMembers}
                onChange={e => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-700 outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 pb-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="h-9 rounded-full px-5 text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="h-9 rounded-full bg-[#FF6B00] px-5 text-[12px] font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#e85f00] transition active:scale-95 disabled:opacity-50">
              {loading ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Mode badge ── */
function ModeBadge({ mode }: { mode: CommunityRoomMode }) {
  const config = {
    PUBLIC:      { label: "Công khai",  icon: Hash,   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    INVITE_ONLY: { label: "Chỉ mời",   icon: Shield, cls: "bg-amber-100 text-amber-700 border-amber-200" },
    PRIVATE:     { label: "Riêng tư",  icon: Lock,   cls: "bg-slate-100 text-slate-600 border-slate-200" },
  }[mode];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.cls}`}>
      <Icon className="h-2.5 w-2.5" /> {config.label}
    </span>
  );
}

/* ── Room Card ── */
function RoomCard({ room, onJoin }: { room: CommunityRoomResponse; onJoin: (id: string) => void }) {
  const pal = getRoomPalette(room.roomId);
  const initials = room.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const memberPct = Math.min(100, (room.memberCount / room.maxMembers) * 100);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Banner */}
      <div className={`relative h-28 bg-gradient-to-br ${pal.bg} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }} />
        {/* Overlay text */}
        <div className="absolute bottom-3 left-4 flex items-end gap-3">
          {/* Server icon */}
          <div className={`h-12 w-12 rounded-2xl border-[3px] border-white bg-gradient-to-br ${pal.bg} flex items-center justify-center text-[16px] font-black text-white shadow-lg`}>
            {initials}
          </div>
          <div className="pb-0.5">
            <h3 className="text-[14px] font-black text-white drop-shadow line-clamp-1" title={room.name}>{room.name}</h3>
            <div className="mt-0.5"><ModeBadge mode={room.mode} /></div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-3 min-h-[36px]">
          {room.description || "Không có mô tả chi tiết cho phòng cộng đồng này."}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {room.memberCount}/{room.maxMembers}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(room.createdAt), "dd/MM/yy")}</span>
        </div>

        {/* Member progress */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
          <div className={`h-full rounded-full bg-gradient-to-r ${pal.bg} transition-all duration-500`}
            style={{ width: `${memberPct}%` }} />
        </div>

        {/* CTA */}
        {room.joined ? (
          <Link to={`/app/community/rooms/${room.roomId}`} className="block">
            <button type="button"
              className={`w-full h-9 rounded-xl bg-gradient-to-r ${pal.bg} text-[12px] font-bold text-white shadow-sm hover:opacity-90 transition active:scale-95`}>
              Vào phòng chat
            </button>
          </Link>
        ) : room.banned ? (
          <button disabled type="button" className="w-full h-9 rounded-xl bg-slate-100 text-[12px] font-bold text-slate-400 cursor-not-allowed">Đã bị cấm</button>
        ) : room.status === "LOCKED" ? (
          <button disabled type="button" className="w-full h-9 rounded-xl bg-slate-100 text-[12px] font-bold text-slate-400 cursor-not-allowed">Đã khóa</button>
        ) : room.mode === "INVITE_ONLY" ? (
          <button disabled type="button" className="w-full h-9 rounded-xl bg-slate-100 text-[12px] font-bold text-slate-400 cursor-not-allowed">Cần lời mời</button>
        ) : (
          <button type="button" onClick={() => onJoin(room.roomId)}
            className="w-full h-9 rounded-xl border border-[#FF6B00]/30 bg-orange-50 text-[12px] font-bold text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-all duration-200 active:scale-95">
            Tham gia phòng
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function CommunityRooms() {
  const [activeTab, setActiveTab] = useState<"MY_ROOMS" | "DISCOVER">("MY_ROOMS");
  const [rooms, setRooms] = useState<CommunityRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
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
      if (activeTab === "MY_ROOMS") { res = await communityRoomService.getMyRooms(currentPage, 12); }
      else { res = await communityRoomService.discoverRooms(currentPage, 12, modeFilter || undefined, search || undefined); }
      if (isLoadMore) { setRooms(prev => [...prev, ...res.items]); } else { setRooms(res.items); }
      setPage(res.page); setHasMore(!res.last);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải danh sách phòng");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [activeTab, modeFilter]);
  useEffect(() => { const d = setTimeout(() => fetchRooms(), 500); return () => clearTimeout(d); }, [search]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await communityRoomService.joinRoom(roomId);
      toast.success("Đã tham gia phòng");
      navigate(`/app/community/rooms/${roomId}`);
    } catch (err: any) {
      toast.error(err.message || "Không thể tham gia phòng");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/app/community")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-sm transition">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-[18px] font-black text-slate-900">
                Phòng học tập <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C] bg-clip-text text-transparent">Cộng đồng</span>
              </h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Thảo luận trực tiếp & trao đổi tài liệu thời gian thực</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#FF6B00] px-5 text-[12px] font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#e85f00] transition active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Tạo phòng mới
          </button>
        </div>

        {/* Tabs + Filters */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shrink-0">
            {[
              { key: "MY_ROOMS" as const, label: "Phòng của tôi", icon: Star },
              { key: "DISCOVER" as const, label: "Khám phá phòng", icon: Compass },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold transition-all ${
                  activeTab === key ? "bg-[#FF6B00] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {activeTab === "DISCOVER" && (
            <div className="flex gap-2 w-full max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input placeholder="Tìm kiếm phòng..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[12px] font-medium outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10"
                />
              </div>
              <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
                className="h-9 w-36 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 outline-none focus:border-[#FF6B00]">
                <option value="">Tất cả</option>
                <option value="PUBLIC">Công khai</option>
                <option value="INVITE_ONLY">Chỉ mời</option>
              </select>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading && rooms.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-2xl border border-slate-200/80 bg-white animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Compass className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-700">Không tìm thấy phòng nào</h3>
            <p className="text-[12px] text-slate-400 mt-1 mb-5">
              {activeTab === "MY_ROOMS" ? "Bạn chưa tham gia phòng nào." : "Thử thay đổi từ khóa tìm kiếm."}
            </p>
            {activeTab === "MY_ROOMS" && (
              <button type="button" onClick={() => setActiveTab("DISCOVER")}
                className="h-9 rounded-full border border-slate-200 px-5 text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition">
                Khám phá phòng mới
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {rooms.map(room => <RoomCard key={room.roomId} room={room} onJoin={handleJoinRoom} />)}
              </AnimatePresence>
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => fetchRooms(true)} disabled={loading}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-[12px] font-bold text-slate-600 hover:border-[#FF6B00] hover:text-[#FF6B00] transition disabled:opacity-50 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {loading ? "Đang tải..." : "Tải thêm phòng"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onSuccess={() => { setActiveTab("MY_ROOMS"); fetchRooms(); }} />
    </div>
  );
}
