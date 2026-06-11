import { API_BASE, COGNITO_CLIENT_ID, COGNITO_DOMAIN, COGNITO_REDIRECT_URI } from "./config";

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

type CognitoTokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

type OAuthSessionPayload = {
  sessionId?: string | null;
};

export type LoginResult =
  | { status: "authenticated"; tokens: AuthSession }
  | { status: "new-password-required"; challengeName: string; session: string; role: AuthRole | null };

const AUTH_STORAGE_KEY = "skillSprint.auth.tokens";
const SESSION_HYDRATED_KEY = "skillSprint.auth.hydrated";
const AUTH_CLEANUP_KEYS = [
  AUTH_STORAGE_KEY,
  SESSION_HYDRATED_KEY,
  "accessToken",
  "idToken",
  "refreshToken",
  "sessionId",
] as const;

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

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isAccessTokenValid(accessToken: unknown): accessToken is string {
  if (!hasText(accessToken)) {
    return false;
  }

  const payload = decodeJwtPayload(accessToken);
  const expiresAtSeconds = payload?.exp;

  // Require a standard JWT exp claim so malformed or opaque tokens are rejected.
  return typeof expiresAtSeconds === "number" && expiresAtSeconds * 1000 > Date.now();
}

export function isValidAuthSession(session: AuthSession | null | undefined): session is AuthSession {
  return Boolean(session && isAccessTokenValid(session.accessToken) && hasText(session.sessionId));
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

function assertCognitoConfig(): void {
  if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID) {
    throw new Error("Missing Cognito Hosted UI configuration.");
  }
}

function buildAuthSessionFromOAuthTokens(tokens: CognitoTokenResponse, sessionId: string): AuthSession {
  return {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token ?? "",
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type || "Bearer",
    role: extractRole({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
    }),
    sessionId,
  };
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function getPostLoginPath(role: unknown): string {
  return isAdminRole(role) ? "/admin" : "/app";
}

export function buildCognitoAuthorizeUrl(): string {
  assertCognitoConfig();

  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: COGNITO_REDIRECT_URI,
  });

  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export function redirectToCognitoGoogleSignIn(): void {
  window.location.assign(buildCognitoAuthorizeUrl());
}

export function getStoredAuthSession(): AuthSession | null {
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) ?? localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    // Strict validation: protected routes require both a live JWT and Redis sessionId.
    const session: AuthSession = {
      accessToken: parsed.accessToken ?? "",
      idToken: parsed.idToken ?? "",
      refreshToken: parsed.refreshToken ?? "",
      expiresIn: parsed.expiresIn ?? 0,
      tokenType: parsed.tokenType ?? "Bearer",
      role: extractRole(parsed as Partial<AuthPayload> & Record<string, unknown>),
      sessionId: parsed.sessionId ?? null,
    };

    if (!isValidAuthSession(session)) {
      return null;
    }

    return session;
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

  if (!data.accessToken || !data.idToken || !data.refreshToken || !data.sessionId) {
    throw new Error("Thiếu token xác thực từ máy chủ.");
  }

  const tokens = buildAuthSession(data);
  if (!isValidAuthSession(tokens)) {
    throw new Error("Invalid or expired authentication session.");
  }

  return {
    status: "authenticated",
    tokens,
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

  if (!data || !data.accessToken || !data.idToken || !data.refreshToken || !data.sessionId) {
    throw new Error(response.message || "Không thể hoàn tất đổi mật khẩu.");
  }

  const tokens = buildAuthSession(data);
  if (!isValidAuthSession(tokens)) {
    throw new Error(response.message || "Invalid or expired authentication session.");
  }

  return tokens;
}

async function exchangeCognitoAuthorizationCode(code: string): Promise<CognitoTokenResponse> {
  assertCognitoConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: COGNITO_CLIENT_ID,
    code,
    redirect_uri: COGNITO_REDIRECT_URI,
  });

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | (Partial<CognitoTokenResponse> & { error?: string; error_description?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.error || "Cannot exchange Cognito authorization code.");
  }

  if (!payload?.access_token || !payload.id_token || !payload.expires_in || !payload.token_type) {
    throw new Error("Invalid Cognito token response.");
  }

  return {
    access_token: payload.access_token,
    id_token: payload.id_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    token_type: payload.token_type,
  };
}

async function createOAuthApplicationSession(accessToken: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/oauth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<OAuthSessionPayload> | null;

  if (!response.ok) {
    throw new Error(payload?.message || `OAuth session initialization failed: ${response.status}`);
  }

  const sessionId = payload?.data?.sessionId;
  if (!sessionId) {
    throw new Error("Backend OAuth session response is missing sessionId.");
  }

  return sessionId;
}

export async function completeCognitoOAuthLogin(code: string): Promise<AuthSession> {
  const cognitoTokens = await exchangeCognitoAuthorizationCode(code);
  const sessionId = await createOAuthApplicationSession(cognitoTokens.access_token);
  const session = buildAuthSessionFromOAuthTokens(cognitoTokens, sessionId);

  if (!isValidAuthSession(session)) {
    throw new Error("Invalid or expired OAuth authentication session.");
  }

  return session;
}

export function storeAuthTokens(tokens: AuthSession): void {
  if (!isValidAuthSession(tokens)) {
    throw new Error("Cannot store an invalid authentication session.");
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  // Remove the canonical session blob plus legacy individual token keys.
  for (const key of AUTH_CLEANUP_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
