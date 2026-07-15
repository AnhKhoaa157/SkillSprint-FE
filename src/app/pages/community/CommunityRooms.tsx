import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search, Plus, Users, Hash, Shield, MessageSquare, Lock, ArrowLeft,
  Sparkles, Calendar, MailCheck, X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

import communityRoomService from "../../../api/community/communityRoomService";
import { useSubscription } from "../../../hooks/useSubscription";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[2rem] border border-white bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:rounded-[2rem]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-orange-50/90 via-white to-white px-6 py-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-orange-100/70 blur-3xl" />
          <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
          <div className="relative flex items-center gap-3 pr-10">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-orange-200 bg-white text-[#FF6B00] shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div><h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">Tạo phòng cộng đồng</h2><p className="mt-1 text-xs text-slate-500">Thiết lập không gian học tập mới cho cộng đồng.</p></div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên phòng <span className="text-rose-500">*</span></label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Hội lập trình web"
                className="h-11 rounded-xl border-slate-200 bg-[#F8F9FA] font-semibold focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 bg-[#F8F9FA] px-4 py-3 text-sm transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
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
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-[#F8F9FA] px-3 text-sm font-semibold transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
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
                  className="h-11 rounded-xl border-slate-200 bg-[#F8F9FA] font-semibold focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
            <div className="-mx-6 -mb-6 mt-7 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold hover:bg-slate-100">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="h-10 rounded-xl bg-[#FF6B00] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,107,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] active:translate-y-0">
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
  const initials = room.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const memberPct = Math.min(100, (room.memberCount / room.maxMembers) * 100);

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(71,50,35,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:shadow-[0_24px_55px_rgba(71,50,35,0.09)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-100/65 blur-3xl transition duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#F5C5AF] bg-[#FFF0E8] text-sm font-black text-[#C84E20] shadow-[0_9px_22px_rgba(216,94,42,0.12)]">{initials || "SS"}</div>
        <ModeBadge mode={room.mode} />
      </div>

      <div className="relative mt-5 flex flex-1 flex-col">
        <h3 className="line-clamp-1 text-lg font-black tracking-[-0.02em] text-slate-950 transition group-hover:text-[#E85F00]" title={room.name}>{room.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-[40px] flex-1 text-[12px] leading-5 text-slate-500">
          {room.description || "Không có mô tả chi tiết cho phòng cộng đồng này."}
        </p>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-[#F8F9FA] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#FF6B00]" /> <b className="text-slate-800">{room.memberCount}</b> / {room.maxMembers}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {format(new Date(room.createdAt), "dd/MM/yyyy")}</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div className="h-full rounded-full bg-[#FF6B00] transition-all duration-500" style={{ width: `${memberPct}%` }} />
          </div>
        </div>

        <div className="mt-4">
        {room.joined ? (
          <Link to={`/app/community/rooms/${room.roomId}`} className="block">
            <button type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E45F2A] text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(228,95,42,0.19)] transition hover:bg-[#CF4F1F] active:scale-[0.98]">
              <MessageSquare className="h-4 w-4" /> Vào phòng chat
            </button>
          </Link>
        ) : room.banned ? (
          <button disabled type="button" className="h-11 w-full cursor-not-allowed rounded-xl bg-slate-100 text-[12px] font-bold text-slate-400">Đã bị cấm</button>
        ) : room.status === "LOCKED" ? (
          <button disabled type="button" className="h-11 w-full cursor-not-allowed rounded-xl bg-slate-100 text-[12px] font-bold text-slate-400">Đã khóa</button>
        ) : room.mode === "INVITE_ONLY" ? (
          <button disabled type="button" className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-500">Cần lời mời</button>
        ) : (
          <button type="button" onClick={() => onJoin(room.roomId)}
            className="h-11 w-full rounded-xl bg-[#FF6B00] text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(255,107,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] active:translate-y-0 active:scale-[0.98]">
            Tham gia phòng
          </button>
        )}
        </div>
      </div>
    </motion.article>
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
  const { planId, loading: subscriptionLoading } = useSubscription();
  const isFreePlan = planId === "FREE";
  const subscriptionChecked = !subscriptionLoading;
  const navigate = useNavigate();

  useEffect(() => {
    if (subscriptionChecked && isFreePlan) {
      setRooms([]);
      setPendingInvites([]);
      setHasMore(false);
      setLoading(false);
      toast.error(UPGRADE_REQUIRED_MESSAGE, { id: UPGRADE_REQUIRED_TOAST_ID });
    }
  }, [subscriptionChecked, isFreePlan]);

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
    <div className="relative isolate mx-auto min-h-screen max-w-7xl overflow-hidden rounded-[2rem] bg-[#F7F7F5] px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_0%,rgba(255,237,223,0.85),transparent_28%),radial-gradient(circle_at_92%_22%,rgba(255,246,234,0.78),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:radial-gradient(rgba(255,107,0,0.16)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_48%)]" />
      <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_22px_65px_rgba(71,50,35,0.07)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/community")} className="mt-0.5 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6B00]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-[#FF6B00]"><Sparkles className="h-3 w-3" />Không gian học tập</div>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">Phòng Cộng Đồng</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Tìm bạn đồng hành, trao đổi kiến thức và học cùng nhau theo thời gian thực.</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-11 rounded-xl border-0 bg-[#FF6B00] px-5 text-white shadow-[0_10px_24px_rgba(255,107,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E85F00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.22)] active:translate-y-0">
          <Plus className="mr-2 h-4 w-4" /> Tạo phòng mới
        </Button>
        </div>
      </section>

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

      <section className="mb-7 rounded-[1.75rem] border border-white bg-white/80 p-3 shadow-[0_16px_45px_rgba(71,50,35,0.055)] backdrop-blur-xl sm:p-4">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div className="flex shrink-0 rounded-2xl bg-slate-100/80 p-1.5">
          <button
            onClick={() => setActiveTab("MY_ROOMS")}
            className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${activeTab === "MY_ROOMS" ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200/60" : "text-slate-500 hover:bg-white/60 hover:text-slate-900"}`}
          >
            Phòng của tôi
          </button>
          <button
            onClick={() => setActiveTab("DISCOVER")}
            className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${activeTab === "DISCOVER" ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200/60" : "text-slate-500 hover:bg-white/60 hover:text-slate-900"}`}
          >
            Khám phá
          </button>
        </div>

        {activeTab === "DISCOVER" && (
          <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="Tìm kiếm phòng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-[#F8F9FA] pl-11 font-semibold transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
            <select 
              value={modeFilter} 
              onChange={(e) => setModeFilter(e.target.value)} 
              className="h-11 min-w-[160px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              <option value="">Tất cả chế độ</option>
              <option value="PUBLIC">Công khai</option>
              <option value="INVITE_ONLY">Chỉ mời</option>
            </select>
          </div>
        )}
      </div>
      </section>

      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[1.75rem] border border-white bg-white/70 shadow-[0_14px_40px_rgba(71,50,35,0.04)]" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-orange-100 bg-white/80 px-6 py-16 text-center shadow-[0_20px_55px_rgba(71,50,35,0.06)]">
          <div className="pointer-events-none absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full bg-orange-100/70 blur-3xl" />
          <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-[1.35rem] border border-orange-200/70 bg-white text-[#FF6B00] shadow-[0_10px_28px_rgba(255,107,0,0.12)]">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="relative text-xl font-black tracking-[-0.02em] text-slate-950">Không tìm thấy phòng nào</h3>
          <p className="relative mb-7 mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {activeTab === "MY_ROOMS" ? "Bạn chưa tham gia phòng cộng đồng nào. Hãy khám phá và tìm phòng phù hợp nhé!" : "Không có phòng nào khớp với tìm kiếm của bạn. Thử thay đổi từ khóa."}
          </p>
          {activeTab === "MY_ROOMS" && (
            <Button onClick={() => setActiveTab("DISCOVER")} className="relative rounded-xl bg-slate-950 px-6 text-white shadow-md hover:bg-[#FF6B00]">
              Khám phá ngay
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.roomId} room={room} onJoin={handleJoinRoom} />
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
