FE (Frontend) Agent Map — SkillSprint Web App UI

Mục đích
- Tập trung sơ đồ cấu trúc frontend và cách các phần kết nối với nhau (entry → router → layouts → pages → components → API services).
- File này dùng làm "agent"/map để: 1) nhanh hiểu codebase, 2) tự động hoá chỉnh sửa (scripts/agents), 3) hướng dẫn dev sửa/chèn tính năng.

1) Entry & bootstrapping
- Entry: src/main.tsx
  - Tạo React root và render <App />.
- App wrapper: src/app/App.tsx
  - Cung cấp RouterProvider với router được export từ src/app/routes.ts

2) Router
- File: src/app/routes.ts
- Sử dụng createBrowserRouter từ react-router
- Các nhóm route chính:
  - Public: /, /about, /features, /pricing, /auth, /contact, /onboarding, ... (Component: Landing, About, Auth...)
  - Admin area: /admin
    - Layout: src/app/layouts/AdminLayout.tsx
    - Children: index -> AdminDashboard, /admin/users -> AdminUsers, /admin/users/:id -> AdminUserDetail, /admin/health -> AdminHealth
  - App area (authenticated): /app
    - Wrapper: RequireAuth -> DashboardLayout (src/app/layouts/DashboardLayout.tsx)
    - Children: /app (Dashboard), /app/roadmap, /app/analytics, /app/profile, /app/workspaces, etc.

3) Layouts
- src/app/layouts/DashboardLayout.tsx
  - Sidebar (main app navigation), top header, user avatar/menu, notifications, footer.
  - Uses getStoredUserProfile() from src/api/authService.ts to show avatar/name.
- src/app/layouts/AdminLayout.tsx
  - Layout used for /admin routes (may contain its own sidebar/header). File exists but may have been edited.

4) Pages (selected)
- src/app/pages/Dashboard.tsx — main user dashboard
- src/app/pages/AdminDashboard.tsx — Admin control center; contains Admin sub-views and the Admin users management UI (we modified this file heavily)
- src/app/pages/AdminUsers.tsx / AdminUserDetail.tsx — standalone admin pages (also routed under /admin)
- src/app/pages/Profile.tsx, Workspaces.tsx, Roadmap.tsx, Analytics.tsx, CoursePlayer.tsx, etc.

5) Shared components
- src/app/components/
  - RequireAuth.tsx — wrapper for protected routes
  - BrandLogo, PricingModal, ReferralModal, etc.
- Many pages embed small UI pieces (Sparkline, charts using recharts, icons from lucide-react)

6) API services (single-responsibility wrappers)
- src/api/authService.ts
  - login, register, confirm, token handling, getStoredAuthSession(), getStoredUserProfile(), storeAuthTokens()
  - Encapsulates token parsing, role extraction from JWTs
- src/api/adminUserService.ts
  - getAdminUsers(search?, page, size): calls GET /api/admin/users
  - getAdminUser(id): GET /api/admin/users/:id
  - updateUserStatus(id, {status}): PATCH /api/admin/users/:id/status
  - updateUserRole(id, {roles}): PATCH /api/admin/users/:id/roles
- src/api/healthService.ts — health subscription/probe utilities
- src/api/dateService.ts — date helpers

7) Auth flow & routing decisions
- Login (src/app/pages/Auth.tsx) calls authService.login() and then authService.storeAuthTokens(); getPostLoginPath(role) decides redirect: '/admin' for admin, '/app' otherwise
- RequireAuth wraps protected /app routes and uses stored tokens to allow navigation

8) Admin user management flows (where things connect)
- Two UI entry points exist:
  - Route-based: /admin/users (AdminUsers.tsx) and /admin/users/:id (AdminUserDetail.tsx). These use adminUserService.
  - Dashboard-embedded: src/app/pages/AdminDashboard.tsx contains an embedded/slide-in/full-page management view that also calls adminUserService (we centralised these functions there: loadMgmt, openMgmtDetail, saveMgmtStatus, saveMgmtRoles).
- Event mechanism: code dispatches a CustomEvent('openAdminUserMgmt', {detail:{page}}) to request opening the management panel from different places (header, sidebar button). AdminDashboard listens and opens the centralized panel.

9) UI state & UX conventions
- Global small panels (health, command palette, notifications) are implemented as positioned fixed popovers inside layouts/pages and toggled with booleans (showHealthPanel, commandOpen, notifOpen).
- AdminDashboard contains its own local state for the admin views (activeNav: 'users'|'financials'|'b2b') and controls inner content via conditional rendering.

10) Files of interest (quick links)
- main.tsx -> src/main.tsx
- router -> src/app/routes.ts
- app wrapper -> src/app/App.tsx
- layouts -> src/app/layouts/DashboardLayout.tsx, src/app/layouts/AdminLayout.tsx
- admin pages -> src/app/pages/AdminDashboard.tsx, AdminUsers.tsx, AdminUserDetail.tsx
- api -> src/api/authService.ts, src/api/adminUserService.ts, src/api/healthService.ts

11) How an "agent" can operate on this codebase
- Typical tasks an agent might perform:
  1) Find route and file for a feature: search src/app/routes.ts to locate the Component and open that file.
  2) Modify a layout: edit DashboardLayout.tsx or AdminLayout.tsx.
  3) Add API call: edit/create file in src/api and import it where needed.
  4) Wire new page: add Component to src/app/pages, then add to src/app/routes.ts children (for /app or /admin) or as top-level route.
  5) UI changes: update CSS in src/styles or local styles inside components; use tailwind classes (project already uses tailwind) or plain CSS.
- Recommended agent capabilities: read/write TSX files, run TypeScript/ESLint checks, run dev server (npm run dev), and run unit/smoke tests.

12) Commands
- Start dev server
  - npm install
  - npm run dev
- Build
  - npm run build

13) Notes / caveats
- The project mixes direct DOM interactions in places (document.getElementById used for quick inputs). Prefer controlled React inputs for maintainability.
- There are multiple places where admin management UI exists (dedicated pages and embedded dashboard). We consolidated behavior with centralized mgmt functions in AdminDashboard — if you prefer single source-of-truth, canonicalize to AdminUsers + AdminUserDetail and call them via routes only.

14) Suggested agent actions (examples)
- Generate a new agent task file: .agent.md describing steps to add a new admin field (modify BE API, update adminUserService, update AdminUserDetail, update AdminUsers table)
- Generate tests: small integration test that starts dev server and validates /admin/users returns UI skeleton.

---
Tôi sẽ tạo file này trong repository: FE_agents.md
Nếu bạn muốn file theo định dạng khác (.agent.md, AGENTS.md, YAML meta) hoặc muốn tôi tự tạo các tác vụ agent (ví dụ: agent-add-user-field), nói tên file và form (markdown/YAML) — tôi sẽ generate tiếp.