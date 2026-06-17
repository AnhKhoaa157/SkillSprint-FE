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
  Sparkles,
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
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Filter list
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read;
    return true;
  });

  const handleMarkAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.read);
    if (unreadOnes.length === 0) return;
    setIsClearingAll(true);
    try {
      // Sequentially mark as read
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

    // Interactive routing based on type
    if (notif.type === "FEEDBACK_REPLIED") {
      navigate("/app/profile?tab=feedback");
      return;
    }
    if (notif.workspaceId) {
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
          icon: <FileText size={18} className="stroke-[2.2]" />,
          label: "Tài liệu học tập"
        };
      case "MATERIAL_PROCESSING_FAILED":
        return {
          bg: "bg-rose-50 text-rose-600 border-rose-100",
          icon: <AlertTriangle size={18} className="stroke-[2.2]" />,
          label: "Xử lý lỗi"
        };
      case "ROADMAP_READY":
        return {
          bg: "bg-indigo-50 text-indigo-650 border-indigo-100",
          icon: <Brain size={18} className="stroke-[2.5]" />,
          label: "Lộ trình AI"
        };
      case "TASK_REMINDER":
        return {
          bg: "bg-amber-50 text-amber-600 border-amber-100",
          icon: <Clock size={18} className="stroke-[2.2]" />,
          label: "Nhắc nhở học tập"
        };
      case "TASK_OVERDUE":
        return {
          bg: "bg-red-50 text-red-650 border-red-100",
          icon: <AlertTriangle size={18} className="stroke-[2.2]" />,
          label: "Quá hạn bài tập"
        };
      case "AI_SCHEDULE_READY":
        return {
          bg: "bg-blue-50 text-blue-600 border-blue-100",
          icon: <Sparkles size={18} className="stroke-[2.2]" />,
          label: "Lịch học AI"
        };
      case "FEEDBACK_REPLIED":
        return {
          bg: "bg-violet-50 text-violet-600 border-violet-100",
          icon: <MessageSquare size={18} className="stroke-[2.2]" />,
          label: "Phản hồi"
        };
      case "SYSTEM_INFO":
        return {
          bg: "bg-orange-50 text-orange-600 border-orange-100",
          icon: <Shield size={18} className="stroke-[2.2]" />,
          label: "Hệ thống",
          labelColor: "text-orange-600"
        };
      case "SYSTEM_WARNING":
        return {
          bg: "bg-red-50 text-red-600 border-red-100",
          icon: <AlertTriangle size={18} className="stroke-[2.2]" />,
          label: "Cảnh báo"
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-100",
          icon: <Bell size={18} className="stroke-[2.2]" />,
          label: "Thông báo"
        };
    }
  }

  function formatDate(isoString: string) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Vừa xong";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7E21] flex items-center justify-center border border-orange-100/60 shadow-sm shadow-orange-50/50">
            <Bell size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Trung tâm thông báo</h1>
            <p className="text-slate-500 text-sm mt-1">
              Theo dõi và quản lý toàn bộ các thông báo, lịch nhắc nhở từ AI Assistant của bạn.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isClearingAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-350 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isClearingAll ? (
                <LoaderCircle size={14} className="animate-spin text-slate-500" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-600" />
              )}
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs and Count Summary */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              filter === "unread"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/50">
            Bạn có {unreadCount} thông báo mới chưa đọc
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-4 shadow-sm">
                <Inbox size={24} className="stroke-[1.8]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">Không có thông báo nào</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                {filter === "unread"
                  ? "Bạn đã đọc hết toàn bộ các thông báo. Tuyệt vời!"
                  : "Chưa có thông báo hoặc lời nhắc nhở nào từ hệ thống."}
              </p>
            </motion.div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notif) => {
                const visuals = getNotifVisuals(notif.type);
                return (
                  <motion.div
                    key={notif.notificationId}
                    layoutId={notif.notificationId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-start gap-4 p-5 transition-all relative ${
                      !notif.read
                        ? "bg-[#FFF7ED] hover:bg-[#FFF7ED]/80"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#FF7E21]" />
                    )}

                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${visuals.bg}`}>
                      {visuals.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-extrabold uppercase tracking-wider ${visuals.labelColor || 'text-slate-400'}`}>
                          {visuals.label}
                        </span>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <h4 className={`text-sm font-extrabold leading-snug tracking-tight text-slate-800 ${!notif.read ? 'text-slate-900' : ''}`}>
                        {notif.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-medium">
                        {notif.message}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.notificationId)}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#FF7E21] hover:text-[#FF7E21] text-slate-500 transition-colors shadow-sm cursor-pointer"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      
                      {notif.workspaceId && !notif.type.startsWith("SYSTEM_") ? (
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="p-2 rounded-lg border border-slate-250 bg-white hover:border-[#FF7E21] hover:bg-orange-50/20 hover:text-[#E05E00] text-slate-700 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                          Truy cập <ArrowRight size={13} />
                        </button>
                      ) : (notif.type === "TASK_REMINDER" || notif.type === "TASK_OVERDUE") ? (
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="p-2 rounded-lg border border-slate-250 bg-white hover:border-[#FF7E21] hover:bg-orange-50/20 hover:text-[#E05E00] text-slate-700 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                          Lịch học <ArrowRight size={13} />
                        </button>
                      ) : (notif.type === "FEEDBACK_REPLIED") ? (
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="p-2 rounded-lg border border-slate-250 bg-white hover:border-violet-400 hover:bg-violet-50/40 hover:text-violet-700 text-slate-700 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                          Xem phản hồi <ArrowRight size={13} />
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
