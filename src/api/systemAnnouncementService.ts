import { requestJson } from "./apiClient";
import { API_BASE } from "./config";

export type AnnouncementType = "INFO" | "WARNING";

export interface AnnouncementResponse {
  announcementId?: string;
  enabled: boolean;
  active: boolean;
  title: string;
  message: string;
  type: AnnouncementType;
  startAt: string | null;
  endAt: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface UpdateAnnouncementRequest {
  enabled?: boolean;
  title?: string;
  message?: string;
  content?: string; // Backup for backend
  type?: AnnouncementType;
  clearSchedule?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

/**
 * Public, unauthenticated feed — backend returns the single currently active
 * (enabled + within start/end window) announcement, or null. Safe to call on
 * Landing/Auth. Fetched directly (no auth headers) so it never trips the
 * session interceptor.
 */
export async function getActivePublicAnnouncement(): Promise<AnnouncementResponse | null> {
  const res = await fetch(`${API_BASE}/api/public/announcements/active`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

/** Admin: the singleton announcement config (including disabled/scheduled state). */
export async function getAdminAnnouncement(): Promise<AnnouncementResponse> {
  const res = await requestJson<AnnouncementResponse>("/api/admin/system/announcement");
  if (!res.data) throw new Error(res.message || "Không tải được cấu hình thông báo");
  return res.data;
}

export async function updateAdminAnnouncement(request: UpdateAnnouncementRequest): Promise<AnnouncementResponse> {
  const res = await requestJson<AnnouncementResponse>("/api/admin/system/announcement", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
  if (!res.data) throw new Error(res.message || "Không cập nhật được thông báo");
  return res.data;
}

export default {
  getActivePublicAnnouncement,
  getAdminAnnouncement,
  updateAdminAnnouncement,
};
