import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Roadmap from "./pages/workspace/Roadmap";
import Profile from "./pages/core/Profile";
import Landing from "./pages/public/Landing";
import About from "./pages/public/About";
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";
import Contact from "./pages/public/Contact";
import AdminDashboard from "./pages/admin/dashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminHealth from "./pages/admin/sections/health";
import AdminAuth from "./pages/admin/auth";
import AdminUsers from "./pages/admin/sections/users";
import AdminUserDetail from "./pages/admin/userDetail";
import AdminUserPointHistory from "./pages/admin/sections/leaderboard/AdminUserPointHistoryPage";
import AdminProfile from "./pages/admin/profile";
import AdminFeedback from "./pages/admin/sections/feedback";
import AdminCommunityModeration from "./pages/admin/sections/community";
import PostUpgradeDashboard from "./pages/core/PostUpgrade";
import FeaturesLanding from "./pages/public/Features";
import PricingPage from "./pages/public/PricingPage";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import Cookies from "./pages/public/Cookies";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdminAuth from "./components/auth/RequireAdminAuth";
import Loading from "./pages/core/Loading";
import StudyCalendar from "./pages/learning/StudyCalendar";
import TaskMatrix from "./pages/workspace/TaskMatrix";
import Leaderboard from "./pages/leaderboard";
import CoursePlayer from "./pages/learning/CoursePlayer";
import QuizPage from "./pages/learning/QuizPage";
import Workspaces from "./pages/workspace/Workspaces";
import WorkspaceDetail from "./pages/workspace/WorkspaceDetail";
import ProgressPage from "./pages/workspace/ProgressPage";
import WorkspacesNew from "./pages/deprecated/WorkspacesNew";
import NotificationsPage from "./pages/core/NotificationsPage";
import FeedbackPage from "./pages/core/FeedbackPage";
import CommunityFeed from "./pages/community/CommunityFeed";
import CommunityRooms from "./pages/community/CommunityRooms";
import CommunityRoomChat from "./pages/community/CommunityRoomChat";

export const routeRegistry = {
  public: {
    home: "/",
    about: "/about",
    features: "/features",
    pricing: "/pricing",
    login: "/login",
    auth: "/auth",
    authCallback: "/auth/callback",
    loading: "/loading",
    contact: "/contact",
    onboarding: "/onboarding",
    adminLogin: "/admin-login",
    learning: "/learning",
    course: "/learning/course",
    quizReview: "/quiz-review",
    quizResult: "/quiz-review/result",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
  },
  admin: {
    root: "/admin",
    profile: "profile",
    users: "users",
    userDetail: "users/:id",
    userPoints: "users/:id/points",
    health: "health",
    feedback: "feedback",
    communityModeration: "community/moderation",
  },
  app: {
    root: "/app",
    syllabus: "syllabus",
    calendar: "calendar",
    matrix: "matrix",
    workspaces: {
      list: "workspaces",
      new: "workspaces/new",
      detail: "workspaces/:id",
      roadmap: "workspaces/:workspaceId/roadmap",
      progress: "workspaces/:workspaceId/progress",
    },
    progress: "progress",
    profile: "profile",
    leaderboard: "leaderboard",
    notifications: "notifications",
    upgraded: "upgraded",
    feedback: "feedback",
    learning: "learning",
    community: "community",
    communityRooms: "community/rooms",
    communityRoomChat: "community/rooms/:roomId",
    learningCourse: "learning/course",
    learningQuiz: "learning/quiz/:quizId",
    quizReview: "quiz-review",
    quizResult: "quiz-review/result",
    fallback: "*",
  },
} as const;

// Wrapper created without JSX to keep this file .ts-compatible.
const ProtectedLayout = () => React.createElement(RequireAuth, null, React.createElement(DashboardLayout, null));
const ProtectedAdminLayout = () => React.createElement(RequireAdminAuth, null, React.createElement(AdminLayout, null));

const { public: publicRoutes, admin: adminRoutes, app: appRoutes } = routeRegistry;

export const router = createBrowserRouter([
  {
    // Pathless root layout — provides PomodoroContext (needs useBlocker, so must
    // live inside the router tree rather than above RouterProvider).
    Component: RootLayout,
    children: [
      { path: publicRoutes.home, Component: Landing },
      { path: publicRoutes.about, Component: About },
      { path: publicRoutes.features, Component: FeaturesLanding },
      { path: publicRoutes.pricing, Component: PricingPage },
      { path: publicRoutes.login, Component: Auth },
      { path: publicRoutes.authCallback, Component: AuthCallback },
      { path: publicRoutes.auth, element: React.createElement(Navigate, { to: "/login", replace: true }) },
      { path: publicRoutes.loading, Component: Loading },
      { path: publicRoutes.contact, Component: Contact },
      { path: publicRoutes.adminLogin, Component: AdminAuth },
      { path: publicRoutes.privacy, Component: Privacy },
      { path: publicRoutes.terms, Component: Terms },
      { path: publicRoutes.cookies, Component: Cookies },
      {
        path: adminRoutes.root,
        Component: ProtectedAdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: adminRoutes.profile, Component: AdminProfile },
          { path: adminRoutes.users, Component: AdminUsers },
          { path: adminRoutes.userDetail, Component: AdminUserDetail },
          { path: adminRoutes.userPoints, Component: AdminUserPointHistory },
          { path: adminRoutes.health, Component: AdminHealth },
          { path: adminRoutes.feedback, Component: AdminFeedback },
          { path: adminRoutes.communityModeration, Component: AdminCommunityModeration },
        ],
      },
      { path: publicRoutes.course, Component: CoursePlayer },
      { path: publicRoutes.quizReview, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
      { path: publicRoutes.quizResult, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
      {
        path: appRoutes.root,
        Component: ProtectedLayout,
        children: [
          { index: true, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
          { path: appRoutes.syllabus, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
          { path: appRoutes.calendar, Component: StudyCalendar },
          { path: appRoutes.matrix, Component: TaskMatrix },
          { path: appRoutes.workspaces.list, Component: Workspaces },
          { path: appRoutes.workspaces.new, Component: WorkspacesNew },
          { path: appRoutes.workspaces.detail, Component: WorkspaceDetail },
          { path: appRoutes.workspaces.roadmap, Component: Roadmap },
          { path: appRoutes.workspaces.progress, Component: ProgressPage },
          { path: "roadmap", Component: Roadmap },
          { path: appRoutes.progress, Component: ProgressPage },
          { path: appRoutes.profile, Component: Profile },
          { path: appRoutes.leaderboard, Component: Leaderboard },
          { path: appRoutes.notifications, Component: NotificationsPage },
          { path: appRoutes.upgraded, Component: PostUpgradeDashboard },
          { path: appRoutes.feedback, Component: FeedbackPage },
          { path: appRoutes.community, Component: CommunityFeed },
          { path: appRoutes.communityRooms, Component: CommunityRooms },
          { path: appRoutes.communityRoomChat, Component: CommunityRoomChat },
          { path: appRoutes.learningCourse, Component: CoursePlayer },
          { path: appRoutes.learningQuiz, Component: QuizPage },
          { path: appRoutes.quizReview, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
          { path: appRoutes.quizResult, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
          { path: appRoutes.fallback, element: React.createElement(Navigate, { to: "/app/workspaces", replace: true }) },
        ],
      },
    ],
  },
]);
