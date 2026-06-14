// Public entry point for admin route-level pages.
// Dashboard sections live under ./sections and are composed by the dashboard shell,
// so they are intentionally not re-exported here.
export { default as AdminDashboard } from "./dashboard";
export { default as AdminAuth }      from "./auth";
export { default as AdminProfile }   from "./profile";
export { default as UserDetailPage } from "./userDetail";
