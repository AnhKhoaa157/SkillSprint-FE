import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Wrench, Clock } from "lucide-react";
import { getSystemStatus, type MaintenanceStatusResponse } from "../../api/systemMaintenanceService";
import { getStoredAuthSession, isAdminRole } from "../../api/authService";

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

/** Read the maintenance status anywhere below the gate (e.g. to show a banner). */
export const useMaintenance = () => useContext(MaintenanceContext);

/**
 * Wrap your app routes with <MaintenanceGate>. While maintenance is active, non-admin visitors
 * see the splash; admins (detected from the stored auth session) pass through so they can keep
 * working / turn maintenance off. The public /api/system/status endpoint stays reachable during
 * maintenance, so polling here never gets blocked.
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
      // Status endpoint unreachable → fail open (don't trap users behind a splash on a network blip).
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

  const isAdmin = isAdminRole(getStoredAuthSession()?.role);
  const blocked = !loading && status?.isActive === true && !isAdmin;

  return (
    <MaintenanceContext.Provider value={{ status, loading, refresh }}>
      {blocked ? <MaintenanceSplash status={status!} /> : children}
    </MaintenanceContext.Provider>
  );
}

function MaintenanceSplash({ status }: { status: MaintenanceStatusResponse }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50/40 px-4">
      <div className="w-full max-w-md text-center rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-500/5 p-8">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Wrench size={36} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Đang bảo trì hệ thống</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {status.message || "SkillSprint đang được nâng cấp. Vui lòng quay lại sau ít phút."}
        </p>
        {status.endAt && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
            <Clock size={15} />
            Dự kiến hoàn tất:{" "}
            {new Date(status.endAt).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        )}
        <div className="mt-8 text-xs text-slate-400">
          Trang sẽ tự động cập nhật khi hệ thống hoạt động trở lại.
        </div>
      </div>
    </div>
  );
}

export default MaintenanceGate;
