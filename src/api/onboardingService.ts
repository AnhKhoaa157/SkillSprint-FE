import { createId, MOCK_STORAGE_KEYS, nowIso, readStorage, writeStorage } from "./mockDb";
import { getStoredAuthSession } from "./authService";

export type UpsertOnboardingProfileRequest = {
  targetGoal: string;
  studyHoursPerWeek?: number | null;
  targetDeadline?: string | null;
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

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

type OnboardingState = Record<string, OnboardingProfileResponse>;

const KEY = MOCK_STORAGE_KEYS.onboarding;

function readState(): OnboardingState {
  return readStorage<OnboardingState>(KEY, {});
}

function writeState(state: OnboardingState): void {
  writeStorage(KEY, state);
}

function buildResponse(profile: OnboardingProfileResponse | null): ApiResponse<OnboardingProfileResponse> {
  if (!profile) {
    return { success: false, code: 404, message: "Not found", data: null };
  }

  return { success: true, code: 200, message: "OK", data: profile };
}

export async function fetchOnboardingProfile(workspaceId: string): Promise<ApiResponse<OnboardingProfileResponse>> {
  const state = readState();
  return buildResponse(state[workspaceId] ?? null);
}

export async function upsertOnboardingProfile(workspaceId: string, body: UpsertOnboardingProfileRequest): Promise<ApiResponse<OnboardingProfileResponse>> {
  const session = getStoredAuthSession();
  const state = readState();
  const existing = state[workspaceId];
  const now = nowIso();
  const nextWorkspaceId = workspaceId || session?.accessToken || "default-workspace";

  const next: OnboardingProfileResponse = {
    profileId: existing?.profileId ?? createId("ONB"),
    workspaceId: nextWorkspaceId,
    targetGoal: body.targetGoal,
    studyHoursPerWeek: body.studyHoursPerWeek ?? null,
    targetDeadline: body.targetDeadline ?? null,
    confidence: body.confidence,
    preferredLanguage: body.preferredLanguage ?? null,
    preferredDays: body.preferredDays ?? existing?.preferredDays ?? [],
    preferredTimeSlots: body.preferredTimeSlots ?? existing?.preferredTimeSlots ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  state[nextWorkspaceId] = next;
  writeState(state);

  return { success: true, code: 200, message: "Saved", data: next };
}

export default { fetchOnboardingProfile, upsertOnboardingProfile };