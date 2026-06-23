import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search, Plus, Users, Hash, Shield, MessageSquare, Lock, ArrowLeft,
  Compass, Star, Sparkles, Calendar, CalendarDays, Flame, MailCheck, X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

import communityRoomService from "../../../api/community/communityRoomService";
import { getCurrentSubscription } from "../../../api/billing/subscriptionsService";
import type {
  CommunityRoomResponse,
  CommunityRoomMode,
  CommunityRoomInviteResponse,
  CreateCommunityRoomRequest
} from "../../../api/community/communityRoomTypes";

const UPGRADE_REQUIRED_MESSAGE = "Vui lòng nâng cấp gói để sử dụng tính năng này";
const UPGRADE_REQUIRED_TOAST_ID = "community-rooms-upgrade-required";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isUpgradeRequiredError(error: unknown): boolean {
  const maybeError = error as { status?: number; response?: { status?: number }; message?: string };
  const status = maybeError?.status ?? maybeError?.response?.status;
  const message = String(maybeError?.message ?? "").toLowerCase();

  return (
    status === 402 ||
    status === 403 ||
    message.includes("nâng cấp") ||
    message.includes("nang cap") ||
    message.includes("upgrade")
  );
}

function showCommunityRoomsError(error: unknown, fallback: string): void {
  if (isUpgradeRequiredError(error)) {
    toast.error(UPGRADE_REQUIRED_MESSAGE, { id: UPGRADE_REQUIRED_TOAST_ID });
    return;
  }

  toast.error(getErrorMessage(error, fallback));
}

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
      showCommunityRoomsError(err, "Không thể tạo phòng");
    } finally { setLoading(false); }
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
      <div className={`relative h-28 bg-gradient-to-br ${pal.bg} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div className="absolute bottom-3 left-4 flex items-end gap-3">
          <div className={`h-12 w-12 rounded-2xl border-[3px] border-white bg-gradient-to-br ${pal.bg} flex items-center justify-center text-[16px] font-black text-white shadow-lg`}>
            {initials}
          </div>
          <div className="pb-0.5">
            <h3 className="text-[14px] font-black text-white drop-shadow line-clamp-1" title={room.name}>{room.name}</h3>
            <div className="mt-0.5"><ModeBadge mode={room.mode} /></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-3 min-h-[36px]">
          {room.description || "Không có mô tả chi tiết cho phòng cộng đồng này."}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {room.memberCount}/{room.maxMembers}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(room.createdAt), "dd/MM/yy")}</span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
          <div className={`h-full rounded-full bg-gradient-to-r ${pal.bg} transition-all duration-500`}
            style={{ width: `${memberPct}%` }} />
        </div>

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
  const [pendingInvites, setPendingInvites] = useState<CommunityRoomInviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const didMountSearchEffect = useRef(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getCurrentSubscription()
      .then((subscription) => {
        if (!active) return;
        const free = subscription.plan?.planType === "FREE";
        setIsFreePlan(free);
        if (free) {
          setRooms([]);
          setPendingInvites([]);
          setHasMore(false);
          setLoading(false);
          toast.error(UPGRADE_REQUIRED_MESSAGE, { id: UPGRADE_REQUIRED_TOAST_ID });
        }
      })
      .catch(() => {
        if (active) setIsFreePlan(false);
      })
      .finally(() => {
        if (active) setSubscriptionChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const res = await communityRoomService.getMyInvites(0, 20);
      setPendingInvites(res.items.filter((invite) => invite.status === "PENDING"));
    } catch (err: any) {
      showCommunityRoomsError(err, "Không thể tải lời mời phòng");
    } finally {
      setInvitesLoading(false);
    }
  };

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
      if (!isLoadMore) setRooms([]);
      setHasMore(false);
      showCommunityRoomsError(err, "Lỗi tải danh sách phòng");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!subscriptionChecked || isFreePlan) return;
    fetchRooms();
    if (activeTab === "MY_ROOMS") {
      fetchInvites();
    }
  }, [activeTab, modeFilter, subscriptionChecked, isFreePlan]);

  useEffect(() => {
    if (!didMountSearchEffect.current) {
      didMountSearchEffect.current = true;
      return;
    }
    if (!subscriptionChecked || isFreePlan || activeTab !== "DISCOVER") return;

    const delay = setTimeout(() => {
      fetchRooms();
    }, 500);
    return () => clearTimeout(delay);
  }, [activeTab, search, subscriptionChecked, isFreePlan]);

  const handleJoinRoom = async (roomId: string) => {
    if (isFreePlan) {
      toast.error(UPGRADE_REQUIRED_MESSAGE, { id: UPGRADE_REQUIRED_TOAST_ID });
      return;
    }

    try {
      await communityRoomService.joinRoom(roomId);
      toast.success("Đã tham gia phòng");
      navigate(`/app/community/rooms/${roomId}`);
    } catch (err: any) {
      showCommunityRoomsError(err, "Không thể tham gia phòng");
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
      showCommunityRoomsError(err, "Không thể chấp nhận lời mời");
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
      showCommunityRoomsError(err, "Không thể từ chối lời mời");
    } finally {
      setInviteActionId(null);
    }
  };

  if (subscriptionChecked && isFreePlan) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Phòng cộng đồng dành cho gói nâng cấp</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
            Vui lòng nâng cấp gói để tạo phòng, tham gia phòng và sử dụng chat realtime.
          </p>
          <Button onClick={() => navigate("/app/community")} className="mt-5 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800">
            Quay lại bảng tin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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

      {activeTab === "MY_ROOMS" && (invitesLoading || pendingInvites.length > 0) && (
        <section className="mb-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <MailCheck className="w-5 h-5" />
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
