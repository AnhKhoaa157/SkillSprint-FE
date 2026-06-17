import { useEffect, useState } from "react";
import { Info, AlertTriangle, X, type LucideIcon } from "lucide-react";
import { getActivePublicAnnouncement, type AnnouncementType, type AnnouncementResponse } from "../../../api/systemAnnouncementService";

const STORAGE_KEY = "dismissed_announcement_id";

const TYPE_STYLES: Record<AnnouncementType, { container: string; icon: string; dismiss: string; Icon: LucideIcon }> = {
  INFO: {
    container: "border-indigo-200 bg-indigo-50 text-indigo-900",
    icon: "text-indigo-600",
    dismiss: "text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700",
    Icon: Info,
  },
  WARNING: {
    container: "border-amber-300 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    dismiss: "text-amber-600 hover:bg-amber-100 hover:text-amber-800",
    Icon: AlertTriangle,
  },
};

/** Reads the locally-dismissed announcement id, tolerating storage being unavailable. */
function readDismissed(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stable key the dismissal is keyed on — the id when present, else a content fingerprint. */
function dismissKey(a: AnnouncementResponse): string {
  return a.announcementId || `${a.title}|${a.message}`;
}

/**
 * Sticky, site-wide banner for the single active public system announcement.
 * Mounted once at the root so it shows across Landing, Auth, and the study app.
 * Renders nothing when there is no active (or already-dismissed) announcement.
 */
export default function GlobalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() => readDismissed());

  useEffect(() => {
    let mounted = true;
    getActivePublicAnnouncement()
      .then(a => { if (mounted) setAnnouncement(a); })
      .catch(() => { if (mounted) setAnnouncement(null); }); // silent — banner is non-critical
    return () => { mounted = false; };
  }, []);

  if (!announcement || announcement.active !== true) return null;

  const key = dismissKey(announcement);
  if (dismissed === key) return null;

  const styles = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.INFO;
  const Icon = styles.Icon;

  const dismiss = () => {
    setDismissed(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch { /* storage may be unavailable */ }
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      <div
        role="status"
        className={`flex items-start gap-3 border-b px-4 py-2.5 sm:px-6 ${styles.container}`}
      >
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
        <div className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-bold">{announcement.title}</span>
          {announcement.message && <span className="ml-1.5 font-medium opacity-90">{announcement.message}</span>}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng thông báo"
          title="Đóng thông báo"
          className={`shrink-0 rounded-md p-1 transition ${styles.dismiss}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
