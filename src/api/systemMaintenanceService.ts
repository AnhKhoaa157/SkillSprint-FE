import { requestJson } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Public system status — GET /api/system/status.
 *
 * NOTE: the backend wire field is `maintenance` (boolean); we normalize it to `isActive`
 * here so the rest of the app uses one consistent name. Timestamps are ISO-8601 strings.
 */
export type MaintenanceStatusResponse = {
  isActive: boolean;
  message: string;
  startAt: string | null;
  endAt: string | null;
};

/** Full admin config returned by the protected maintenance endpoints. */
export type MaintenanceResponse = {
  maintenanceId: string;
  enabled: boolean; // the toggle the admin set
  active: boolean; // enabled AND currently inside the [startAt, endAt] window
  message: string;
  startAt: string | null;
  endAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

/** Partial-update payload. Only the provided fields are changed server-side. */
export type UpdateMaintenanceRequest = {
  enabled?: boolean;
  message?: string;
  clearSchedule?: boolean;
  startAt?: string | null;
  endAt?: string | null;
};

// Raw shape of the public endpoint before normalization.
type SystemStatusWire = {
  maintenance: boolean;
  message: string;
  startAt: string | null;
  endAt: string | null;
};

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * Public + unauthenticated. This endpoint is on the `@Order(1)` security chain, so it stays
 * reachable (HTTP 200) even while maintenance mode is active — making it safe to poll from a guard.
 */
export async function getSystemStatus(): Promise<MaintenanceStatusResponse> {
  const res = await requestJson<SystemStatusWire>("/api/system/status");
  const data = res.data;
  if (!data) throw new Error(res.message || "Không tải được trạng thái hệ thống");
  return {
    isActive: data.maintenance,
    message: data.message,
    startAt: data.startAt ?? null,
    endAt: data.endAt ?? null,
  };
}

/** Admin only — current full maintenance config (GET /api/admin/system/maintenance). */
export async function getMaintenanceConfig(): Promise<MaintenanceResponse> {
  const res = await requestJson<MaintenanceResponse>("/api/admin/system/maintenance");
  if (!res.data) throw new Error(res.message || "Không tải được cấu hình bảo trì");
  return res.data;
}

/**
 * Admin only — toggle / schedule / update the broadcast message.
 *
 * The backend route is PATCH `/api/admin/system/maintenance` (a partial update), not PUT.
 */
export async function updateMaintenanceMode(
  request: UpdateMaintenanceRequest,
): Promise<MaintenanceResponse> {
  const res = await requestJson<MaintenanceResponse>("/api/admin/system/maintenance", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không cập nhật được chế độ bảo trì");
  return res.data;
}

// ─── datetime-local helpers ────────────────────────────────────────────────────
// <input type="datetime-local"> works in *local* time with no timezone; the API speaks ISO/UTC.

/** ISO-8601 (UTC) → "YYYY-MM-DDTHH:mm" for a datetime-local input value. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO-8601 (UTC), or null when empty/invalid. */
export function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
