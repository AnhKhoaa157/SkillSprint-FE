import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Brain,
  FileText,
  Clock,
  Zap,
  ArrowRight,
  LoaderCircle,
  Inbox,
  MessageSquare,
  Info,
  Shield
} from "lucide-react";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotificationSocket();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeCategory, setActiveCategory] = useState<"all" | "learning" | "tasks" | "system">("all");
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Filter list by status & category
  const filteredNotifications = notifications.filter((notif) => {
    // 1. Unread status filter
    if (filter === "unread" && notif.read) return false;

    // 2. Category filter
    if (activeCategory === "learning") {
      return ["ROADMAP_READY", "MATERIAL_ANALYSIS_DONE", "MATERIAL_PROCESSING_FAILED", "AI_SCHEDULE_READY"].includes(notif.type);
    }
    if (activeCategory === "tasks") {
      return ["TASK_REMINDER", "TASK_OVERDUE"].includes(notif.type);
    }
    if (activeCategory === "system") {
      return ["SYSTEM_INFO", "SYSTEM_WARNING", "FEEDBACK_REPLIED"].includes(notif.type) || notif.type.startsWith("SYSTEM_");
    }
    return true;
  });

  const handleMarkAllRead = async () => {
    setIsClearingAll(true);
    const unreadOnes = notifications.filter((n) => !n.read);
    if (unreadOnes.length === 0) {
      setIsClearingAll(false);
      return;
    }
    try {
      for (const notif of unreadOnes) {
        await markAsRead(notif.notificationId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    if (!notif.read) {
      await markAsRead(notif.notificationId);
    }

    if (notif.type === "FEEDBACK_REPLIED") {
      navigate("/app/profile?tab=feedback");
      return;
    }
    if (notif.workspaceId && notif.workspaceId !== "system") {
      if (notif.type === "ROADMAP_READY") {
        navigate(`/app/workspaces/${notif.workspaceId}/roadmap`);
      } else {
        navigate(`/app/workspaces/${notif.workspaceId}`);
      }
    } else if (notif.type === "TASK_REMINDER" || notif.type === "TASK_OVERDUE") {
      navigate("/app/calendar");
    }
  };

  function getNotifVisuals(type: string) {
    switch (type) {
      case "MATERIAL_ANALYSIS_DONE":
        return {
          bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
          icon: <FileText size={16} className="stroke-[2]" />,
          label: "Tài liệu",
          labelColor: "text-emerald-700 bg-emerald-50/60 border-emerald-100/50"
        };
      case "MATERIAL_PROCESSING_FAILED":
        return {
          bg: "bg-rose-50 text-rose-600 border-rose-100",
          icon: <AlertTriangle size={16} className="stroke-[2]" />,
          label: "Lỗi xử lý",
          labelColor: "text-rose-700 bg-rose-50/60 border-rose-100/50"
        };
      case "ROADMAP_READY":
        return {
          bg: "bg-indigo-50 text-indigo-650 border-indigo-100",
          icon: <Brain size={16} className="stroke-[2.2]" />,
          label: "AI Roadmap",
          labelColor: "text-indigo-700 bg-indigo-50/60 border-indigo-100/50"
        };
      case "TASK_REMINDER":
        return {
          bg: "bg-amber-50 text-amber-600 border-amber-100",
          icon: <Clock size={16} className="stroke-[2]" />,
          label: "Nhắc nhở",
          labelColor: "text-amber-700 bg-amber-50/60 border-amber-100/50"
        };
      case "TASK_OVERDUE":
        return {
          bg: "bg-red-50 text-red-655 border-red-100",
          icon: <AlertTriangle size={16} className="stroke-[2]" />,
          label: "Quá hạn",
          labelColor: "text-red-700 bg-red-50/60 border-red-100/50"
        };
      case "AI_SCHEDULE_READY":
        return {
          bg: "bg-orange-50 text-[#FF6B00] border-orange-100",
          icon: <Zap size={16} className="stroke-[2]" />,
          label: "AI Lịch học",
          labelColor: "text-orange-700 bg-orange-50/60 border-orange-100/50"
        };
      case "FEEDBACK_REPLIED":
        return {
          bg: "bg-violet-55 text-violet-650 border-violet-100",
          icon: <MessageSquare size={16} className="stroke-[2]" />,
          label: "Phản hồi",
          labelColor: "text-violet-700 bg-violet-50/60 border-violet-100/50"
        };
      case "SYSTEM_INFO":
        return {
          bg: "bg-blue-50 text-blue-600 border-blue-100",
          icon: <Info size={16} className="stroke-[2]" />,
          label: "Hệ thống",
          labelColor: "text-blue-700 bg-blue-50/60 border-blue-100/50"
        };
      case "SYSTEM_WARNING":
        return {
          bg: "bg-orange-50 text-[#FF6B00] border-orange-100",
          icon: <Shield size={16} className="stroke-[2]" />,
          label: "Hệ thống",
          labelColor: "text-orange-700 bg-orange-50/60 border-orange-100/50"
        };
      default:
        return {
          bg: "bg-slate-55 text-slate-650 border-slate-100",
          icon: <Bell size={16} className="stroke-[2]" />,
          label: "Thông báo",
          labelColor: "text-slate-700 bg-slate-50/60 border-slate-100/50"
        };
    }
  }

  function getRelativeTime(isoString: string) {
    const d = new Date(isoString);
    // Invalid, falsy, or pre-2020 (epoch/unparsed) values collapse to "just now".
    if (!isoString || isNaN(d.getTime()) || d.getFullYear() < 2020) return "Vừa xong";
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(d);
  }

  const categories = [
    { id: "all", label: "Tất cả", count: notifications.length },
    {
      id: "learning",
      label: "Học tập",
      count: notifications.filter(n => ["ROADMAP_READY", "MATERIAL_ANALYSIS_DONE", "MATERIAL_PROCESSING_FAILED", "AI_SCHEDULE_READY"].includes(n.type)).length
    },
    {
      id: "tasks",
      label: "Nhiệm vụ",
      count: notifications.filter(n => ["TASK_REMINDER", "TASK_OVERDUE"].includes(n.type)).length
    },
    {
      id: "system",
      label: "Hệ thống",
      count: notifications.filter(n => ["SYSTEM_INFO", "SYSTEM_WARNING", "FEEDBACK_REPLIED"].includes(n.type) || n.type.startsWith("SYSTEM_")).length
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 py-4 antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Thông báo</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật các lộ trình học tập, lịch thi cử và phản hồi từ AI Assistant.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isClearingAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-350 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isClearingAll ? (
                <LoaderCircle size={10} className="animate-spin text-slate-500" />
              ) : (
                <CheckCircle2 size={10} className="text-emerald-500" />
              )}
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex p-0.5 bg-slate-100 border border-slate-200/50 rounded-lg self-start">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-550 hover:text-slate-800"
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filter === "unread"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-550 hover:text-slate-800"
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                  active
                    ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_2px_8px_rgba(255,107,0,0.12)]"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`ml-1 text-[9px] ${active ? "text-orange-100" : "text-slate-400"}`}>
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Cards List */}
      <div className="flex flex-col gap-3 mb-6">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="py-16 text-center border border-slate-150 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 mb-3">
                <Inbox size={16} className="stroke-[1.8]" />
              </div>
              <h3 className="text-[12px] font-bold text-slate-800">Không có thông báo</h3>
              <p className="mt-1 text-[11px] text-slate-550 max-w-sm mx-auto font-medium">
                {filter === "unread"
                  ? "Bạn đã đọc hết toàn bộ các thông báo. Tuyệt vời!"
                  : "Chưa có thông báo hoặc lời nhắc nhở nào từ hệ thống."}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => {
              const visuals = getNotifVisuals(notif.type);
              return (
                <motion.div
                  key={notif.notificationId}
                  layoutId={notif.notificationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300 relative cursor-pointer ${
                    !notif.read
                      ? "bg-gradient-to-r from-orange-500/[0.012] to-white border-orange-200/80 shadow-[0_3px_12px_rgba(255,107,0,0.015)] hover:border-[#FF6B00]/30 hover:shadow-[0_8px_30px_rgba(255,107,0,0.04)]"
                      : "bg-white border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-slate-350 hover:shadow-[0_4px_16px_rgba(0,0,0,0.015)]"
                  } hover:-translate-y-0.5`}
                >
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-200 ${
                    !notif.read ? "border-orange-200/50" : ""
                  } ${visuals.bg}`}>
                    {visuals.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-transparent ${visuals.labelColor}`}>
                          {visuals.label}
                        </span>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00] animate-[pulse_1.2s_infinite]" />
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <h4 className={`text-[13.5px] tracking-tight leading-snug ${
                      !notif.read
                        ? "text-slate-900 font-bold"
                        : "text-slate-550 font-medium"
                    }`}>
                      {notif.title}
                    </h4>
                    <p className="mt-1 text-[12px] text-slate-500 leading-relaxed font-normal">
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-center">
                    {notif.workspaceId && notif.workspaceId !== "system" ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition duration-200 group-hover:border-[#FF6B00]/30 group-hover:text-[#FF6B00] group-hover:bg-orange-50/[0.04]">
                        <span>Truy cập</span>
                        <ArrowRight size={11} className="stroke-[2.5] transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-[#FF6B00]" />
                      </div>
                    ) : (notif.type === "TASK_REMINDER" || notif.type === "TASK_OVERDUE") ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition duration-200 group-hover:border-slate-350 group-hover:bg-slate-555">
                        <span>Lịch học</span>
                        <ArrowRight size={11} className="stroke-[2.5] transition-transform group-hover:translate-x-0.5 text-slate-400" />
                      </div>
                    ) : (notif.type === "FEEDBACK_REPLIED") ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition duration-200 group-hover:border-slate-350 group-hover:bg-slate-555">
                        <span>Phản hồi</span>
                        <ArrowRight size={11} className="stroke-[2.5] transition-transform group-hover:translate-x-0.5 text-slate-400" />
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
