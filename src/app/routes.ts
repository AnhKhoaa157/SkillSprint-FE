import React from "react";
import { createBrowserRouter } from "react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/workspace/Dashboard";
import Roadmap from "./pages/workspace/Roadmap";
import Profile from "./pages/core/Profile";
import Landing from "./pages/public/Landing";
import About from "./pages/public/About";
import Auth from "./pages/auth/Auth";
import Contact from "./pages/public/Contact";
import Onboarding from "./pages/auth/Onboarding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminHealth from "./pages/admin/AdminHealth";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminProfile from "./pages/admin/AdminProfile";
import PostUpgradeDashboard from "./pages/core/PostUpgrade";
import FeaturesLanding from "./pages/public/Features";
import PricingPage from "./pages/public/PricingPage";
import RequireAuth from "./components/auth/RequireAuth";
import Loading from "./pages/core/Loading";
import SyllabusInput from "./pages/learning/SyllabusInput";
import StudyCalendar from "./pages/learning/StudyCalendar";
import TaskMatrix from "./pages/workspace/TaskMatrix";
import Leaderboard from "./pages/core/Leaderboard";
import LearningEcosystem from "./pages/learning/LearningEcosystem";
import CoursePlayer from "./pages/learning/CoursePlayer";
import QuizReviewFlow from "./pages/learning/QuizReviewFlow";
import QuizResult from "./pages/learning/QuizResult";
import Workspaces from "./pages/workspace/Workspaces";
import WorkspaceDetail from "./pages/workspace/WorkspaceDetail";
import WorkspacesNew from "./pages/deprecated/WorkspacesNew";

export const routeRegistry = {
  public: {
    home: "/",
    about: "/about",
    features: "/features",
    pricing: "/pricing",
    auth: "/auth",
    loading: "/loading",
    contact: "/contact",
    onboarding: "/onboarding",
    adminLogin: "/admin-login",
    learning: "/learning",
    course: "/learning/course",
    quizReview: "/quiz-review",
    quizResult: "/quiz-review/result",
  },
  admin: {
    root: "/admin",
    profile: "profile",
    users: "users",
    userDetail: "users/:id",
    health: "health",
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
    },
    profile: "profile",
    leaderboard: "leaderboard",
    upgraded: "upgraded",
    learning: "learning",
    learningCourse: "learning/course",
    quizReview: "quiz-review",
    quizResult: "quiz-review/result",
    fallback: "*",
  },
} as const;

// Wrapper created without JSX to keep this file .ts-compatible.
const ProtectedLayout = () => React.createElement(RequireAuth, null, React.createElement(DashboardLayout, null));

const { public: publicRoutes, admin: adminRoutes, app: appRoutes } = routeRegistry;

export const router = createBrowserRouter([
  { path: publicRoutes.home, Component: Landing },
  { path: publicRoutes.about, Component: About },
  { path: publicRoutes.features, Component: FeaturesLanding },
  { path: publicRoutes.pricing, Component: PricingPage },
  { path: publicRoutes.auth, Component: Auth },
  { path: publicRoutes.loading, Component: Loading },
  { path: publicRoutes.contact, Component: Contact },
  { path: publicRoutes.onboarding, Component: Onboarding },
  { path: publicRoutes.adminLogin, Component: AdminAuth },
  {
    path: adminRoutes.root,
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: adminRoutes.profile, Component: AdminProfile },
      { path: adminRoutes.users, Component: AdminUsers },
      { path: adminRoutes.userDetail, Component: AdminUserDetail },
      { path: adminRoutes.health, Component: AdminHealth },
    ],
  },
  { path: publicRoutes.learning, Component: LearningEcosystem },
  { path: publicRoutes.course, Component: CoursePlayer },
  { path: publicRoutes.quizReview, Component: QuizReviewFlow },
  { path: publicRoutes.quizResult, Component: QuizResult },
  {
    path: appRoutes.root,
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: appRoutes.syllabus, Component: SyllabusInput },
      { path: appRoutes.calendar, Component: StudyCalendar },
      { path: appRoutes.matrix, Component: TaskMatrix },
      { path: appRoutes.workspaces.list, Component: Workspaces },
      { path: appRoutes.workspaces.new, Component: WorkspacesNew },
      { path: appRoutes.workspaces.detail, Component: WorkspaceDetail },
      { path: appRoutes.workspaces.roadmap, Component: Roadmap },
      { path: appRoutes.profile, Component: Profile },
      { path: appRoutes.leaderboard, Component: Leaderboard },
      { path: appRoutes.upgraded, Component: PostUpgradeDashboard },
      { path: appRoutes.learning, Component: LearningEcosystem },
      { path: appRoutes.learningCourse, Component: CoursePlayer },
      { path: appRoutes.quizReview, Component: QuizReviewFlow },
      { path: appRoutes.quizResult, Component: QuizResult },
      { path: appRoutes.fallback, Component: Dashboard },
    ],
  },
]);