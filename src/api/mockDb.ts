export const MOCK_STORAGE_KEYS = {
  authSession: "skillSprint.mock.authSession",
  userProfile: "skillSprint.mock.userProfile",
  onboarding: "skillSprint.mock.onboarding",
  workspaces: "skillSprint.mock.workspaces",
  adminUsers: "skillSprint.mock.adminUsers",
} as const;

export const DEFAULT_USER_PROFILE = {
  userId: "USR-MOCK-001",
  email: "student@university.edu",
  emailVerified: true,
  fullName: "Nguyễn Văn A",
  avatarUrl: "",
  timeZone: "Asia/Ho_Chi_Minh",
  status: "ACTIVE",
  roles: ["LEARNER"],
};

export function hasWindowStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!hasWindowStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): T {
  if (hasWindowStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  return value;
}

export function removeStorage(key: string): void {
  if (hasWindowStorage()) {
    window.localStorage.removeItem(key);
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}