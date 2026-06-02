import { extractApiData, skillSprintApiClient, type ApiResponse } from "./skillSprintApiClient";
import type { CreateReminderRequest, NotificationResponse } from "./skillSprintModels";

export async function getNotifications(): Promise<NotificationResponse[]> {
  const response = await skillSprintApiClient.get<ApiResponse<NotificationResponse[]>>("/api/notifications");
  return extractApiData(response);
}

export async function getUnreadNotifications(): Promise<NotificationResponse[]> {
  const response = await skillSprintApiClient.get<ApiResponse<NotificationResponse[]>>("/api/notifications/unread");
  return extractApiData(response);
}

export async function createReminder(workspaceId: string, payload: CreateReminderRequest): Promise<void> {
  await skillSprintApiClient.post<ApiResponse<null>>(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders`, payload);
}
