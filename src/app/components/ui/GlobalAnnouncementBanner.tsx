import { useEffect, useState } from "react";
import { Info, AlertTriangle, X, type LucideIcon } from "lucide-react";
import { getPublicAnnouncements, type AnnouncementType, type SystemAnnouncementResponse } from "../../../api/systemAnnouncementService";

const STORAGE_KEY = "dismissed_announcements";

/** Reads the locally-dismissed announcement IDs, tolerating malformed/legacy values. */
function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

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

/**
 * Sticky, site-wide banner for public system announcements. Mounted once at the
 * root so it shows across Landing, Auth, and the study app. Renders nothing when
 * there are no active (non-dismissed) announcements.
 */
export default function GlobalAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncementResponse[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed());

  useEffect(() => {
    let mounted = true;
    getPublicAnnouncements()
      .then(list => { if (mounted) setAnnouncements(Array.isArray(list) ? list : []); })
      .catch(() => { if (mounted) setAnnouncements([]); }); // silent — banner is non-critical
    return () => { mounted = false; };
  }, []);

  const visible = announcements.filter(
    a => a && a.announcementId && a.isActive !== false && !dismissed.includes(a.announcementId),
  );

  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
      return next;
    });
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {visible.map(a => {
        const styles = TYPE_STYLES[a.type] ?? TYPE_STYLES.INFO;
        const Icon = styles.Icon;
        return (
          <div
            key={a.announcementId}
            role="status"
            className={`flex items-start gap-3 border-b px-4 py-2.5 sm:px-6 ${styles.container}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
            <div className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-bold">{a.title}</span>
              {a.content && <span className="ml-1.5 font-medium opacity-90">{a.content}</span>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(a.announcementId)}
              aria-label="Đóng thông báo"
              title="Đóng thông báo"
              className={`shrink-0 rounded-md p-1 transition ${styles.dismiss}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
