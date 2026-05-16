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
import AdminAuth from "./pages/AdminAuth";
import PostUpgradeDashboard from "./pages/PostUpgrade";
import FeaturesLanding from "./pages/Features";
import MockInterview from "./pages/MockInterview";

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
  { path: "/auth",          Component: Auth },
  { path: "/contact",       Component: Contact },
  { path: "/onboarding",    Component: Onboarding },
  { path: "/admin-login",   Component: AdminAuth },
  { path: "/admin",         Component: AdminDashboard },
  { path: "/learning",      Component: LearningEcosystem },
  { path: "/learning/course", Component: CoursePlayer },
  { path: "/quiz-review",   Component: QuizReviewFlow },
  { path: "/quiz-review/result", Component: QuizResult },
  {
    path: "/app",
    Component: DashboardLayout,
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