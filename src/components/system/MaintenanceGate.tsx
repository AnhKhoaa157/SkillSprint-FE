import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { getSystemStatus, type MaintenanceStatusResponse } from "../../api/systemMaintenanceService";
import { enforceMaintenanceLogout } from "../../api/authService";
import { MaintenanceScreen } from "./MaintenanceScreen";

const POLL_MS = 30_000; // re-check every 30s + on window focus

/**
 * Paths that stay reachable even while maintenance is active. The admin portal MUST remain open,
 * otherwise an operator can never sign in to lift maintenance (a permanent self-lockout).
 *   - "/admin-login" → the admin sign-in page
 *   - "/admin", "/admin/..." → the dashboard where the maintenance toggle lives
 */
function isAdminEscapeHatch(pathname: string): boolean {
  return pathname === "/admin-login" || pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Full-screen blocker shown until the FIRST status check resolves. Rendering this instead of
 * `children` is what closes the exploit: the dashboard never mounts (and never fires its data
 * requests) during the async maintenance fetch.
 */
function MaintenanceGateLoader() {
  return (
    <div
      data-testid="maintenance-loading"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
    >
      <Loader2 className="h-9 w-9 animate-spin text-orange-500" strokeWidth={2.4} />
      <span className="sr-only">Đang kiểm tra trạng thái hệ thống…</span>
    </div>
  );
}

type MaintenanceContextValue = {
  status: MaintenanceStatusResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const MaintenanceContext = createContext<MaintenanceContextValue>({
  status: null,
  loading: false,
  refresh: async () => {},
});

/** Read the live maintenance status anywhere below the gate (banners, login interceptor, etc.). */
export const useMaintenance = () => useContext(MaintenanceContext);

/**
 * Wrap your app routes with <MaintenanceGate>. This is a top-level *layout interceptor* with a
 * strict three-state machine — it never reveals `children` until it is certain the system is open:
 *
 *   1. LOADING   — the first status check hasn't resolved yet → render a full-screen blocker.
 *                  (Critical: without this, the dashboard mounts during the async fetch and the
 *                  lockdown degrades to a toast. children must NOT render here.)
 *   2. ACTIVE    — status.isActive === true → replace the ENTIRE viewport with <MaintenanceScreen />.
 *   3. OPEN      — first check done AND not in maintenance → render `children`.
 *
 * The admin escape hatch (`/admin-login`, `/admin/*`) bypasses states 1 & 2 entirely so an operator
 * can always sign in and lift maintenance. The learner auth routes (`/login`, `/auth*`) likewise
 * bypass them and delegate to <Auth>, which uses a *soft lockdown*: the login form stays visible at
 * all times, its buttons are disabled and an amber maintenance banner is shown while locked, and a
 * 5s poll re-enables everything the moment maintenance lifts. The live status is published via
 * context (useMaintenance) for banners and the admin dashboard regardless of which state renders.
 *
 *   <MaintenanceGate>
 *     <AppRoutes />
 *   </MaintenanceGate>
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MaintenanceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  // Bumped on browser navigation so the admin allowlist is re-evaluated against the new URL.
  const [, onNavigate] = useReducer((n: number) => n + 1, 0);

  const refresh = useCallback(async () => {
    try {
      const next = await getSystemStatus();
      // Force-logout: the moment this browser observes maintenance, any non-admin session is wiped
      // (admins untouched). Runs even after unmount — clearing tokens has no React side effects.
      enforceMaintenanceLogout(next.isActive);
      if (mounted.current) setStatus(next);
    } catch {
      // Status endpoint unreachable → fail open (don't trap users behind a false alert on a blip).
      if (mounted.current) setStatus(null);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const interval = window.setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  // The gate lives above the router, so it can't use useLocation(). Re-render on browser
  // back/forward (popstate) so the admin allowlist tracks the current URL. Programmatic SPA
  // navigations self-heal on the next status poll; the admin escape hatch uses a full-page load.
  useEffect(() => {
    window.addEventListener("popstate", onNavigate);
    return () => window.removeEventListener("popstate", onNavigate);
  }, []);

  const pathname = window.location.pathname;
  // Learner auth pages own their ENTIRE maintenance lifecycle and use a *soft lockdown* UI: <Auth>
  // keeps the login form visible at all times, disables the submit/Google buttons and shows an amber
  // maintenance banner while locked, runs its own 5s poll, and re-enables everything automatically
  // when the backend lifts maintenance. The OAuth callback under /auth* must also stay reachable so a
  // Google sign-in can complete. So we ALWAYS let these routes mount their children — never pre-empt
  // them with the loader or the full-screen <MaintenanceScreen />; <Auth> renders its own initial
  // checking-spinner and its own locked treatment.
  //   - "/login"        → <Auth>
  //   - "/auth", "/auth/callback" → redirect + OAuth callback handler
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/auth");

  // Resolve the state machine. ORDER IS LOAD-BEARING:
  //
  //   1. ADMIN + AUTH — always reachable. The admin portal must never be locked out of the
  //                     maintenance toggle, and the learner auth routes run their own soft lockdown
  //                     (form stays visible, buttons disabled, banner shown). Both own their UI, so
  //                     we hand them `children` directly and let them mount immediately.
  //   2. LOADING      — for every OTHER (protected/dashboard) route, the first status check hasn't
  //                     resolved yet → hold a full-screen loader so the app never mounts (and never
  //                     fires data requests) before the server's verdict is in.
  //   3. ACTIVE       — those routes are replaced wholesale by <MaintenanceScreen />.
  //   4. OPEN         — first check done and system healthy → render `children`.
  let content: ReactNode;
  if (isAdminEscapeHatch(pathname) || isAuthRoute) {
    content = children;
  } else if (loading) {
    content = <MaintenanceGateLoader />;
  } else if (status?.isActive === true) {
    content = <MaintenanceScreen />;
  } else {
    content = children;
  }

  return (
    <MaintenanceContext.Provider value={{ status, loading, refresh }}>
      {content}
    </MaintenanceContext.Provider>
  );
}

export default MaintenanceGate;
