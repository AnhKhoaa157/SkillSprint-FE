import type { FeedbackStatus } from "../../../../../api/feedbackService";

export interface AdminFeedbackProps {
  isDashboard?: boolean;
}

export interface ConfirmAction {
  type: "delete" | "close";
  feedbackId: string;
  title: string;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
export const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",      color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  IMPROVEMENT: { label: "Cải tiến", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  QUESTION:    { label: "Câu hỏi",  color: "#0284C7", bg: "rgba(2,132,199,0.08)" },
  OTHER:       { label: "Khác",     color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

export const FEEDBACK_STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: "Chờ xử lý",  color: "#B45309", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.28)"  },
  IN_PROGRESS: { label: "Đang xử lý", color: "#0284C7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.28)"   },
  CLOSED:      { label: "Đã đóng",    color: "#15803D", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)"   },
};

export const sanitizeFeedbackStatus = (status: string | undefined | null): FeedbackStatus => {
  if (!status) return "OPEN" as FeedbackStatus;
  const upper = status.toUpperCase();
  if (upper === "PENDING") return "OPEN" as FeedbackStatus;
  if (upper === "REVIEWED") return "IN_PROGRESS" as FeedbackStatus;
  if (["OPEN", "IN_PROGRESS", "CLOSED"].includes(upper)) return upper as FeedbackStatus;
  return "OPEN" as FeedbackStatus;
};

// Tolerant image-link detector — handles CDN URLs and missing extensions
export function isImageLink(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  const isCdn =
    clean.includes("bing.com/th/") ||
    clean.includes("th.bing.com/th/") ||
    clean.includes("image") ||
    clean.includes("?w=");
  const hasExt = /\.(png|jpg|jpeg|webp|gif|avif|bmp|svg)$/i.test(clean.split(/[?#]/)[0]);
  return hasExt || isCdn;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
