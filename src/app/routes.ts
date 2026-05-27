import React from "react";
import { createBrowserRouter } from "react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminHealth from "./pages/AdminHealth";
import AdminAuth from "./pages/AdminAuth";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminProfile from "./pages/AdminProfile";
import PostUpgradeDashboard from "./pages/PostUpgrade";
import FeaturesLanding from "./pages/Features";
import PricingPage from "./pages/PricingPage";
import RequireAuth from "./components/RequireAuth";
import Loading from "./pages/Loading";
import SyllabusInput from "./pages/SyllabusInput";
import StudyCalendar from "./pages/StudyCalendar";
import TaskMatrix from "./pages/TaskMatrix";
import Leaderboard from "./pages/Leaderboard";
import LearningEcosystem from "./pages/LearningEcosystem";
import CoursePlayer from "./pages/CoursePlayer";
import QuizReviewFlow from "./pages/QuizReviewFlow";
import QuizResult from "./pages/QuizResult";
import Workspaces from "./pages/Workspaces.tsx";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import WorkspacesNew from "./pages/WorkspacesNew";

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
    analytics: "analytics",
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
      { path: appRoutes.analytics, Component: Analytics },
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