import {
  LayoutDashboard,
  UploadCloud,
  Sparkles,
  Map,
  Calendar,
  CheckSquare,
  BarChart2,
  Trophy,
  Settings,
  Users,
  TrendingUp,
  Building2,
} from "lucide-react";

export const ADMIN_NAV = [
  { id: "users",      label: "Người học & Nhóm học", icon: Users     },
  { id: "financials", label: "Tài chính",           icon: TrendingUp },
  { id: "b2b",        label: "Đối tác B2B",         icon: Building2  },
];

export const APP_NAV = [
  { path: "/app",                label: "Trung tâm điều khiển", icon: LayoutDashboard, end: true },
  { path: "/app/syllabus",       label: "Nhập syllabus",        icon: UploadCloud },
  { path: "/app/roadmap",        label: "Lộ trình AI",          icon: Sparkles },
  { path: "/app/workspaces",     label: "Workspaces",          icon: Map },
  { path: "/app/calendar",       label: "Lịch học",             icon: Calendar },
  { path: "/app/matrix",         label: "Ma trận công việc",    icon: CheckSquare },
  { path: "/app/analytics",      label: "Phân tích",            icon: BarChart2 },
  { path: "/app/leaderboard",    label: "Bảng xếp hạng",        icon: Trophy },
  { path: "/app/profile",        label: "Cài đặt",              icon: Settings },
];

export default { ADMIN_NAV, APP_NAV };
