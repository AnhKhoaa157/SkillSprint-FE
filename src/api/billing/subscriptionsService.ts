import { extractApiData, skillSprintApiClient, type ApiResponse } from "../core/skillSprintApiClient";
import type { CurrentSubscriptionResponse, QuotaStatusResponse } from "../core/skillSprintModels";

export async function getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
  const response = await skillSprintApiClient.get<ApiResponse<CurrentSubscriptionResponse>>("/api/subscriptions/me");
  return extractApiData(response);
}

export async function getQuotaStatus(): Promise<QuotaStatusResponse> {
  const response = await skillSprintApiClient.get<ApiResponse<QuotaStatusResponse>>("/api/subscriptions/me/quota");
  return extractApiData(response);
}
