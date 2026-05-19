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
import MockInterview from "./pages/MockInterview";
import RequireAuth from "./components/RequireAuth";
import Loading from "./pages/Loading";

// Wrapper created without JSX to keep this file .ts-compatible
const ProtectedLayout = () => React.createElement(RequireAuth, null, React.createElement(DashboardLayout, null));

import SyllabusInput from "./pages/SyllabusInput";
import StudyCalendar from "./pages/StudyCalendar";
import TaskMatrix from "./pages/TaskMatrix";
import Leaderboard from "./pages/Leaderboard";
import LearningEcosystem from "./pages/LearningEcosystem";
import CoursePlayer from "./pages/CoursePlayer";
import QuizReviewFlow from "./pages/QuizReviewFlow";
import QuizResult from "./pages/QuizResult";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import WorkspacesNew from "./pages/WorkspacesNew";

export const router = createBrowserRouter([
  { path: "/",              Component: Landing },
  { path: "/about",         Component: About },
  { path: "/features",      Component: FeaturesLanding },
  { path: "/pricing",       Component: PricingPage },
  { path: "/auth",          Component: Auth },
  { path: "/loading",       Component: Loading },
  { path: "/contact",       Component: Contact },
  { path: "/onboarding",    Component: Onboarding },
  { path: "/admin-login",   Component: AdminAuth },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "profile", Component: AdminProfile },
      { path: "users", Component: AdminUsers },
      { path: "users/:id", Component: AdminUserDetail },
      { path: "health", Component: AdminHealth },
    ],
  },
  { path: "/learning",      Component: LearningEcosystem },
  { path: "/learning/course", Component: CoursePlayer },
  { path: "/quiz-review",   Component: QuizReviewFlow },
  { path: "/quiz-review/result", Component: QuizResult },
  {
    path: "/app",
    Component: ProtectedLayout,
    children: [
      { index: true,            Component: Dashboard },
      { path: "syllabus",       Component: SyllabusInput },
      { path: "calendar",       Component: StudyCalendar },
      { path: "matrix",         Component: TaskMatrix },
      { path: "workspaces",       Component: Workspaces },
      { path: "workspaces/new",   Component: WorkspacesNew },
      { path: "workspaces/:id",   Component: WorkspaceDetail },
      { path: "roadmap",        Component: Roadmap },
      { path: "analytics",      Component: Analytics },
      { path: "profile",        Component: Profile },
      { path: "leaderboard",    Component: Leaderboard },
      { path: "upgraded",       Component: PostUpgradeDashboard },
      { path: "mock-interview",  Component: MockInterview },
      { path: "learning",       Component: LearningEcosystem },
      { path: "learning/course", Component: CoursePlayer },
      { path: "quiz-review",    Component: QuizReviewFlow },
      { path: "quiz-review/result", Component: QuizResult },
      { path: "*",              Component: Dashboard },
    ],
  },
]);