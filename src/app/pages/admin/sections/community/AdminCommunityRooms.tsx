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
    neutral: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "border-red-100 bg-red-50 text-red-700 hover:bg-red-100",
    warning: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
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
    <label className="flex min-w-[170px] flex-col gap-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)}
        className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case tracking-normal text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
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
    if (!window.confirm("Bạn có chắc muốn xóa mục ghim này?")) return;
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

  const promptNote = (title: string): string | null => {
    const note = window.prompt(title, "");
    if (note === null) return null;
    return note.trim();
  };

  const updateRoomStatus = async (room: CommunityRoomResponse, newStatus: CommunityRoomStatus) => {
    const note = promptNote("Ghi chú cho thay đổi trạng thái phòng:");
    if (note === null) return;
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
  };

  const hideMessage = async (msg: CommunityChatMessageResponse, hidden: boolean) => {
    const note = promptNote(`Ghi chú khi ${hidden ? "ẩn" : "hiển thị lại"} tin nhắn:`);
    if (note === null) return;
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
            <ActionButton onClick={() => loadRooms(page)} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </ActionButton>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-slate-50/70 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                  placeholder="Tìm phòng theo tên"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
              </form>
              <SelectField label="Trạng thái" value={status} onChange={setStatus} options={ROOM_STATUS_OPTIONS} />
              <SelectField label="Chế độ" value={mode} onChange={setMode} options={ROOM_MODE_OPTIONS} />
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
                  <div key={room.roomId} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-slate-800">{room.name}</h3>
                          <p className="truncate text-sm font-medium text-slate-500">{room.description}</p>
                        </div>
                        <StatusBadge status={room.status} label={ROOM_STATUS_LABELS[room.status]} />
                      </div>

                      <AuthorCell author={room.owner} label="Chủ phòng:" />

                      <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                          {room.mode === "PUBLIC" ? <Users size={12} /> : <Lock size={12} />}
                          {ROOM_MODE_LABELS[room.mode]}
                        </span>
                        <span>{room.memberCount} / {room.maxMembers} thành viên</span>
                        <span>{room.reportCount} báo cáo</span>
                        <span>Cập nhật: {formatDate(room.updatedAt)}</span>
                      </div>
                      {room.adminNote && (
                        <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                          Ghi chú admin: {room.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 xl:items-end xl:justify-start">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "ACTIVE"}
                          tone="success"
                          onClick={() => updateRoomStatus(room, "ACTIVE")}
                        >
                          <CheckCircle2 size={13} /> Hoạt động
                        </ActionButton>
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "LOCKED"}
                          tone="warning"
                          onClick={() => updateRoomStatus(room, "LOCKED")}
                        >
                          <Lock size={13} /> Khóa
                        </ActionButton>
                        <ActionButton
                          disabled={actionId === room.roomId || room.status === "HIDDEN"}
                          tone="danger"
                          onClick={() => updateRoomStatus(room, "HIDDEN")}
                        >
                          <EyeOff size={13} /> Ẩn
                        </ActionButton>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRoomDrawer(room)}
                        className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-extrabold text-[#FF6B00] transition hover:bg-orange-100"
                      >
                        <MessageSquare size={15} /> Xem tin nhắn
                      </button>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <ShieldAlert size={22} />
                    </div>
                    <p className="text-sm font-bold text-slate-500">Không có phòng nào.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-slate-400">
              {totalItems.toLocaleString("vi-VN")} mục · Trang {page + 1}/{totalPages}
            </p>
            <div className="flex gap-2">
              <ActionButton disabled={loading || page <= 0} onClick={() => loadRooms(Math.max(0, page - 1))}>
                Trước
              </ActionButton>
              <ActionButton disabled={loading || page + 1 >= totalPages} onClick={() => loadRooms(page + 1)}>
                Sau
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
                  <h2 className="text-lg font-black text-slate-900">Tin nhắn phòng</h2>
                  <p className="truncate text-xs font-semibold text-slate-500">{selectedRoom.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeRoomDrawer}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Pinned items */}
                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-700">
                    <Pin size={13} /> Mục ghim ({pins.length})
                  </div>
                  {loadingPins ? (
                    <div className="flex justify-center py-3 text-amber-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : pins.length === 0 ? (
                    <p className="py-1 text-xs font-semibold text-slate-400">Phòng chưa có mục ghim nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {pins.map((pin) => (
                        <div
                          key={pin.pinId}
                          className="flex items-start justify-between gap-2 rounded-xl border border-amber-100 bg-white p-2.5 shadow-sm"
                        >
                          <div className="min-w-0">
                            {pin.title && (
                              <p className="truncate text-sm font-extrabold text-slate-800">{pin.title}</p>
                            )}
                            {pin.content && (
                              <p className="mt-0.5 break-words text-xs font-medium text-slate-500">{pin.content}</p>
                            )}
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                              {pin.itemType} · {authorName(pin.pinnedBy)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deletePin(pin)}
                            disabled={actionId === pin.pinId}
                            title="Xóa mục ghim"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {loadingMessages ? (
                  <div className="flex py-10 justify-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.messageId}
                        className={`rounded-2xl border bg-white p-3 shadow-sm ${msg.hidden ? "border-red-100 bg-red-50/30" : "border-slate-200"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <AuthorCell author={msg.sender} />
                          <span className="text-[10px] font-bold text-slate-400">{formatDate(msg.sentAt)}</span>
                        </div>
                        <div className={`text-sm mb-2 break-words ${msg.hidden ? "text-slate-500 line-through" : "text-slate-800"}`}>
                          {msg.content}
                        </div>
                        {msg.reportCount > 0 && (
                          <div className="mb-2 text-[11px] font-black text-red-600">
                            Có {msg.reportCount} lượt báo cáo
                          </div>
                        )}
                        {msg.adminNote && (
                          <div className="mb-2 rounded-lg bg-slate-100 p-2 text-[11px] font-semibold text-slate-600">
                            Ghi chú admin: {msg.adminNote}
                          </div>
                        )}
                        <div className="flex justify-end mt-2">
                          {msg.hidden ? (
                            <button
                              type="button"
                              onClick={() => hideMessage(msg, false)}
                              disabled={actionId === msg.messageId}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Eye size={12} /> Hiển thị lại
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => hideMessage(msg, true)}
                              disabled={actionId === msg.messageId}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              <EyeOff size={12} /> Ẩn tin nhắn
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center text-sm font-semibold text-slate-400 py-10">
                        Phòng chưa có tin nhắn nào.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400">
                    Trang {msgPage + 1}/{msgTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <ActionButton
                      disabled={loadingMessages || msgPage <= 0}
                      onClick={() => loadMessages(selectedRoom.roomId, Math.max(0, msgPage - 1))}
                    >
                      Trước
                    </ActionButton>
                    <ActionButton
                      disabled={loadingMessages || msgPage + 1 >= msgTotalPages}
                      onClick={() => loadMessages(selectedRoom.roomId, msgPage + 1)}
                    >
                      Sau
                    </ActionButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
