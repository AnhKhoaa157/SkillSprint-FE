import { extractApiData, skillSprintApiClient, type ApiResponse } from "../core/skillSprintApiClient";
import type { CreateReminderRequest, NotificationResponse } from "../core/skillSprintModels";

export async function getNotifications(): Promise<NotificationResponse[]> {
  const response = await skillSprintApiClient.get<ApiResponse<NotificationResponse[]>>("/api/notifications");
  return extractApiData(response);
}

export async function getUnreadNotifications(): Promise<NotificationResponse[]> {
  const response = await skillSprintApiClient.get<ApiResponse<NotificationResponse[]>>("/api/notifications/unread");
  return extractApiData(response);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await skillSprintApiClient.patch<ApiResponse<null>>(`/api/notifications/${encodeURIComponent(notificationId)}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await skillSprintApiClient.patch<ApiResponse<null>>("/api/notifications/read-all");
}

export async function createReminder(workspaceId: string, payload: CreateReminderRequest): Promise<void> {
  await skillSprintApiClient.post<ApiResponse<null>>(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders`, payload);
}
