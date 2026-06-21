import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
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

const TABS: Array<{ id: CommunityTab; label: string; icon: LucideIcon }> = [
  { id: "posts", label: "Bài viết", icon: ShieldAlert },
  { id: "comments", label: "Bình luận", icon: MessageCircle },
  { id: "reports", label: "Báo cáo", icon: Flag },
  { id: "blacklist", label: "Từ khóa cấm", icon: Ban },
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

const STATUS_CLASSES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  VISIBLE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  PENDING_MODERATION: "bg-amber-50 text-amber-700 border-amber-100",
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  HIDDEN: "bg-red-50 text-red-700 border-red-100",
  DELETED: "bg-slate-100 text-slate-600 border-slate-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-100",
  DISMISSED: "bg-slate-100 text-slate-600 border-slate-200",
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

function excerpt(value: string, max = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${STATUS_CLASSES[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {label}
    </span>
  );
}

function AuthorCell({ author }: { author: CommunityAuthorResponse | null }) {
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
        <p className="truncate text-sm font-extrabold text-slate-800">{authorName(author)}</p>
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
        {options.map(option => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
      setBlacklist(await getAdminCommunityBlacklist());
      setTotalItems(0);
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

  const stats = useMemo(() => {
    const pendingPosts = posts.filter(item => item.status === "PENDING_MODERATION").length;
    const pendingComments = comments.filter(item => item.status === "PENDING_MODERATION").length;
    const pendingReports = reports.filter(item => item.status === "PENDING").length;
    return [
      { label: "Chờ duyệt trên trang", value: pendingPosts + pendingComments, accent: "text-amber-600" },
      { label: "Report chờ xử lý", value: pendingReports, accent: "text-red-600" },
      { label: "Từ khóa cấm", value: blacklist.length, accent: "text-slate-900" },
    ];
  }, [blacklist.length, comments, posts, reports]);

  const promptNote = (title: string): string | null => {
    const note = window.prompt(title, "");
    if (note === null) return null;
    return note.trim();
  };

  const updatePostStatus = async (post: CommunityPostResponse, status: CommunityPostStatus) => {
    const note = promptNote("Ghi chú cho thay đổi trạng thái bài viết:");
    if (note === null) return;
    setActionId(post.postId);
    try {
      const updated = await updateAdminCommunityPostStatus(post.postId, { status, adminNote: note || undefined });
      setPosts(prev => prev.map(item => item.postId === updated.postId ? updated : item));
      toast.success("Đã cập nhật trạng thái bài viết");
    } catch (error) {
      toast.error((error as Error).message || "Không thể cập nhật bài viết");
    } finally {
      setActionId(null);
    }
  };

  const updateCommentStatus = async (comment: PostCommentResponse, status: PostCommentStatus) => {
    const note = promptNote("Ghi chú cho thay đổi trạng thái bình luận:");
    if (note === null) return;
    setActionId(comment.commentId);
    try {
      const updated = await updateAdminCommunityCommentStatus(comment.commentId, { status, adminNote: note || undefined });
      setComments(prev => prev.map(item => item.commentId === updated.commentId ? updated : item));
      toast.success("Đã cập nhật trạng thái bình luận");
    } catch (error) {
      toast.error((error as Error).message || "Không thể cập nhật bình luận");
    } finally {
      setActionId(null);
    }
  };

  const updateReportStatus = async (report: ContentReportResponse, status: ContentReportStatus) => {
    const note = promptNote("Ghi chú xử lý báo cáo:");
    if (note === null) return;
    setActionId(report.reportId);
    try {
      const updated = await updateAdminCommunityReportStatus(report.reportId, { status, adminNote: note || undefined });
      setReports(prev => prev.map(item => item.reportId === updated.reportId ? updated : item));
      toast.success("Đã cập nhật trạng thái báo cáo");
    } catch (error) {
      toast.error((error as Error).message || "Không thể cập nhật báo cáo");
    } finally {
      setActionId(null);
    }
  };

  const addKeyword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword) return;
    setActionId("blacklist:add");
    try {
      const created = await addAdminCommunityBlacklistKeyword({ keyword });
      setBlacklist(prev => [created, ...prev]);
      setNewKeyword("");
      toast.success("Đã thêm từ khóa cấm");
    } catch (error) {
      toast.error((error as Error).message || "Không thể thêm từ khóa");
    } finally {
      setActionId(null);
    }
  };

  const deleteKeyword = async (item: BlacklistKeywordResponse) => {
    if (!window.confirm(`Xóa từ khóa "${item.keyword}" khỏi blacklist?`)) return;
    setActionId(`blacklist:${item.wordId}`);
    try {
      await deleteAdminCommunityBlacklistKeyword(item.wordId);
      setBlacklist(prev => prev.filter(keyword => keyword.wordId !== item.wordId));
      toast.success("Đã xóa từ khóa cấm");
    } catch (error) {
      toast.error((error as Error).message || "Không thể xóa từ khóa");
    } finally {
      setActionId(null);
    }
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

  const pageTitle = "Kiểm duyệt cộng đồng";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto max-w-7xl space-y-6 font-sans ${isDashboard ? "p-0" : "px-4 py-8"}`}
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
                Duyệt bài viết, bình luận, report và từ khóa nhạy cảm trong cộng đồng.
              </p>
            </div>
          </div>
          <ActionButton onClick={() => reload(page)} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </ActionButton>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/60">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black ${stat.accent}`}>{stat.value.toLocaleString("vi-VN")}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70">
        <div className="border-b border-slate-100 bg-slate-50/70 p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:flex">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
                      active ? "bg-white text-[#FF6B00] shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              {(activeTab === "posts" || activeTab === "comments") && (
                <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                    placeholder="Tìm nội dung hoặc tác giả"
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
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
                  <SelectField label="Report" value={reportStatus} onChange={setReportStatus} options={REPORT_STATUS_OPTIONS} />
                  <SelectField label="Loại nội dung" value={reportTarget} onChange={setReportTarget} options={REPORT_TARGET_OPTIONS} />
                </>
              )}
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

          {!loading && activeTab === "posts" && (
            <div className="divide-y divide-slate-100">
              {posts.map(post => (
                <div key={post.postId} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <AuthorCell author={post.author} />
                      <StatusBadge status={post.status} label={POST_STATUS_LABELS[post.status]} />
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{excerpt(post.content)}</p>
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.hashtags.map(tag => (
                          <span key={tag} className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-bold text-[#FF6B00]">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                      <span>{post.likeCount} lượt thích</span>
                      <span>{post.commentCount} bình luận</span>
                      <span>{post.reportCount} báo cáo</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    {post.adminNote && <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">Ghi chú: {post.adminNote}</p>}
                  </div>
                  <div className="flex flex-wrap content-start gap-2 xl:justify-end">
                    <ActionButton disabled={actionId === post.postId || post.status === "APPROVED"} tone="success" onClick={() => updatePostStatus(post, "APPROVED")}>
                      <CheckCircle2 size={13} /> Duyệt
                    </ActionButton>
                    <ActionButton disabled={actionId === post.postId || post.status === "HIDDEN"} tone="danger" onClick={() => updatePostStatus(post, "HIDDEN")}>
                      <EyeOff size={13} /> Ẩn
                    </ActionButton>
                  </div>
                </div>
              ))}
              {posts.length === 0 && <EmptyState />}
            </div>
          )}

          {!loading && activeTab === "comments" && (
            <div className="divide-y divide-slate-100">
              {comments.map(comment => (
                <div key={comment.commentId} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <AuthorCell author={comment.author} />
                      <StatusBadge status={comment.status} label={COMMENT_STATUS_LABELS[comment.status]} />
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{excerpt(comment.content)}</p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                      <span>Post ID: {comment.postId}</span>
                      <span>{comment.reportCount} báo cáo</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    {comment.adminNote && <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">Ghi chú: {comment.adminNote}</p>}
                  </div>
                  <div className="flex flex-wrap content-start gap-2 xl:justify-end">
                    <ActionButton disabled={actionId === comment.commentId || comment.status === "VISIBLE"} tone="success" onClick={() => updateCommentStatus(comment, "VISIBLE")}>
                      <CheckCircle2 size={13} /> Hiển thị
                    </ActionButton>
                    <ActionButton disabled={actionId === comment.commentId || comment.status === "HIDDEN"} tone="danger" onClick={() => updateCommentStatus(comment, "HIDDEN")}>
                      <EyeOff size={13} /> Ẩn
                    </ActionButton>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <EmptyState />}
            </div>
          )}

          {!loading && activeTab === "reports" && (
            <div className="divide-y divide-slate-100">
              {reports.map(report => (
                <div key={report.reportId} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_250px]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <AuthorCell author={report.reporter} />
                      <StatusBadge status={report.status} label={REPORT_STATUS_LABELS[report.status]} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">{report.targetType}</span>
                      <button
                        type="button"
                        onClick={() => copyTargetId(report.targetId)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200"
                      >
                        <Copy size={11} /> {report.targetId}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{excerpt(report.reason || "Không có lý do")}</p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                      <span>Tạo: {formatDate(report.createdAt)}</span>
                      <span>Xử lý: {formatDate(report.reviewedAt)}</span>
                    </div>
                    {report.adminNote && <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">Ghi chú: {report.adminNote}</p>}
                  </div>
                  <div className="flex flex-wrap content-start gap-2 xl:justify-end">
                    <ActionButton disabled={actionId === report.reportId || report.status === "REVIEWED"} tone="success" onClick={() => updateReportStatus(report, "REVIEWED")}>
                      <CheckCircle2 size={13} /> Đã xử lý
                    </ActionButton>
                    <ActionButton disabled={actionId === report.reportId || report.status === "DISMISSED"} tone="neutral" onClick={() => updateReportStatus(report, "DISMISSED")}>
                      <AlertTriangle size={13} /> Bỏ qua
                    </ActionButton>
                  </div>
                </div>
              ))}
              {reports.length === 0 && <EmptyState />}
            </div>
          )}

          {!loading && activeTab === "blacklist" && (
            <div className="p-4">
              <form onSubmit={addKeyword} className="mb-4 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#FF6B00]">
                  <Hash size={18} />
                </div>
                <input
                  value={newKeyword}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewKeyword(event.target.value)}
                  placeholder="Nhập từ khóa nhạy cảm cần chặn"
                  maxLength={100}
                  className="h-10 min-w-0 flex-1 rounded-2xl border border-orange-100 bg-white px-3 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="submit"
                  disabled={actionId === "blacklist:add" || !newKeyword.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 px-4 text-xs font-extrabold text-amber-700 transition hover:bg-amber-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Thêm từ khóa
                </button>
              </form>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {blacklist.map(item => (
                  <div key={item.wordId} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-800">{item.keyword}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteKeyword(item)}
                      disabled={actionId === `blacklist:${item.wordId}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              {blacklist.length === 0 && <EmptyState label="Chưa có từ khóa cấm nào." />}
            </div>
          )}
        </div>

        {activeTab !== "blacklist" && (
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-slate-400">
              {totalItems.toLocaleString("vi-VN")} mục · Trang {page + 1}/{totalPages}
            </p>
            <div className="flex gap-2">
              <ActionButton disabled={loading || page <= 0} onClick={() => reload(Math.max(0, page - 1))}>
                Trước
              </ActionButton>
              <ActionButton disabled={loading || page + 1 >= totalPages} onClick={() => reload(page + 1)}>
                Sau
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ label = "Không có dữ liệu phù hợp." }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ShieldAlert size={22} />
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}
