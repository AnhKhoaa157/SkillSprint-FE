import { Users, TrendingUp, Building2, Settings } from "lucide-react";

export const ADMIN_NAV = [
  { id: "users",      label: "Người học & Nhóm học", icon: Users     },
  { id: "financials", label: "Tài chính",           icon: TrendingUp },
  { id: "b2b",        label: "Đối tác B2B",         icon: Building2  },
];

export const APP_NAV = [
  { path: "/app",                label: "Trung tâm điều khiển", icon: undefined, end: true },
  { path: "/app/syllabus",       label: "Nhập syllabus",        icon: undefined },
  { path: "/app/roadmap",        label: "Lộ trình AI",          icon: undefined },
  { path: "/app/workspaces",     label: "Workspaces",          icon: undefined },
  { path: "/app/calendar",       label: "Lịch học",             icon: undefined },
  { path: "/app/matrix",         label: "Ma trận công việc",    icon: undefined },
  { path: "/app/analytics",      label: "Phân tích",            icon: undefined },
  { path: "/app/leaderboard",    label: "Bảng xếp hạng",        icon: undefined },
  { path: "/app/profile",        label: "Cài đặt",              icon: Settings },
];

export default { ADMIN_NAV, APP_NAV };
