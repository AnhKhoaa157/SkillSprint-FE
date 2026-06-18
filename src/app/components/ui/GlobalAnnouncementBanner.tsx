import { useEffect, useState } from "react";
import { Info, AlertTriangle, X, type LucideIcon } from "lucide-react";
import { getActivePublicAnnouncement, type AnnouncementType, type AnnouncementResponse } from "../../../api/system/systemAnnouncementService";

const STORAGE_KEY = "dismissed_announcement_id";

const TYPE_STYLES: Record<AnnouncementType, { bg: string; iconBox: string; icon: string; title: string; text: string; dismiss: string; Icon: LucideIcon }> = {
  INFO: {
    bg: "bg-orange-50/90 backdrop-blur-xl border-b border-orange-200/60",
    iconBox: "bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white shadow-md shadow-orange-500/30",
    icon: "text-white",
    title: "text-slate-900 font-extrabold tracking-tight",
    text: "text-slate-600 font-medium",
    dismiss: "text-slate-400 hover:bg-orange-100 hover:text-[#FF6B00]",
    Icon: Info,
  },
  WARNING: {
    bg: "bg-red-50/90 backdrop-blur-xl border-b border-red-200/60",
    iconBox: "bg-gradient-to-br from-red-600 to-rose-500 text-white shadow-md shadow-red-500/30",
    icon: "text-white",
    title: "text-slate-900 font-extrabold tracking-tight",
    text: "text-slate-600 font-medium",
    dismiss: "text-slate-400 hover:bg-red-100 hover:text-red-600",
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
      
    const handleDismissed = () => {
      if (mounted) setDismissed(readDismissed());
    };
    window.addEventListener("system_announcement_dismissed", handleDismissed);
    
    return () => { 
      mounted = false; 
      window.removeEventListener("system_announcement_dismissed", handleDismissed);
    };
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
    <div className="sticky top-0 z-[60] w-full">
      <div className={`${styles.bg} shadow-sm overflow-hidden relative transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${styles.iconBox}`}>
              <Icon size={16} strokeWidth={2.5} className={styles.icon} />
            </div>
            <div className="flex-1 min-w-0 text-[14px] flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
              <span className={`truncate ${styles.title}`}>{announcement.title}</span>
              {announcement.message && (
                <>
                  <span className="hidden sm:inline text-slate-300 font-bold">•</span>
                  <span className={`truncate ${styles.text}`}>{announcement.message}</span>
                </>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng thông báo"
            className={`shrink-0 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${styles.dismiss}`}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
