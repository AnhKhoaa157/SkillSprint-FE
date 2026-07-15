import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  EyeOff,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Users,
  X,
  Eye,
  Pin,
  Trash2,
  MoreHorizontal,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  getAdminCommunityRooms,
  updateAdminCommunityRoomStatus,
  getAdminCommunityRoomMessages,
  hideAdminCommunityRoomMessage,
  getAdminCommunityRoomPins,
  deleteAdminCommunityRoomPin,
} from "../../../../../api/admin/adminCommunityService";
import type {
  CommunityRoomResponse,
  CommunityRoomStatus,
  CommunityRoomMode,
  CommunityChatMessageResponse,
  CommunityAuthorResponse,
  CommunityPinResponse,
} from "../../../../../api/admin/adminCommunityTypes";

import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Textarea } from "../../../../components/ui/textarea";

const PAGE_SIZE = 10;
const MSG_PAGE_SIZE = 30;

type AdminCommunityRoomsProps = {
  isDashboard?: boolean;
};

const ROOM_STATUS_OPTIONS: Array<{ value: "" | CommunityRoomStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
  { value: "HIDDEN", label: "Đã ẩn" },
  { value: "DELETED", label: "Đã xóa" },
];

const ROOM_MODE_OPTIONS: Array<{ value: "" | CommunityRoomMode; label: string }> = [
  { value: "", label: "Tất cả chế độ" },
  { value: "PUBLIC", label: "Công khai" },
  { value: "INVITE_ONLY", label: "Chỉ mời" },
  { value: "PRIVATE", label: "Riêng tư" },
];

const ROOM_STATUS_LABELS: Record<CommunityRoomStatus, string> = {
  ACTIVE: "Đang hoạt động",
  LOCKED: "Đã khóa",
  HIDDEN: "Đã ẩn",
  DELETED: "Đã xóa",
};

const ROOM_MODE_LABELS: Record<CommunityRoomMode, string> = {
  PUBLIC: "Công khai",
  INVITE_ONLY: "Chỉ mời",
  PRIVATE: "Riêng tư",
};

const STATUS_CLASSES: Record<CommunityRoomStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
  LOCKED: "bg-amber-50 text-amber-700 border-amber-100/50",
  HIDDEN: "bg-red-50 text-red-700 border-red-100/50",
  DELETED: "bg-slate-100 text-slate-600 border-slate-200/50",
};

function formatDate(value?: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function authorName(author: CommunityAuthorResponse | null): string {
  return author?.fullName?.trim() || author?.email?.trim() || "Người dùng ẩn danh";
}

function initials(author: CommunityAuthorResponse | null): string {
  return authorName(author).charAt(0).toUpperCase();
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLASSES[status as CommunityRoomStatus] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {label}
    </span>
  );
}

function AuthorCell({ author, label }: { author: CommunityAuthorResponse | null; label?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {author?.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={authorName(author)}
          className="h-8 w-8 shrink-0 rounded-full border border-slate-100 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-500 text-[10px] font-bold text-white">
          {initials(author)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-800">
          {label && <span className="mr-1 text-slate-400 font-medium">{label}</span>}
          {authorName(author)}
        </p>
        {author?.email && <p className="truncate text-[10px] font-semibold text-slate-400">{author.email}</p>}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const toneClass = {
    neutral: "border-slate-200 bg-white text-slate-650 hover:bg-slate-50",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60 hover:border-emerald-250",
    danger: "border-red-100 bg-red-50 text-red-750 hover:bg-red-100/60 hover:border-red-250",
    warning: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100/60 hover:border-amber-250",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  return (
    <label className="flex min-w-[170px] flex-1 flex-col gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold normal-case tracking-normal text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100/60"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminCommunityRooms({ isDashboard = false }: AdminCommunityRoomsProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | CommunityRoomStatus>("");
  const [mode, setMode] = useState<"" | CommunityRoomMode>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rooms, setRooms] = useState<CommunityRoomResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Messages Drawer State
  const [selectedRoom, setSelectedRoom] = useState<CommunityRoomResponse | null>(null);
  const [messages, setMessages] = useState<CommunityChatMessageResponse[]>([]);
  const [msgPage, setMsgPage] = useState(0);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Pinned items for the selected room
  const [pins, setPins] = useState<CommunityPinResponse[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);

  // Dialog State
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    title: string;
    onConfirm: (note: string) => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });
  const [noteText, setNoteText] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const closeNoteDialog = () => setNoteDialog(prev => ({ ...prev, isOpen: false }));
  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const loadRooms = useCallback(
    async (pageToLoad = page, filters?: { status: "" | CommunityRoomStatus; mode: "" | CommunityRoomMode; search: string }) => {
      setLoading(true);
      try {
        const data = await getAdminCommunityRooms({
          status: (filters?.status ?? status) || undefined,
          mode: (filters?.mode ?? mode) || undefined,
          search: (filters?.search ?? search) || undefined,
          page: pageToLoad,
          size: PAGE_SIZE,
        });
        setRooms(data.items);
        setTotalPages(Math.max(1, data.totalPages));
        setTotalItems(data.totalItems);
        setPage(data.page);
      } catch (error) {
        toast.error((error as Error).message || "Không thể tải danh sách phòng cộng đồng");
      } finally {
        setLoading(false);
      }
    },
    [page, status, mode, search]
  );

  useEffect(() => {
    setPage(0);
    loadRooms(0);
  }, [status, mode]);

  const loadMessages = useCallback(
    async (roomId: string, pageToLoad = 0) => {
      setLoadingMessages(true);
      try {
        const data = await getAdminCommunityRoomMessages(roomId, pageToLoad, MSG_PAGE_SIZE);
        setMessages(data.items);
        setMsgTotalPages(Math.max(1, data.totalPages));
        setMsgPage(data.page);
      } catch (error) {
        toast.error((error as Error).message || "Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const loadPins = useCallback(async (roomId: string) => {
    setLoadingPins(true);
    try {
      const data = await getAdminCommunityRoomPins(roomId);
      setPins(data);
    } catch (error) {
      toast.error((error as Error).message || "Không thể tải danh sách ghim");
    } finally {
      setLoadingPins(false);
    }
  }, []);

  const deletePin = async (pin: CommunityPinResponse) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa mục ghim",
      message: "Bạn có chắc muốn xóa mục ghim này?",
      onConfirm: async () => {
        setActionId(pin.pinId);
        try {
          await deleteAdminCommunityRoomPin(pin.roomId, pin.pinId);
          setPins((prev) => prev.filter((item) => item.pinId !== pin.pinId));
          toast.success("Đã xóa mục ghim");
        } catch (error) {
          toast.error((error as Error).message || "Không thể xóa mục ghim");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const openRoomDrawer = (room: CommunityRoomResponse) => {
    setSelectedRoom(room);
    loadMessages(room.roomId, 0);
    loadPins(room.roomId);
  };

  const closeRoomDrawer = () => {
    setSelectedRoom(null);
    setPins([]);
  };

  const updateRoomStatus = (room: CommunityRoomResponse, newStatus: CommunityRoomStatus) => {
    setNoteText("");
    setNoteDialog({
      isOpen: true,
      title: "Ghi chú cho thay đổi trạng thái phòng:",
      onConfirm: async (note) => {
        setActionId(room.roomId);
        try {
          const updated = await updateAdminCommunityRoomStatus(room.roomId, { status: newStatus, adminNote: note || undefined });
          setRooms((prev) => prev.map((item) => (item.roomId === updated.roomId ? updated : item)));
          if (selectedRoom?.roomId === updated.roomId) setSelectedRoom(updated);
          toast.success("Đã cập nhật trạng thái phòng");
        } catch (error) {
          toast.error((error as Error).message || "Không thể cập nhật trạng thái phòng");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const hideMessage = (msg: CommunityChatMessageResponse, hidden: boolean) => {
    setNoteText("");
    setNoteDialog({
      isOpen: true,
      title: `Ghi chú khi ${hidden ? "ẩn" : "hiển thị lại"} tin nhắn:`,
      onConfirm: async (note) => {
        setActionId(msg.messageId);
        try {
          const updated = await hideAdminCommunityRoomMessage(msg.roomId, msg.messageId, { hidden, adminNote: note || undefined });
          setMessages((prev) => prev.map((item) => (item.messageId === updated.messageId ? updated : item)));
          toast.success(`Đã ${hidden ? "ẩn" : "hiển thị lại"} tin nhắn`);
        } catch (error) {
          toast.error((error as Error).message || "Không thể cập nhật tin nhắn");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadRooms(0);
  };

  const clearFilters = () => {
    const shouldReloadDirectly = !status && !mode;
    setSearch("");
    setStatus("");
    setMode("");
    setPage(0);
    if (shouldReloadDirectly) void loadRooms(0, { search: "", status: "", mode: "" });
  };

  const pageTitle = "Quản lý Phòng Cộng Đồng";
  const hasFilters = Boolean(search.trim() || status || mode);

  return (
    <div className={`relative isolate mx-auto max-w-7xl overflow-hidden font-sans ${isDashboard ? "min-h-full rounded-[2rem] bg-[#F7F8FA] p-4 sm:p-6" : "px-4 py-8"}`}>
      {isDashboard && <><div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_10%_0%,rgba(255,237,223,0.75),transparent_28%),radial-gradient(circle_at_95%_20%,rgba(255,246,234,0.7),transparent_25%)]" /><div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(rgba(255,107,0,0.18)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_bottom,black,transparent_45%)]" /></>}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {!isDashboard && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#FF6B00]">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">{pageTitle}</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  Quản lý danh sách phòng, trạng thái hoạt động và kiểm duyệt tin nhắn trong phòng chat.
                </p>
              </div>
            </div>
            <ActionButton onClick={() => loadRooms(page)} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới dữ liệu
            </ActionButton>
          </div>
        )}

        <div className="overflow-hidden rounded-[2rem] border border-white bg-white/85 shadow-[0_22px_65px_rgba(71,50,35,0.07)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-slate-100/80 p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-orange-100/55 blur-3xl" />
            <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#FF6B00] ring-1 ring-orange-100"><SlidersHorizontal className="h-4 w-4" /></span><div><div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#FF6B00]"><Sparkles className="h-3 w-3" />Community operations</div><h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-950">Danh sách phòng</h2></div></div>
              <div className="flex items-center gap-2"><span className="rounded-full border border-orange-100 bg-orange-50/80 px-3 py-1.5 text-[11px] font-bold text-orange-950"><b className="tabular-nums text-[#FF6B00]">{totalItems.toLocaleString("vi-VN")}</b> phòng</span><button type="button" onClick={() => loadRooms(page)} disabled={loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-orange-200 hover:text-[#FF6B00] disabled:opacity-50" aria-label="Làm mới danh sách"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button></div>
            </div>
            <div className="relative grid gap-3 lg:grid-cols-[minmax(260px,1.35fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)_auto] lg:items-end">
              <form onSubmit={handleSearchSubmit} className="relative min-w-0">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                  placeholder="Tìm phòng theo tên..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100/60"
                />
              </form>
              <SelectField label="Trạng thái phòng" value={status} onChange={setStatus} options={ROOM_STATUS_OPTIONS} />
              <SelectField label="Chế độ phòng" value={mode} onChange={setMode} options={ROOM_MODE_OPTIONS} />
              <button type="button" onClick={() => loadRooms(0)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FF6B00] active:translate-y-0"><Search className="h-3.5 w-3.5" />Lọc phòng</button>
            </div>
          </div>

          <div className="min-h-[380px] bg-white/60">
            {loading && (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-slate-400">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-orange-100 bg-orange-50"><Loader2 className="h-5 w-5 animate-spin text-[#FF6B00]" /></span>
                <p className="text-xs font-bold">Đang tải danh sách phòng...</p>
              </div>
            )}

            {!loading && (
              <div className="divide-y divide-slate-100/80">
                {rooms.map((room) => (
                  <div key={room.roomId} className="flex flex-col justify-between gap-5 p-5 transition duration-200 hover:bg-orange-50/25 md:flex-row md:items-center sm:p-6">
                    <div className="min-w-0 flex-1 space-y-2.5">
                      {/* Tên phòng, Chế độ và Trạng thái */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><MessageSquare size={15} /></span>
                        <h3 className="mr-1 text-sm font-black text-slate-900">{room.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                          {room.mode === "PUBLIC" ? <Users size={10} /> : <Lock size={10} />}
                          {ROOM_MODE_LABELS[room.mode]}
                        </span>
                        <StatusBadge status={room.status} label={ROOM_STATUS_LABELS[room.status]} />
                      </div>
                      
                      {/* Mô tả */}
                      <p className="max-w-2xl pl-12 text-xs font-medium leading-5 text-slate-500">
                        {room.description || <span className="italic text-slate-300">Không có mô tả.</span>}
                      </p>

                      {/* Thông tin Chủ phòng & Thống kê */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 text-[11px] font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-400">Chủ phòng:</span>
                          {room.owner?.avatarUrl ? (
                            <img
                              src={room.owner.avatarUrl}
                              alt={authorName(room.owner)}
                              className="h-5 w-5 rounded-full object-cover border border-slate-150"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-500 text-[8px] font-bold text-white">
                              {initials(room.owner)}
                            </div>
                          )}
                          <span className="text-slate-800">{authorName(room.owner)}</span>
                          {room.owner?.email && (
                            <span className="text-[10px] font-semibold text-slate-400">({room.owner.email})</span>
                          )}
                        </div>

                        <span className="text-slate-200">•</span>
                        <span>{room.memberCount} / {room.maxMembers} thành viên</span>
                        
                        <span className="text-slate-200">•</span>
                        <span className="text-red-500">{room.reportCount} báo cáo</span>
                        
                        <span className="text-slate-200">•</span>
                        <span>Cập nhật: {formatDate(room.updatedAt)}</span>
                      </div>

                      {/* Ghi chú Admin nếu có */}
                      {room.adminNote && (
                        <div className="ml-12 max-w-2xl rounded-xl border border-amber-100/70 bg-amber-50/60 px-3 py-2 text-xs leading-relaxed text-slate-600">
                          <span className="font-bold text-amber-800">Ghi chú của Admin:</span> {room.adminNote}
                        </div>
                      )}
                    </div>

                    {/* Bộ nút thao tác quản lý */}
                    <div className="flex shrink-0 flex-row items-start justify-between gap-2 border-t border-slate-100 pt-4 md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "ACTIVE"}
                          tone="success"
                          onClick={() => updateRoomStatus(room, "ACTIVE")}
                        >
                          <CheckCircle2 size={12} /> Hoạt động
                        </ActionButton>
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "LOCKED"}
                          tone="warning"
                          onClick={() => updateRoomStatus(room, "LOCKED")}
                        >
                          <Lock size={12} /> Khóa
                        </ActionButton>
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "HIDDEN"}
                          tone="danger"
                          onClick={() => updateRoomStatus(room, "HIDDEN")}
                        >
                          <EyeOff size={12} /> Ẩn
                        </ActionButton>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRoomDrawer(room)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3.5 text-[11px] font-bold text-[#FF6B00] shadow-sm transition hover:bg-orange-50"
                      >
                        <MessageSquare size={12} /> Kiểm duyệt nội dung chat
                      </button>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden p-8 text-center">
                    <div className="pointer-events-none absolute left-1/2 top-14 h-48 w-48 -translate-x-1/2 rounded-full bg-orange-100/65 blur-3xl" />
                    <div className="relative grid h-16 w-16 place-items-center rounded-[1.35rem] border border-orange-200/70 bg-white text-[#FF6B00] shadow-[0_10px_28px_rgba(255,107,0,0.12)]"><MessageSquare size={25} /></div>
                    <p className="relative mt-5 text-lg font-black tracking-[-0.02em] text-slate-900">{hasFilters ? "Không có phòng phù hợp" : "Chưa có phòng cộng đồng"}</p>
                    <p className="relative mt-2 max-w-sm text-xs leading-5 text-slate-500">{hasFilters ? "Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả." : "Các phòng mới được tạo sẽ xuất hiện tại đây để quản trị viên theo dõi."}</p>
                    {hasFilters && <button type="button" onClick={clearFilters} className="relative mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-xs font-bold text-[#FF6B00] shadow-sm transition hover:bg-orange-50"><X className="h-3.5 w-3.5" />Xóa bộ lọc</button>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/55 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[11px] font-bold text-slate-400">
              Tổng số: {totalItems.toLocaleString("vi-VN")} mục · Trang {page + 1}/{totalPages}
            </p>
            <div className="flex gap-2">
              <ActionButton disabled={loading || page <= 0} onClick={() => loadRooms(Math.max(0, page - 1))}>
                Trang trước
              </ActionButton>
              <ActionButton disabled={loading || page + 1 >= totalPages} onClick={() => loadRooms(page + 1)}>
                Trang sau
              </ActionButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages Drawer */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRoomDrawer}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative flex w-full max-w-md flex-col bg-slate-50 shadow-2xl border-l border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kiểm duyệt nội dung chat</h2>
                  <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{selectedRoom.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeRoomDrawer}
                  className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Pinned items */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/35 p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <Pin size={13} className="fill-amber-550 text-amber-500" /> Tin ghim của phòng ({pins.length})
                  </div>
                  {loadingPins ? (
                    <div className="flex justify-center py-3 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : pins.length === 0 ? (
                    <p className="py-1 text-xs font-medium text-slate-400">Phòng chưa có mục ghim nào.</p>
                  ) : (
                    <div className="space-y-3">
                      {pins.map((pin) => (
                        <div
                          key={pin.pinId}
                          className="flex items-start justify-between gap-2.5 rounded-lg border border-slate-150 bg-white p-3 shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            {pin.title && (
                              <p className="truncate text-xs font-semibold text-slate-800">{pin.title}</p>
                            )}
                            {pin.content && (
                              <p className="mt-1 break-words text-xs font-normal text-slate-500 leading-relaxed">{pin.content}</p>
                            )}
                            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                              {pin.itemType} · {authorName(pin.pinnedBy)}
                            </p>
                          </div>
                          <button
                            onClick={() => deletePin(pin)}
                            disabled={actionId === pin.pinId}
                            title="Xóa mục ghim"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={11} /> Xóa ghim
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {loadingMessages ? (
                  <div className="flex py-10 justify-center text-slate-400 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#FF6B00]" />
                    <span className="text-xs font-semibold">Đang tải tin nhắn...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.messageId}
                          className={`rounded-xl border p-4 bg-white shadow-xs transition duration-150 ${msg.hidden ? "border-red-100 bg-red-50/20" : "border-slate-150"}`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <AuthorCell author={msg.sender} />
                            <span className="text-[10px] font-medium text-slate-400">{formatDate(msg.sentAt)}</span>
                          </div>
                          <div className={`text-xs leading-relaxed mb-2.5 break-words ${msg.hidden ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {msg.content}
                          </div>
                          {msg.reportCount > 0 && (
                            <div className="mb-2 text-[10px] font-semibold text-red-600">
                              Có {msg.reportCount} lượt báo cáo vi phạm
                            </div>
                          )}
                          {msg.adminNote && (
                            <div className="mb-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11px] font-medium text-slate-500 leading-relaxed">
                              <span className="font-semibold text-slate-700">Ghi chú admin:</span> {msg.adminNote}
                            </div>
                          )}
                          <div className="flex justify-end mt-2">
                            {msg.hidden ? (
                              <button
                                type="button"
                                onClick={() => hideMessage(msg, false)}
                                disabled={actionId === msg.messageId}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <Eye size={11} /> Hiển thị lại tin nhắn
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => hideMessage(msg, true)}
                                disabled={actionId === msg.messageId}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                <EyeOff size={11} /> Ẩn tin nhắn này
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {messages.length === 0 && (
                      <div className="text-center text-xs font-semibold text-slate-400 py-10 bg-white rounded-2xl border border-slate-150">
                        Phòng chưa có tin nhắn nào.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400">
                    Trang {msgPage + 1}/{msgTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingMessages || msgPage <= 0}
                      onClick={() => loadMessages(selectedRoom.roomId, Math.max(0, msgPage - 1))}
                      className="h-8 rounded-lg"
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingMessages || msgPage + 1 >= msgTotalPages}
                      onClick={() => loadMessages(selectedRoom.roomId, msgPage + 1)}
                      className="h-8 rounded-lg"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Dialog open={noteDialog.isOpen} onOpenChange={(open) => !open && closeNoteDialog()}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-semibold">{noteDialog.title}</DialogTitle>
            <DialogDescription className="text-slate-500">Ghi chú này sẽ được lưu lại trong lịch sử kiểm duyệt.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Nhập ghi chú của bạn (không bắt buộc)..."
            className="min-h-[100px] bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#FF6B00]"
          />
          <DialogFooter>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white" onClick={closeNoteDialog}>Hủy</Button>
            <Button className="bg-[#FF6B00] text-white hover:bg-[#EA580C] border-none" onClick={() => {
              noteDialog.onConfirm(noteText.trim());
              closeNoteDialog();
            }}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-semibold">{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-slate-500">{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white" onClick={closeConfirmDialog}>Hủy</Button>
            <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700 border-none" onClick={() => {
              confirmDialog.onConfirm();
              closeConfirmDialog();
            }}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
