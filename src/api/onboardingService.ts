import { requestJson, type ApiResponse } from "./apiClient";

export type UpsertOnboardingProfileRequest = {
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null; // YYYY-MM-DD
  confidence: "HIGH" | "MEDIUM" | "LOW";
  preferredLanguage?: string | null;
  preferredDays?: string[] | null;
  preferredTimeSlots?: string[] | null;
};

export type OnboardingProfileResponse = {
  profileId: string;
  workspaceId: string;
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null;
  confidence: string;
  preferredLanguage?: string | null;
  preferredDays: string[];
  preferredTimeSlots: string[];
  createdAt: string;
  updatedAt?: string | null;
};

export async function fetchOnboardingProfile(workspaceId: string): Promise<ApiResponse<OnboardingProfileResponse>> {
  try {
    return await requestJson<OnboardingProfileResponse>(
      `/api/workspaces/${workspaceId}/onboarding`,
      { method: "GET" },
    );
  } catch (error: any) {
    if (error?.status === 404) {
      return { success: false, code: 404, message: "Not found", data: null };
    }
    throw error;
  }
}

export async function upsertOnboardingProfile(
  workspaceId: string,
  body: UpsertOnboardingProfileRequest,
): Promise<OnboardingProfileResponse> {
  const res = await requestJson<OnboardingProfileResponse>(
    `/api/workspaces/${workspaceId}/onboarding`,
    { method: "PUT", body: JSON.stringify(body) },
  );
  if (!res.data) throw new Error(res.message || "Upsert onboarding profile failed");
  return res.data;
}

export default { fetchOnboardingProfile, upsertOnboardingProfile };