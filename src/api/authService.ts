import { DEFAULT_USER_PROFILE, MOCK_STORAGE_KEYS, readStorage, removeStorage, writeStorage } from "./mockDb";

export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export type AuthRole = "ADMIN" | "LEARNER" | string;

export type AuthSession = AuthTokens & {
  role: AuthRole | null;
};

export type StoredUserProfile = {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: AuthRole | null;
};

export type LoginResult =
  | { status: "authenticated"; tokens: AuthSession }
  | { status: "new-password-required"; challengeName: string; session: string; role: AuthRole | null };

type AuthInput = {
  email: string;
  password: string;
  fullName?: string;
};

const AUTH_STORAGE_KEY = MOCK_STORAGE_KEYS.authSession;
const PROFILE_STORAGE_KEY = MOCK_STORAGE_KEYS.userProfile;

function normalizeRole(value: unknown): AuthRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/^ROLE_/i, "").replace(/[-_\s]/g, "").toUpperCase();

  if (compact === "ADMIN") {
    return "ADMIN";
  }

  if (compact === "LEARNER" || compact === "STUDENT" || compact === "USER" || compact === "MEMBER") {
    return "LEARNER";
  }

  return trimmed.toUpperCase();
}

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

function buildReadableNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  if (!localPart) {
    return "";
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
    .trim();
}

function inferRole(email: string, explicitRole?: AuthRole | null): AuthRole {
  if (explicitRole) {
    return normalizeRole(explicitRole) ?? "LEARNER";
  }

  return /admin/i.test(email) ? "ADMIN" : "LEARNER";
}

function buildTokens(email: string, role: AuthRole): AuthTokens {
  const payload = JSON.stringify({ email, role, ts: Date.now() });
  const encoded = typeof btoa === "function" ? btoa(payload) : payload;

  return {
    accessToken: `mock-access.${encoded}.token`,
    idToken: `mock-id.${encoded}.token`,
    refreshToken: `mock-refresh.${encoded}.token`,
    expiresIn: 3600,
    tokenType: "Bearer",
  };
}

function buildSession(email: string, role: AuthRole): AuthSession {
  return {
    ...buildTokens(email, role),
    role,
  };
}

function saveProfile(profile: StoredUserProfile): StoredUserProfile {
  return writeStorage(PROFILE_STORAGE_KEY, profile);
}

function getDefaultProfile(email?: string): StoredUserProfile {
  const safeEmail = email || DEFAULT_USER_PROFILE.email;
  const fullName = DEFAULT_USER_PROFILE.fullName || buildReadableNameFromEmail(safeEmail) || "SkillSprint User";
  const { firstName, lastName } = splitName(fullName);

  return {
    email: safeEmail,
    fullName,
    firstName,
    lastName,
    role: DEFAULT_USER_PROFILE.roles?.[0] ?? "LEARNER",
  };
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function getPostLoginPath(role: unknown): string {
  return isAdminRole(role) ? "/admin" : "/app";
}

export function getStoredAuthSession(): AuthSession | null {
  return readStorage<AuthSession | null>(AUTH_STORAGE_KEY, null);
}

export function setStoredAuthSession(session: AuthSession, email?: string, fullName?: string): AuthSession {
  writeStorage(AUTH_STORAGE_KEY, session);

  const profile = getStoredUserProfile() ?? getDefaultProfile(email);
  const mergedName = fullName?.trim() || profile.fullName;
  const split = splitName(mergedName);

  saveProfile({
    ...profile,
    email: email || profile.email,
    fullName: mergedName,
    firstName: split.firstName,
    lastName: split.lastName,
    role: session.role,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem("ss_user_logged_in", "true");
  }

  return session;
}

export function getStoredUserProfile(): StoredUserProfile | null {
  const storedProfile = readStorage<StoredUserProfile | null>(PROFILE_STORAGE_KEY, null);
  const session = getStoredAuthSession();

  if (storedProfile) {
    return {
      ...storedProfile,
      role: session?.role ?? storedProfile.role,
    };
  }

  if (!session) {
    return null;
  }

  return getDefaultProfile();
}

export async function login(input: AuthInput): Promise<LoginResult> {
  const email = input.email.trim();
  const role = inferRole(email);
  const session = buildSession(email, role);
  setStoredAuthSession(session, email, buildReadableNameFromEmail(email));

  return { status: "authenticated", tokens: session };
}

export async function register(input: AuthInput): Promise<LoginResult> {
  const email = input.email.trim();
  const role = inferRole(email);
  const session = buildSession(email, role);
  const fullName = input.fullName?.trim() || buildReadableNameFromEmail(email) || "SkillSprint User";
  setStoredAuthSession(session, email, fullName);

  return { status: "authenticated", tokens: session };
}

export async function requestPasswordReset(email: string): Promise<{ sent: boolean; email: string }> {
  return { sent: Boolean(email.trim()), email: email.trim() };
}

export function logout(): void {
  removeStorage(AUTH_STORAGE_KEY);
  removeStorage(PROFILE_STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("ss_user_logged_in");
  }
}

export default {
  login,
  register,
  logout,
  requestPasswordReset,
  getStoredAuthSession,
  getStoredUserProfile,
  isAdminRole,
  getPostLoginPath,
};