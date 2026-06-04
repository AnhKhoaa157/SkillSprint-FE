const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  /** Unique session identifier used for SingleSessionFilter (Redis). */
  sessionId?: string;
};

export type AuthRole = "ADMIN" | "LEARNER" | string;

export type AuthSession = AuthTokens & {
  role: AuthRole | null;
  sessionId: string | null;
};

export type StoredUserProfile = {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: AuthRole | null;
};

type AuthPayload = AuthTokens & {
  challengeName?: string | null;
  session?: string | null;
  sessionId?: string | null;
  role_name?: string | string[] | null;
  roleName?: string | string[] | null;
  role?: string | string[] | null;
  userRole?: string | string[] | null;
  roles?: string | string[] | null;
  groups?: string | string[] | null;
};

type EmptyPayload = Record<string, never>;

export type LoginResult =
  | { status: "authenticated"; tokens: AuthSession }
  | { status: "new-password-required"; challengeName: string; session: string; role: AuthRole | null };

const AUTH_STORAGE_KEY = "skillSprint.auth.tokens";

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? `${normalized}${"=".repeat(4 - padding)}` : normalized;

  return atob(padded);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

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

function normalizeRoleSource(value: unknown): AuthRole | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const role = normalizeRole(item);
      if (role) {
        return role;
      }
    }

    return null;
  }

  return normalizeRole(value);
}

function extractRole(data: Partial<AuthPayload> | Record<string, unknown> | null | undefined): AuthRole | null {
  if (!data) {
    return null;
  }

  const directSources = [data.role_name, data.roleName, data.role, data.userRole, data.roles, data.groups];

  for (const source of directSources) {
    const role = normalizeRoleSource(source);
    if (role) {
      return role;
    }
  }

  const jwtSources = [data.idToken, data.accessToken];

  for (const source of jwtSources) {
    if (typeof source !== "string") {
      continue;
    }

    const payload = decodeJwtPayload(source);
    if (!payload) {
      continue;
    }

    const claimSources = [
      payload.role_name,
      payload.roleName,
      payload.role,
      payload.userRole,
      payload.roles,
      payload.groups,
      payload["custom:role"],
      payload["custom:roles"],
      payload["cognito:groups"],
      payload["user_role"],
    ];

    for (const claimSource of claimSources) {
      const role = normalizeRoleSource(claimSource);
      if (role) {
        return role;
      }
    }
  }

  return null;
}

function buildAuthSession(data: AuthPayload): AuthSession {
  return {
    accessToken: data.accessToken,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn ?? 0,
    tokenType: data.tokenType ?? "Bearer",
    role: extractRole(data),
    sessionId: data.sessionId ?? null,
  };
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function getPostLoginPath(role: unknown): string {
  return isAdminRole(role) ? "/admin" : "/app";
}

export function getStoredAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    // Relaxed validation — only accessToken is required.
    // The BE SingleSessionFilter uses the sessionId for Redis validation,
    // not refreshToken, so we should not reject tokens just because
    // refreshToken is missing (some token-response shapes omit it).
    if (!parsed.accessToken) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      idToken: parsed.idToken ?? "",
      refreshToken: parsed.refreshToken ?? "",
      expiresIn: parsed.expiresIn ?? 0,
      tokenType: parsed.tokenType ?? "Bearer",
      role: extractRole(parsed as Partial<AuthPayload> & Record<string, unknown>),
      sessionId: parsed.sessionId ?? null,
    };
  } catch {
    return null;
  }
}

function readStringClaim(payload: Record<string, unknown> | null, keys: string[]): string {
  if (!payload) {
    return "";
  }

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
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

export function getStoredUserProfile(): StoredUserProfile | null {
  const session = getStoredAuthSession();
  if (!session) {
    return null;
  }

  const idTokenPayload = decodeJwtPayload(session.idToken);
  const accessTokenPayload = decodeJwtPayload(session.accessToken);

  const email =
    readStringClaim(idTokenPayload, ["email", "username", "cognito:username"]) ||
    readStringClaim(accessTokenPayload, ["email", "username", "cognito:username"]);

  const claimedFullName =
    readStringClaim(idTokenPayload, ["name", "full_name", "preferred_username"]) ||
    readStringClaim(accessTokenPayload, ["name", "full_name", "preferred_username"]);

  const givenName = readStringClaim(idTokenPayload, ["given_name"]);
  const familyName = readStringClaim(idTokenPayload, ["family_name"]);

  const fullName =
    claimedFullName ||
    `${givenName} ${familyName}`.trim() ||
    buildReadableNameFromEmail(email);

  const { firstName, lastName } = splitName(fullName);

  return {
    email,
    fullName,
    firstName,
    lastName,
    role: session.role,
  };
}

async function requestJson<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    throw new Error("Không thể kết nối tới máy chủ đăng nhập. Hãy chắc BE đang chạy và không có lỗi mạng.");
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const message = payload?.message || `Máy chủ trả lỗi: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error("Phản hồi đăng nhập không hợp lệ từ máy chủ.");
  }

  return payload;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await requestJson<AuthPayload>("/api/auth/login", {
    email,
    password,
  });

  const data = response.data;

  if (!data) {
    throw new Error(response.message || "Đăng nhập thất bại.");
  }

  if (data.challengeName && data.session) {
    return {
      status: "new-password-required",
      challengeName: data.challengeName,
      session: data.session,
      role: extractRole(data),
    };
  }

  if (!data.accessToken || !data.idToken || !data.refreshToken) {
    throw new Error("Thiếu token xác thực từ máy chủ.");
  }

  return {
    status: "authenticated",
    tokens: buildAuthSession(data),
  };
}

export async function register(fullName: string, email: string, password: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/register", {
    fullName,
    email,
    password,
  });
}

export async function confirmRegister(email: string, confirmationCode: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/confirm-register", {
    email,
    confirmationCode,
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/resend-confirmation-code", {
    email,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/forgot-password", {
    email,
  });
}

export async function confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/confirm-forgot-password", {
    email,
    confirmationCode,
    newPassword,
  });
}

/**
 * Step 2 of the forgot-password flow: verifies the 6-digit code sent to the
 * user's email. Called before the new password is submitted.
 * POST /api/auth/confirm-forgot-password  Body: { email, code }
 */
export async function verifyPasswordResetCode(email: string, code: string): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/confirm-forgot-password", {
    email,
    code,
  });
}

/**
 * Step 3 of the forgot-password flow: sets the new password using the verified
 * code. This is separate from the challenge-based completeNewPassword flow.
 * POST /api/auth/complete-new-password  Body: { email, code, newPassword }
 */
export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await requestJson<EmptyPayload>("/api/auth/complete-new-password", {
    email,
    code,
    newPassword,
  });
}

export async function completeNewPassword(email: string, newPassword: string, session: string): Promise<AuthSession> {
  const response = await requestJson<AuthPayload>("/api/auth/complete-new-password", {
    email,
    newPassword,
    session,
  });

  const data = response.data;

  if (!data || !data.accessToken || !data.idToken || !data.refreshToken) {
    throw new Error(response.message || "Không thể hoàn tất đổi mật khẩu.");
  }

  return buildAuthSession(data);
}

export function storeAuthTokens(tokens: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem("skillSprint.auth.hydrated");
  } catch {
    // non-critical
  }
}
