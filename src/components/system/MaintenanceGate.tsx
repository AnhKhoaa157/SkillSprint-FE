import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getSystemStatus, type MaintenanceStatusResponse } from "../../api/systemMaintenanceService";

const POLL_MS = 30_000; // re-check every 30s + on window focus

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
 * Wrap your app routes with <MaintenanceGate>. This is now a *transparent* provider: it never
 * intercepts the layout. It simply keeps a fresh, real-time copy of the public maintenance status
 * in context so any consumer (e.g. the login interceptor) can react to it.
 *
 * The boundary is no longer enforced at the layout root — everyone (Learners/Guests) can browse
 * the public site and reach the login page. Maintenance is enforced at the authentication layer
 * (see <MaintenancePopup /> + the login handlers), so admins keep working and learners are blocked
 * only at the moment they try to sign in.
 *
 *   <MaintenanceGate>
 *     <AppRoutes />
 *   </MaintenanceGate>
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MaintenanceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getSystemStatus();
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

  // Always render children — the gate is a context provider, not a layout interceptor.
  return (
    <MaintenanceContext.Provider value={{ status, loading, refresh }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export default MaintenanceGate;
