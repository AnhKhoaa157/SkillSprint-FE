import { requestJson } from "./apiClient";

export type AnnouncementType = "INFO" | "WARNING";

export interface SystemAnnouncementResponse {
  announcementId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  type: AnnouncementType;
  startAt?: string | null;
  endAt?: string | null;
}

/**
 * Public, unauthenticated feed — backend returns ONLY the currently active
 * (enabled + within start/end window) announcements. Safe to call on Landing/Auth.
 */
export async function getPublicAnnouncements(): Promise<SystemAnnouncementResponse[]> {
  const res = await requestJson<SystemAnnouncementResponse[]>("/api/public/system-announcements", {
    method: "GET",
  });
  return res.data || [];
}

/** Admin: full list including inactive/scheduled/expired announcements. */
export async function getAdminAnnouncements(): Promise<SystemAnnouncementResponse[]> {
  const res = await requestJson<SystemAnnouncementResponse[]>("/api/admin/system-announcements", {
    method: "GET",
  });
  return res.data || [];
}

export async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<SystemAnnouncementResponse> {
  const res = await requestJson<SystemAnnouncementResponse>("/api/admin/system-announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Failed to create announcement");
  return res.data;
}

export async function updateAnnouncement(id: string, payload: CreateAnnouncementPayload): Promise<SystemAnnouncementResponse> {
  const res = await requestJson<SystemAnnouncementResponse>(`/api/admin/system-announcements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Failed to update announcement");
  return res.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await requestJson<null>(`/api/admin/system-announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.success) throw new Error(res.message || "Failed to delete announcement");
}

export default {
  getPublicAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
