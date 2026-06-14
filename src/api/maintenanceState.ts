import { API_BASE } from "./config";

/**
 * Framework-agnostic maintenance state.
 *
 * The React layer (<MaintenanceGate>) keeps a copy of the maintenance status in context, but the
 * non-React layers — the apiClient interceptor and the login guard — can't read React context.
 * This module is the shared, dependency-light source of truth they consult instead.
 *
 * It deliberately imports ONLY `config` (no apiClient / authService) so it can be used from any
 * layer without creating an import cycle (apiClient ↔ authService both need it).
 *
 * ⚠️ Security note: this is client-side *defense-in-depth and UX*, NOT an authorization boundary.
 * A determined learner can still call the API directly with a valid JWT, so the backend MUST also
 * reject non-admin traffic (and non-admin logins) with 503 while maintenance is active. These
 * helpers exist to fail fast, stop wasted requests, and keep the UI honest — not to secure the API.
 */

export type MaintenanceSnapshot = {
  isActive: boolean;
  message: string;
  startAt: string | null;
  endAt: string | null;
};

// Raw wire shape of GET /api/system/status before normalization (`maintenance` → `isActive`).
type SystemStatusWire = {
  maintenance: boolean;
  message: string;
  startAt: string | null;
  endAt: string | null;
};

type Envelope<T> = { success: boolean; code: number; message: string; data: T | null };

// Last-known snapshot, shared across the app. Kept warm by <MaintenanceGate>'s poll and by the
// admin toggle. `null` means "unknown" (e.g. the status endpoint was unreachable) → treat as open.
let cached: MaintenanceSnapshot | null = null;

export function getCachedMaintenance(): MaintenanceSnapshot | null {
  return cached;
}

/** Synchronous best-effort check used by the interceptor on every request. */
export function isMaintenanceActive(): boolean {
  return cached?.isActive === true;
}

export function setCachedMaintenance(next: MaintenanceSnapshot | null): void {
  cached = next;
}

/**
 * Public, unauthenticated status fetch. Lives here (config-only deps) so authService and the
 * apiClient interceptor can consult maintenance WITHOUT importing systemMaintenanceService — which
 * would create an apiClient ↔ authService cycle. Always refreshes the shared cache on success.
 *
 * Note: this endpoint is on the backend's @Order(1) security chain, so it stays reachable (HTTP
 * 200) even while maintenance is active — safe to poll.
 */
export async function fetchSystemStatus(): Promise<MaintenanceSnapshot> {
  const res = await fetch(`${API_BASE}/api/system/status`);
  const json = (await res.json().catch(() => null)) as Envelope<SystemStatusWire> | null;
  const data = json?.data;

  if (!res.ok || !data) {
    throw new Error(json?.message || "Không tải được trạng thái hệ thống");
  }

  const snapshot: MaintenanceSnapshot = {
    isActive: Boolean(data.maintenance),
    message: data.message ?? "",
    startAt: data.startAt ?? null,
    endAt: data.endAt ?? null,
  };

  setCachedMaintenance(snapshot);
  return snapshot;
}
