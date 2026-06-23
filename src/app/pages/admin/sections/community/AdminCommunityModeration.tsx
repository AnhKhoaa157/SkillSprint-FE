import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  EyeOff,
  Flag,
  Hash,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  ThumbsUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addAdminCommunityBlacklistKeyword,
  deleteAdminCommunityBlacklistKeyword,
  getAdminCommunityBlacklist,
  getAdminCommunityComments,
  getAdminCommunityPosts,
  getAdminCommunityReports,
  updateAdminCommunityCommentStatus,
  updateAdminCommunityPostStatus,
  updateAdminCommunityReportStatus,
} from "../../../../../api/admin/adminCommunityService";
import type {
  BlacklistKeywordResponse,
  CommunityAuthorResponse,
  CommunityPostResponse,
  CommunityPostStatus,
  ContentReportResponse,
  ContentReportStatus,
  ContentReportTargetType,
  PostCommentResponse,
  PostCommentStatus,
} from "../../../../../api/admin/adminCommunityTypes";

const PAGE_SIZE = 10;

type CommunityTab = "posts" | "comments" | "reports" | "blacklist";

type AdminCommunityModerationProps = {
  isDashboard?: boolean;
};

type ModerationStats = {
  pendingContent: number;
  pendingReports: number;
  blockedKeywords: number;
};

const TABS: Array<{ id: CommunityTab; label: string; icon: LucideIcon; desc: string }> = [
  { id: "posts", label: "Bài viết", icon: FileText, desc: "Kiểm duyệt bài đăng" },
  { id: "comments", label: "Bình luận", icon: MessageCircle, desc: "Kiểm duyệt bình luận" },
  { id: "reports", label: "Báo cáo", icon: Flag, desc: "Xử lý vi phạm" },
  { id: "blacklist", label: "Từ khóa cấm", icon: Ban, desc: "Quản lý từ khóa" },
];

const POST_STATUS_OPTIONS: Array<{ value: "" | CommunityPostStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING_MODERATION", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "HIDDEN", label: "Đã ẩn" },
  { value: "DELETED", label: "Đã xóa" },
];

const COMMENT_STATUS_OPTIONS: Array<{ value: "" | PostCommentStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING_MODERATION", label: "Chờ duyệt" },
  { value: "VISIBLE", label: "Hiển thị" },
  { value: "HIDDEN", label: "Đã ẩn" },
  { value: "DELETED", label: "Đã xóa" },
];

const REPORT_STATUS_OPTIONS: Array<{ value: "" | ContentReportStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWED", label: "Đã xử lý" },
  { value: "DISMISSED", label: "Bỏ qua" },
];

const REPORT_TARGET_OPTIONS: Array<{ value: "" | ContentReportTargetType; label: string }> = [
  { value: "", label: "Mọi loại nội dung" },
  { value: "POST", label: "Bài viết" },
  { value: "COMMENT", label: "Bình luận" },
  { value: "MESSAGE", label: "Tin nhắn" },
];

const POST_STATUS_LABELS: Record<CommunityPostStatus, string> = {
  APPROVED: "Đã duyệt",
  PENDING_MODERATION: "Chờ duyệt",
  HIDDEN: "Đã ẩn",
  DELETED: "Đã xóa",
};

const COMMENT_STATUS_LABELS: Record<PostCommentStatus, string> = {
  VISIBLE: "Hiển thị",
  PENDING_MODERATION: "Chờ duyệt",
  HIDDEN: "Đã ẩn",
  DELETED: "Đã xóa",
};

const REPORT_STATUS_LABELS: Record<ContentReportStatus, string> = {
  PENDING: "Chờ xử lý",
  REVIEWED: "Đã xử lý",
  DISMISSED: "Bỏ qua",
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

function excerpt(value: string, max = 200): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

/* ── Status Badge ── */
function StatusBadge({ label, status }: { label: string; status: string }) {
  const cfg: Record<string, string> = {
    APPROVED: "bg-emerald-500 text-white",
    VISIBLE: "bg-emerald-500 text-white",
    PENDING_MODERATION: "bg-amber-500 text-white",
    PENDING: "bg-amber-500 text-white",
    HIDDEN: "bg-rose-500 text-white",
    DELETED: "bg-slate-400 text-white",
    REVIEWED: "bg-blue-500 text-white",
    DISMISSED: "bg-slate-400 text-white",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm ${cfg[status] ?? "bg-slate-400 text-white"}`}>
      {label}
    </span>
  );
}

/* ── Author Cell ── */
function AuthorCell({ author }: { author: CommunityAuthorResponse | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {author?.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={authorName(author)}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 text-xs font-black text-white shadow">
          {initials(author)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-slate-800 leading-tight">{authorName(author)}</p>
        {author?.email && <p className="truncate text-[11px] text-slate-400 mt-px">{author.email}</p>}
      </div>
    </div>
  );
}

/* ── Action Button ── */
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
  const styles: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-bold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${styles[tone]}`}
    >
      {children}
    </button>
  );
}

/* ── Select Field ── */
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
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 cursor-pointer min-w-[160px]"
      >
        {options.map(opt => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function AdminCommunityModeration({ isDashboard = false }: AdminCommunityModerationProps) {
  const [activeTab, setActiveTab] = useState<CommunityTab>("posts");
  const [search, setSearch] = useState("");
  const [postStatus, setPostStatus] = useState<"" | CommunityPostStatus>("PENDING_MODERATION");
  const [commentStatus, setCommentStatus] = useState<"" | PostCommentStatus>("PENDING_MODERATION");
  const [reportStatus, setReportStatus] = useState<"" | ContentReportStatus>("PENDING");
  const [reportTarget, setReportTarget] = useState<"" | ContentReportTargetType>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [posts, setPosts] = useState<CommunityPostResponse[]>([]);
  const [comments, setComments] = useState<PostCommentResponse[]>([]);
  const [reports, setReports] = useState<ContentReportResponse[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistKeywordResponse[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [moderationStats, setModerationStats] = useState<ModerationStats>({
    pendingContent: 0,
    pendingReports: 0,
    blockedKeywords: 0,
  });

  const loadModerationStats = useCallback(async () => {
    try {
      const [pendingPosts, pendingComments, pendingReports, blockedKeywords] = await Promise.all([
        getAdminCommunityPosts({ status: "PENDING_MODERATION", page: 0, size: 1 }),
        getAdminCommunityComments({ status: "PENDING_MODERATION", page: 0, size: 1 }),
        getAdminCommunityReports({ status: "PENDING", page: 0, size: 1 }),
        getAdminCommunityBlacklist(),
      ]);

      setModerationStats({
        pendingContent: pendingPosts.totalItems + pendingComments.totalItems,
        pendingReports: pendingReports.totalItems,
        blockedKeywords: blockedKeywords.length,
      });
    } catch (error) {
      console.warn("Unable to load community moderation stats", error);
    }
  }, []);

  const loadPosts = useCallback(async (pageToLoad = page) => {
    setLoading(true);
    try {
      const data = await getAdminCommunityPosts({
        status: postStatus || undefined,
        search: search || undefined,
        page: pageToLoad,
        size: PAGE_SIZE,
      });
      setPosts(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalItems(data.totalItems);
      setPage(data.page);
    } catch (error) {
      toast.error((error as Error).message || "Không thể tải bài viết cộng đồng");
    } finally {
      setLoading(false);
    }
  }, [page, postStatus, search]);

  const loadComments = useCallback(async (pageToLoad = page) => {
    setLoading(true);
    try {
      const data = await getAdminCommunityComments({
        status: commentStatus || undefined,
        search: search || undefined,
        page: pageToLoad,
        size: PAGE_SIZE,
      });
      setComments(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalItems(data.totalItems);
      setPage(data.page);
    } catch (error) {
      toast.error((error as Error).message || "Không thể tải bình luận cộng đồng");
    } finally {
      setLoading(false);
    }
  }, [commentStatus, page, search]);

  const loadReports = useCallback(async (pageToLoad = page) => {
    setLoading(true);
    try {
      const data = await getAdminCommunityReports({
        status: reportStatus || undefined,
        targetType: reportTarget || undefined,
        page: pageToLoad,
        size: PAGE_SIZE,
      });
      setReports(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalItems(data.totalItems);
      setPage(data.page);
    } catch (error) {
      toast.error((error as Error).message || "Không thể tải báo cáo cộng đồng");
    } finally {
      setLoading(false);
    }
  }, [page, reportStatus, reportTarget]);

  const loadBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const keywords = await getAdminCommunityBlacklist();
      setBlacklist(keywords);
      setTotalItems(keywords.length);
      setTotalPages(1);
      setPage(0);
    } catch (error) {
      toast.error((error as Error).message || "Không thể tải từ khóa cấm");
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback((pageToLoad = page) => {
    if (activeTab === "posts") return loadPosts(pageToLoad);
    if (activeTab === "comments") return loadComments(pageToLoad);
    if (activeTab === "reports") return loadReports(pageToLoad);
    return loadBlacklist();
  }, [activeTab, loadBlacklist, loadComments, loadPosts, loadReports, page]);

  useEffect(() => {
    setPage(0);
    reload(0);
  }, [activeTab, postStatus, commentStatus, reportStatus, reportTarget]);

  useEffect(() => {
    loadModerationStats();
  }, [loadModerationStats]);

  const stats = useMemo(() => {
    return [
      {
        label: "Nội dung chờ duyệt",
        value: moderationStats.pendingContent,
        icon: ShieldAlert,
        color: "from-amber-50 to-amber-100/50 border-amber-200",
        iconBg: "bg-amber-500",
        accent: "text-amber-600",
        pulse: moderationStats.pendingContent > 0,
      },
      {
        label: "Báo cáo chờ xử lý",
        value: moderationStats.pendingReports,
        icon: AlertTriangle,
        color: "from-rose-50 to-rose-100/50 border-rose-200",
        iconBg: "bg-rose-500",
        accent: "text-rose-600",
        pulse: moderationStats.pendingReports > 0,
      },
      {
        label: "Từ khóa đang chặn",
        value: moderationStats.blockedKeywords,
        icon: Ban,
        color: "from-slate-50 to-slate-100/50 border-slate-200",
        iconBg: "bg-slate-600",
        accent: "text-slate-700",
        pulse: false,
      },
    ];
  }, [moderationStats]);

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

  const updatePostStatus = (post: CommunityPostResponse, status: CommunityPostStatus) => {
    setNoteText("");
    setNoteDialog({
      isOpen: true,
      title: "Ghi chú cho thay đổi trạng thái bài viết:",
      onConfirm: async (note) => {
        setActionId(post.postId);
        try {
          const updated = await updateAdminCommunityPostStatus(post.postId, { status, adminNote: note || undefined });
          setPosts(prev => prev.map(item => item.postId === updated.postId ? updated : item));
          loadModerationStats();
          toast.success("Đã cập nhật trạng thái bài viết");
        } catch (error) {
          toast.error((error as Error).message || "Không thể cập nhật bài viết");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const updateCommentStatus = (comment: PostCommentResponse, status: PostCommentStatus) => {
    setNoteText("");
    setNoteDialog({
      isOpen: true,
      title: "Ghi chú cho thay đổi trạng thái bình luận:",
      onConfirm: async (note) => {
        setActionId(comment.commentId);
        try {
          const updated = await updateAdminCommunityCommentStatus(comment.commentId, { status, adminNote: note || undefined });
          setComments(prev => prev.map(item => item.commentId === updated.commentId ? updated : item));
          loadModerationStats();
          toast.success("Đã cập nhật trạng thái bình luận");
        } catch (error) {
          toast.error((error as Error).message || "Không thể cập nhật bình luận");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const updateReportStatus = (report: ContentReportResponse, status: ContentReportStatus) => {
    setNoteText("");
    setNoteDialog({
      isOpen: true,
      title: "Ghi chú xử lý báo cáo:",
      onConfirm: async (note) => {
        setActionId(report.reportId);
        try {
          const updated = await updateAdminCommunityReportStatus(report.reportId, { status, adminNote: note || undefined });
          setReports(prev => prev.map(item => item.reportId === updated.reportId ? updated : item));
          loadModerationStats();
          toast.success("Đã cập nhật trạng thái báo cáo");
        } catch (error) {
          toast.error((error as Error).message || "Không thể cập nhật báo cáo");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const addKeyword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword) return;
    setActionId("blacklist:add");
    try {
      const created = await addAdminCommunityBlacklistKeyword({ keyword });
      setBlacklist(prev => [created, ...prev]);
      setModerationStats(prev => ({ ...prev, blockedKeywords: prev.blockedKeywords + 1 }));
      setNewKeyword("");
      toast.success("Đã thêm từ khóa cấm");
    } catch (error) {
      toast.error((error as Error).message || "Không thể thêm từ khóa");
    } finally {
      setActionId(null);
    }
  };

  const deleteKeyword = (item: BlacklistKeywordResponse) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa",
      message: `Xóa từ khóa "${item.keyword}" khỏi blacklist?`,
      onConfirm: async () => {
        setActionId(`blacklist:${item.wordId}`);
        try {
          await deleteAdminCommunityBlacklistKeyword(item.wordId);
          setBlacklist(prev => prev.filter(keyword => keyword.wordId !== item.wordId));
          setModerationStats(prev => ({ ...prev, blockedKeywords: Math.max(0, prev.blockedKeywords - 1) }));
          toast.success("Đã xóa từ khóa cấm");
        } catch (error) {
          toast.error((error as Error).message || "Không thể xóa từ khóa");
        } finally {
          setActionId(null);
        }
      }
    });
  };

  const copyTargetId = async (targetId: string) => {
    try {
      await navigator.clipboard.writeText(targetId);
      toast.success("Đã sao chép target ID");
    } catch {
      toast.error("Không thể sao chép target ID");
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reload(0);
  };

  const refreshCurrentView = () => {
    loadModerationStats();
    reload(page);
  };

  /* ── Left border color by status ── */
  const postBorder = (status: CommunityPostStatus) => ({
    PENDING_MODERATION: "border-l-amber-400",
    APPROVED: "border-l-emerald-400",
    HIDDEN: "border-l-rose-400",
    DELETED: "border-l-slate-300",
  }[status] ?? "border-l-slate-200");

  const commentBorder = (status: PostCommentStatus) => ({
    PENDING_MODERATION: "border-l-amber-400",
    VISIBLE: "border-l-emerald-400",
    HIDDEN: "border-l-rose-400",
    DELETED: "border-l-slate-300",
  }[status] ?? "border-l-slate-200");

  const reportBorder = (status: ContentReportStatus) => ({
    PENDING: "border-l-amber-400",
    REVIEWED: "border-l-blue-400",
    DISMISSED: "border-l-slate-300",
  }[status] ?? "border-l-slate-200");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mx-auto max-w-7xl space-y-5 font-sans ${isDashboard ? "p-0" : "px-4 py-8"}`}
    >
      {/* ── Page Header (standalone mode only) ── */}
      {!isDashboard && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Kiểm duyệt cộng đồng</h1>
              <p className="text-xs text-slate-400 font-medium">Duyệt nội dung · Xử lý vi phạm · Quản lý từ khóa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshCurrentView}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      )}

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${stat.color} p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.accent}`}>{stat.value.toLocaleString("vi-VN")}</p>
                  {stat.pulse && stat.value > 0 && (
                    <p className="mt-1.5 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Cần xử lý ngay
                    </p>
                  )}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg} text-white shadow-lg`}>
                  <Icon size={20} />
                </div>
              </div>
              {/* decorative */}
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <Icon size={80} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Main Panel ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Tab bar + filters */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 pt-4 pb-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-[12px] font-bold transition-all whitespace-nowrap border-b-2 ${
                    active
                      ? "border-[#FF6B00] text-[#FF6B00]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
          {(activeTab === "posts" || activeTab === "comments") && (
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Tìm kiếm nội dung hoặc tác giả..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-[12px] font-medium outline-none transition focus:border-[#FF6B00] focus:bg-white focus:ring-2 focus:ring-[#FF6B00]/10"
              />
            </form>
          )}

          {activeTab === "posts" && (
            <SelectField label="Trạng thái" value={postStatus} onChange={setPostStatus} options={POST_STATUS_OPTIONS} />
          )}
          {activeTab === "comments" && (
            <SelectField label="Trạng thái" value={commentStatus} onChange={setCommentStatus} options={COMMENT_STATUS_OPTIONS} />
          )}
          {activeTab === "reports" && (
            <>
              <SelectField label="Trạng thái" value={reportStatus} onChange={setReportStatus} options={REPORT_STATUS_OPTIONS} />
              <SelectField label="Loại nội dung" value={reportTarget} onChange={setReportTarget} options={REPORT_TARGET_OPTIONS} />
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {activeTab !== "blacklist" && (
              <span className="text-[11px] font-semibold text-slate-400">
                <BarChart3 size={12} className="inline mr-1" />
                {totalItems.toLocaleString("vi-VN")} mục
              </span>
            )}
            {isDashboard && (
              <button
                type="button"
                onClick={refreshCurrentView}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Làm mới
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="min-h-[420px] p-4">

          {/* Loading state */}
          {loading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
              <p className="text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* ── POSTS ── */}
          {!loading && activeTab === "posts" && (
            <div className="space-y-3">
              <AnimatePresence>
                {posts.map((post, idx) => (
                  <motion.div
                    key={post.postId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className={`flex gap-4 rounded-xl border border-slate-200 border-l-4 ${postBorder(post.status)} bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 xl:flex-row flex-col`}
                  >
                    {/* Left: content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <AuthorCell author={post.author} />
                        <StatusBadge status={post.status} label={POST_STATUS_LABELS[post.status]} />
                      </div>

                      <p className="text-[13px] leading-relaxed text-slate-600 break-words">{excerpt(post.content)}</p>

                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.hashtags.map(tag => (
                            <span key={tag} className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-[#FF6B00]">#{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {post.likeCount} thích</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} /> {post.commentCount} bình luận</span>
                        {post.reportCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-rose-500 font-bold">
                              <AlertTriangle size={11} /> {post.reportCount} báo cáo
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(post.createdAt)}</span>
                      </div>

                      {post.adminNote && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                          <span className="font-bold">Ghi chú admin:</span> {post.adminNote}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-row xl:flex-col gap-2 xl:w-36 shrink-0 xl:justify-start">
                      <ActionButton
                        disabled={actionId === post.postId || post.status === "APPROVED"}
                        tone="success"
                        onClick={() => updatePostStatus(post, "APPROVED")}
                      >
                        <CheckCircle2 size={12} /> Duyệt
                      </ActionButton>
                      <ActionButton
                        disabled={actionId === post.postId || post.status === "HIDDEN"}
                        tone="danger"
                        onClick={() => updatePostStatus(post, "HIDDEN")}
                      >
                        <EyeOff size={12} /> Ẩn bài
                      </ActionButton>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {posts.length === 0 && <EmptyState />}
            </div>
          )}

          {/* ── COMMENTS ── */}
          {!loading && activeTab === "comments" && (
            <div className="space-y-3">
              <AnimatePresence>
                {comments.map((comment, idx) => (
                  <motion.div
                    key={comment.commentId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className={`flex gap-4 rounded-xl border border-slate-200 border-l-4 ${commentBorder(comment.status)} bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 xl:flex-row flex-col`}
                  >
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <AuthorCell author={comment.author} />
                        <StatusBadge status={comment.status} label={COMMENT_STATUS_LABELS[comment.status]} />
                      </div>

                      <p className="text-[13px] leading-relaxed text-slate-600 break-words">{excerpt(comment.content)}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5">
                          <Hash size={10} /> Bài: {comment.postId.slice(0, 8)}...
                        </span>
                        {comment.reportCount > 0 && (
                          <span className="flex items-center gap-1 text-rose-500 font-bold">
                            <AlertTriangle size={11} /> {comment.reportCount} báo cáo
                          </span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(comment.createdAt)}</span>
                      </div>

                      {comment.adminNote && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                          <span className="font-bold">Ghi chú admin:</span> {comment.adminNote}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row xl:flex-col gap-2 xl:w-36 shrink-0">
                      <ActionButton
                        disabled={actionId === comment.commentId || comment.status === "VISIBLE"}
                        tone="success"
                        onClick={() => updateCommentStatus(comment, "VISIBLE")}
                      >
                        <CheckCircle2 size={12} /> Hiển thị
                      </ActionButton>
                      <ActionButton
                        disabled={actionId === comment.commentId || comment.status === "HIDDEN"}
                        tone="danger"
                        onClick={() => updateCommentStatus(comment, "HIDDEN")}
                      >
                        <EyeOff size={12} /> Ẩn đi
                      </ActionButton>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {comments.length === 0 && <EmptyState />}
            </div>
          )}

          {/* ── REPORTS ── */}
          {!loading && activeTab === "reports" && (
            <div className="space-y-3">
              <AnimatePresence>
                {reports.map((report, idx) => {
                  const typeStyles: Record<string, string> = {
                    POST: "bg-blue-50 text-blue-700 border-blue-200",
                    COMMENT: "bg-purple-50 text-purple-700 border-purple-200",
                    MESSAGE: "bg-slate-50 text-slate-700 border-slate-200",
                  };
                  return (
                    <motion.div
                      key={report.reportId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className={`flex gap-4 rounded-xl border border-slate-200 border-l-4 ${reportBorder(report.status)} bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 xl:flex-row flex-col`}
                    >
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <AuthorCell author={report.reporter} />
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">Người báo cáo</span>
                          </div>
                          <StatusBadge status={report.status} label={REPORT_STATUS_LABELS[report.status]} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeStyles[report.targetType] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {report.targetType}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyTargetId(report.targetId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition active:scale-95"
                          >
                            <Copy size={9} /> ID: {report.targetId.slice(0, 10)}...
                          </button>
                        </div>

                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                          <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mb-1.5">
                            <Flag size={11} /> Lý do báo cáo:
                          </p>
                          <p className="text-[13px] text-slate-700 leading-relaxed">{excerpt(report.reason || "Không có lý do chi tiết")}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-[11px] font-medium text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(report.createdAt)}</span>
                          {report.reviewedAt && (
                            <span className="flex items-center gap-1 text-blue-500">
                              <CheckCircle2 size={11} /> Đã xử lý: {formatDate(report.reviewedAt)}
                            </span>
                          )}
                        </div>

                        {report.adminNote && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                            <span className="font-bold">Ghi chú admin:</span> {report.adminNote}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row xl:flex-col gap-2 xl:w-36 shrink-0">
                        <ActionButton
                          disabled={actionId === report.reportId || report.status === "REVIEWED"}
                          tone="success"
                          onClick={() => updateReportStatus(report, "REVIEWED")}
                        >
                          <CheckCircle2 size={12} /> Xử lý xong
                        </ActionButton>
                        <ActionButton
                          disabled={actionId === report.reportId || report.status === "DISMISSED"}
                          tone="neutral"
                          onClick={() => updateReportStatus(report, "DISMISSED")}
                        >
                          <AlertTriangle size={12} /> Bỏ qua
                        </ActionButton>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {reports.length === 0 && <EmptyState />}
            </div>
          )}

          {/* ── BLACKLIST ── */}
          {!loading && activeTab === "blacklist" && (
            <div className="space-y-5">
              {/* Add keyword form */}
              <form
                onSubmit={addKeyword}
                className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25">
                  <Hash size={16} />
                </div>
                <input
                  value={newKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword(e.target.value)}
                  placeholder="Nhập từ khóa nhạy cảm cần chặn..."
                  maxLength={100}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10"
                />
                <button
                  type="submit"
                  disabled={actionId === "blacklist:add" || !newKeyword.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-[12px] font-bold text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#e85f00] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                >
                  <Plus size={13} /> Thêm từ khóa
                </button>
              </form>

              {/* Keyword grid */}
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence>
                  {blacklist.map((item, idx) => (
                    <motion.div
                      key={item.wordId}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.18, delay: idx * 0.02 }}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#FF6B00]/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Ban size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-800">{item.keyword}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <Clock size={9} /> {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteKeyword(item)}
                        disabled={actionId === `blacklist:${item.wordId}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-150 active:scale-90 disabled:opacity-40"
                        title="Xóa từ khóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {blacklist.length === 0 && <EmptyState label="Chưa có từ khóa nào bị chặn." />}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {activeTab !== "blacklist" && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400">
              Trang {page + 1} / {totalPages} · {totalItems.toLocaleString("vi-VN")} mục
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || page <= 0}
                onClick={() => reload(Math.max(0, page - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-[2rem] text-center text-[12px] font-bold text-slate-600">{page + 1}</span>
              <button
                type="button"
                disabled={loading || page + 1 >= totalPages}
                onClick={() => reload(page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

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
    </motion.div>
  );
}

/* ── Empty State ── */
function EmptyState({ label = "Không có nội dung nào cần kiểm duyệt." }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <ShieldAlert size={24} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-500">{label}</p>
        <p className="text-[11px] text-slate-400 mt-1">Tất cả nội dung đều đã được xử lý.</p>
      </div>
    </div>
  );
}
