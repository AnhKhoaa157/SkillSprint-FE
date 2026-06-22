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
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  LOCKED: "bg-amber-50 text-amber-700 border-amber-100",
  HIDDEN: "bg-red-50 text-red-700 border-red-100",
  DELETED: "bg-slate-100 text-slate-600 border-slate-200",
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
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${STATUS_CLASSES[status as CommunityRoomStatus] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {label}
    </span>
  );
}

function AuthorCell({ author, label }: { author: CommunityAuthorResponse | null; label?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {author?.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={authorName(author)}
          className="h-9 w-9 shrink-0 rounded-xl border border-slate-100 object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-500 text-sm font-black text-white">
          {initials(author)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-800">
          {label && <span className="mr-1 text-slate-400 font-medium">{label}</span>}
          {authorName(author)}
        </p>
        {author?.email && <p className="truncate text-xs font-semibold text-slate-400">{author.email}</p>}
      </div>
    </div>
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
    async (pageToLoad = page) => {
      setLoading(true);
      try {
        const data = await getAdminCommunityRooms({
          status: status || undefined,
          mode: mode || undefined,
          search: search || undefined,
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

  const pageTitle = "Quản lý Phòng Cộng Đồng";

  return (
    <div className={`relative mx-auto max-w-7xl font-sans ${isDashboard ? "p-0" : "px-4 py-8"}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {!isDashboard && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-[#FF6B00] shadow-[0_12px_30px_-18px_rgba(255,107,0,0.5)]">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{pageTitle}</h1>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  Quản lý danh sách phòng, trạng thái và kiểm duyệt tin nhắn.
                </p>
              </div>
            </div>
            <Button onClick={() => loadRooms(page)} disabled={loading} className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50" variant="outline">
              <RefreshCw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
              Làm mới
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Filters Bar */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                  placeholder="Tìm phòng theo tên..."
                  className="pl-9 h-10 w-full rounded-xl border-slate-200 bg-white focus-visible:ring-[#FF6B00]"
                />
              </form>
              <div className="flex gap-3">
                <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                  <SelectTrigger className="h-10 w-[180px] rounded-xl border-slate-200 bg-white font-medium focus:ring-[#FF6B00]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || "all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mode} onValueChange={(val) => setMode(val as any)}>
                  <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 bg-white font-medium focus:ring-[#FF6B00]">
                    <SelectValue placeholder="Chế độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || "all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="min-h-[420px]">
            {loading && (
              <div className="flex min-h-[320px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải dữ liệu...
              </div>
            )}

            {!loading && (
              <div className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <div key={room.roomId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-base font-bold text-slate-900">{room.name}</h3>
                        <StatusBadge status={room.status} label={ROOM_STATUS_LABELS[room.status]} />
                      </div>
                      
                      {room.description && (
                        <p className="truncate text-sm text-slate-500">{room.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {room.mode === "PUBLIC" ? <Users size={14} className="text-slate-400" /> : <Lock size={14} className="text-slate-400" />}
                          <span className="font-medium">{ROOM_MODE_LABELS[room.mode]}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{room.memberCount} / {room.maxMembers} thành viên</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-orange-600">{room.reportCount} báo cáo</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span>Cập nhật: {formatDate(room.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <AuthorCell author={room.owner} label="Chủ phòng:" />
                      </div>

                      {room.adminNote && (
                        <div className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800 border border-orange-100">
                          Ghi chú admin: {room.adminNote}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoomDrawer(room)}
                        className="h-8 rounded-lg border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                      >
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Xem tin nhắn
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            disabled={actionId === room.roomId || room.status === "ACTIVE"}
                            onClick={() => updateRoomStatus(room, "ACTIVE")}
                            className="text-emerald-600 font-medium"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Hoạt động
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={actionId === room.roomId || room.status === "LOCKED"}
                            onClick={() => updateRoomStatus(room, "LOCKED")}
                            className="text-amber-600 font-medium"
                          >
                            <Lock className="mr-2 h-4 w-4" /> Khóa phòng
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={actionId === room.roomId || room.status === "HIDDEN"}
                            onClick={() => updateRoomStatus(room, "HIDDEN")}
                            className="text-red-600 font-medium"
                          >
                            <EyeOff className="mr-2 h-4 w-4" /> Ẩn phòng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Search size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Không tìm thấy phòng nào phù hợp.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">
              Tổng số <span className="font-bold text-slate-900">{totalItems.toLocaleString("vi-VN")}</span> mục · Trang {page + 1}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={loading || page <= 0} 
                onClick={() => loadRooms(Math.max(0, page - 1))}
                className="h-8 rounded-lg border-slate-200 font-medium"
              >
                Trước
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={loading || page + 1 >= totalPages} 
                onClick={() => loadRooms(page + 1)}
                className="h-8 rounded-lg border-slate-200 font-medium"
              >
                Sau
              </Button>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex w-full max-w-md flex-col bg-slate-50 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tin nhắn phòng</h2>
                  <p className="truncate text-sm text-slate-500">{selectedRoom.name}</p>
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
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    <Pin size={14} /> Mục ghim ({pins.length})
                  </div>
                  {loadingPins ? (
                    <div className="flex justify-center py-4 text-amber-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : pins.length === 0 ? (
                    <p className="text-sm font-medium text-amber-600/70">Phòng chưa có mục ghim nào.</p>
                  ) : (
                    <div className="space-y-3">
                      {pins.map((pin) => (
                        <div
                          key={pin.pinId}
                          className="flex items-start justify-between gap-3 rounded-lg border border-amber-100 bg-white p-3 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            {pin.title && (
                              <p className="truncate text-sm font-bold text-slate-900">{pin.title}</p>
                            )}
                            {pin.content && (
                              <p className="mt-1 break-words text-sm text-slate-600">{pin.content}</p>
                            )}
                            <p className="mt-2 text-xs font-medium text-amber-600">
                              {pin.itemType} · {authorName(pin.pinnedBy)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePin(pin)}
                            disabled={actionId === pin.pinId}
                            title="Xóa mục ghim"
                            className="h-8 w-8 shrink-0 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {loadingMessages ? (
                  <div className="flex py-12 justify-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.messageId}
                        className={`rounded-xl border bg-white p-4 shadow-sm ${msg.hidden ? "border-red-100 bg-red-50/30" : "border-slate-200"}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <AuthorCell author={msg.sender} />
                          <span className="text-xs font-medium text-slate-400">{formatDate(msg.sentAt)}</span>
                        </div>
                        <div className={`text-sm mb-3 break-words ${msg.hidden ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {msg.content}
                        </div>
                        {msg.reportCount > 0 && (
                          <div className="mb-3 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-100">
                            Có {msg.reportCount} báo cáo
                          </div>
                        )}
                        {msg.adminNote && (
                          <div className="mb-3 rounded-lg bg-orange-50 p-2.5 text-xs font-medium text-orange-800 border border-orange-100">
                            Ghi chú admin: {msg.adminNote}
                          </div>
                        )}
                        <div className="flex justify-end pt-1">
                          {msg.hidden ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => hideMessage(msg, false)}
                              disabled={actionId === msg.messageId}
                              className="h-7 text-xs rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                            >
                              <Eye className="mr-1.5 h-3 w-3" /> Hiển thị lại
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => hideMessage(msg, true)}
                              disabled={actionId === msg.messageId}
                              className="h-7 text-xs rounded-md border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                            >
                              <EyeOff className="mr-1.5 h-3 w-3" /> Ẩn tin nhắn
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center text-sm font-medium text-slate-500 py-12">
                        Phòng chưa có tin nhắn nào.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
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
