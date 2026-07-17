import {
  LayoutDashboard,
  Map,
  Calendar,
  CheckSquare,
  Trophy,
  Users,
  TrendingUp,
  MessageSquare,
  Zap,
  BarChart3,
  Store,
  PackagePlus,
  BookOpen,
  WalletCards,
  HandCoins,
} from "lucide-react";

export type NavIcon = typeof LayoutDashboard;

export type AppNavItem = {
  path: string;
  label: string;
  icon: NavIcon;
  end?: boolean;
  badge?: boolean | string;
  match?: "exact" | "prefix";
  dynamicChildren?: "workspaces";
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
    label: "Học tập",
    items: [
      { path: "/app/workspaces", label: "Workspaces", icon: Map, badge: true, match: "prefix" },
      { path: "/app/roadmap", label: "Roadmap", icon: Zap, dynamicChildren: "workspaces" },
      { path: "/app/progress", label: "Tiến độ", icon: BarChart3 },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { path: "/app/marketplace", label: "Marketplace", icon: Store, match: "prefix" },
      { path: "/app/my-packs", label: "Gói học của tôi", icon: BookOpen, match: "prefix" },
      { path: "/app/wallet", label: "Ví Coin", icon: WalletCards, match: "prefix" },
      { path: "/app/creator/marketplace", label: "Đóng gói Quiz", icon: PackagePlus, match: "prefix" },
      { path: "/app/creator/earnings", label: "Thu nhập & rút tiền", icon: HandCoins, match: "prefix" },
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
    label: "Kết nối",
    items: [
      { path: "/app/community", label: "Cộng đồng", icon: Users, match: "prefix" },
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
