import {
  LayoutDashboard,
  Sparkles,
  Map,
  Calendar,
  CheckSquare,
  Trophy,
  Users,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

export type NavIcon = typeof LayoutDashboard;

export type AppNavItem = {
  path: string;
  label: string;
  icon: NavIcon;
  end?: boolean;
  badge?: boolean;
  match?: "exact" | "prefix";
};

export type AppNavSection = {
  label: string;
  items: AppNavItem[];
};

export const ADMIN_NAV = [
  { id: "users",      label: "Người học & Nhóm học", icon: Users     },
  { id: "financials", label: "Tài chính",           icon: TrendingUp },
];

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    label: "Học tập & AI",
    items: [
      { path: "/app/roadmap", label: "Lộ trình AI", icon: Sparkles },
      { path: "/app/workspaces", label: "Workspaces", icon: Map, badge: true, match: "prefix" },
    ],
  },
  {
    label: "Quản lý hiệu suất",
    items: [
      { path: "/app/calendar", label: "Lịch học", icon: Calendar },
      { path: "/app/matrix", label: "Ma trận công việc", icon: CheckSquare },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { path: "/app/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
      { path: "/app/feedback", label: "Gửi phản hồi", icon: MessageSquare },
    ],
  },
];

export const APP_NAV = APP_NAV_SECTIONS.flatMap(section => section.items);

export default { ADMIN_NAV, APP_NAV };
