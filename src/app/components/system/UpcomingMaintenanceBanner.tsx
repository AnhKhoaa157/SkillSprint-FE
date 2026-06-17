import { AlertTriangle } from "lucide-react";
import { useMaintenance } from "../../../components/system/MaintenanceGate";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sticky "upcoming maintenance" heads-up banner.
 *
 * Reads the live status from the shared {@link useMaintenance} context (kept warm by
 * <MaintenanceGate>'s 30s poll + focus refresh). It surfaces ONLY when maintenance is *scheduled*
 * but not yet active — i.e. `startAt` is in the future and within the next 24h. The moment
 * maintenance actually starts, `status.isActive` flips to true and <MaintenanceGate> swaps the
 * whole viewport for <MaintenanceScreen />, so this banner naturally disappears (no dismissal
 * state to expire). Intentionally non-dismissible.
 */
export default function UpcomingMaintenanceBanner() {
  const { status } = useMaintenance();

  // Hidden while: status unknown, already in maintenance, or no schedule set.
  if (!status || status.isActive || !status.startAt) return null;

  const start = new Date(status.startAt);
  if (Number.isNaN(start.getTime())) return null;

  const msUntilStart = start.getTime() - Date.now();
  // Only warn for a schedule that is in the future AND lands within the next 24h.
  if (msUntilStart <= 0 || msUntilStart > DAY_MS) return null;

  const startLabel = start.toLocaleString("vi-VN");
  const end = status.endAt ? new Date(status.endAt) : null;
  const endLabel = end && !Number.isNaN(end.getTime()) ? end.toLocaleString("vi-VN") : null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[49] flex w-full items-start gap-3 border-b border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-amber-900 sm:px-6"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="min-w-0 flex-1 text-sm leading-snug">
        <span className="font-bold">Cảnh báo: Hệ thống sẽ bảo trì</span>{" "}
        <span className="font-medium">
          từ <span className="font-bold">{startLabel}</span>
          {endLabel ? <> đến <span className="font-bold">{endLabel}</span></> : null}
          . Vui lòng sắp xếp thời gian lưu dữ liệu của bạn.
        </span>
      </p>
    </div>
  );
}
