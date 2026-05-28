import { DEFAULT_USER_PROFILE, MOCK_STORAGE_KEYS, writeStorage } from "./mockDb";
import { getStoredAuthSession, getStoredUserProfile, type StoredUserProfile } from "./authService";

export type MeResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string;
  timeZone: string;
  status: string;
  roles: string[];
};

export type UpdateMeRequest = {
  fullName: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function toMeResponse(profile: StoredUserProfile | null): MeResponse {
  const current = profile ?? {
    email: DEFAULT_USER_PROFILE.email,
    fullName: DEFAULT_USER_PROFILE.fullName,
    firstName: DEFAULT_USER_PROFILE.fullName.split(" ")[0] ?? "",
    lastName: DEFAULT_USER_PROFILE.fullName.split(" ").slice(1).join(" "),
    role: DEFAULT_USER_PROFILE.roles?.[0] ?? "LEARNER",
  };

  return {
    userId: DEFAULT_USER_PROFILE.userId,
    email: current.email,
    emailVerified: true,
    fullName: current.fullName,
    avatarUrl: DEFAULT_USER_PROFILE.avatarUrl,
    timeZone: DEFAULT_USER_PROFILE.timeZone,
    status: DEFAULT_USER_PROFILE.status,
    roles: [current.role ?? "LEARNER"],
  };
}

export async function getMe(): Promise<MeResponse> {
  const session = getStoredAuthSession();
  const profile = getStoredUserProfile();

  if (!session && !profile) {
    return toMeResponse(null);
  }

  return toMeResponse(profile);
}

export async function updateMe(req: UpdateMeRequest): Promise<MeResponse> {
  const profile = getStoredUserProfile();
  const nextProfile: StoredUserProfile = {
    email: profile?.email ?? DEFAULT_USER_PROFILE.email,
    fullName: req.fullName.trim(),
    firstName: splitName(req.fullName).firstName,
    lastName: splitName(req.fullName).lastName,
    role: profile?.role ?? DEFAULT_USER_PROFILE.roles?.[0] ?? "LEARNER",
  };

  writeStorage(MOCK_STORAGE_KEYS.userProfile, nextProfile);
  return toMeResponse(nextProfile);
}

export default { getMe, updateMe };