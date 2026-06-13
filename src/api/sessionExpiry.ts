import { toast } from "sonner";
import { clearAuthTokens } from "./authService";

/**
 * Centralised "the session is no longer valid" handler.
 *
 * Triggered when any HTTP client sees a 401 — typically after the backend/RDS
 * resets and rejects requests with codes like SESSION_EXPIRED,
 * USER_PROFILE_NOT_FOUND or USER_CONTEXT_INVALID. It clears all auth state,
 * shows one user-friendly toast, and redirects to the login page exactly once,
 * even when dozens of concurrent requests fail at the same instant.
 *
 * This module is framework-agnostic (no React) so it can be called from fetch
 * wrappers and the Axios interceptor alike. The actual SPA navigation is done by
 * <SessionExpiryHandler/>, which listens for the SESSION_EXPIRED_EVENT; a hard
 * redirect is used as a safety net if no handler is mounted.
 */

export const SESSION_EXPIRED_EVENT = "session-expired";
const TOAST_ID = "session-expired"; // stable id → sonner shows it only once

/** Backend error codes that accompany an auth 401 and refine the user message. */
export const AUTH_FAILURE_CODES = [
  "SESSION_EXPIRED",
  "USER_PROFILE_NOT_FOUND",
  "USER_CONTEXT_INVALID",
] as const;
export type AuthFailureCode = (typeof AUTH_FAILURE_CODES)[number];

const MESSAGES: Record<AuthFailureCode, string> = {
  SESSION_EXPIRED: "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.",
  USER_PROFILE_NOT_FOUND: "Hệ thống vừa được cập nhật. Vui lòng đăng nhập lại để tiếp tục.",
  USER_CONTEXT_INVALID: "Hệ thống vừa được cập nhật. Vui lòng đăng nhập lại để tiếp tục.",
};
const DEFAULT_MESSAGE = "Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.";

export type SessionExpiryDetail = {
  status?: number;
  code?: string | null;
  message?: string;
};

/** A 401 is always an auth failure; the codes are also accepted defensively. */
export function isAuthFailure(status?: number, code?: string | null): boolean {
  if (status === 401) return true;
  return code != null && (AUTH_FAILURE_CODES as readonly string[]).includes(code);
}

/** Best-effort pull of a string error code out of an unknown API payload. */
export function extractAuthCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  const candidate = p.errorCode ?? p.error ?? (typeof p.code === "string" ? p.code : undefined);
  return typeof candidate === "string" ? candidate : undefined;
}

function resolveMessage({ code, message }: SessionExpiryDetail): string {
  if (message) return message;
  if (code && (AUTH_FAILURE_CODES as readonly string[]).includes(code)) {
    return MESSAGES[code as AuthFailureCode];
  }
  return DEFAULT_MESSAGE;
}

/** Login page differs for admin vs learner areas. */
function resolveLoginPath(): string {
  return window.location.pathname.startsWith("/admin") ? "/admin-login" : "/login";
}

// ─── Single-execution guards (module singletons) ─────────────────────────────
let loggingOut = false; // collapses concurrent 401s into a single logout
let redirected = false; // lets the React handler cancel the hard-redirect safety net

/** Called by <SessionExpiryHandler/> when it performs the in-app SPA redirect. */
export function markRedirectHandled(): void {
  redirected = true;
}

/** Re-arm the guards after a successful (re)login so future expiries fire again. */
export function resetSessionExpiry(): void {
  loggingOut = false;
  redirected = false;
}

/**
 * The one entry point HTTP clients call on a 401. Idempotent within a logout
 * cycle: the first call wins, the rest return immediately.
 */
export function triggerSessionExpiry(detail: SessionExpiryDetail = {}): void {
  if (loggingOut) return;
  loggingOut = true;

  // 1. Wipe every piece of auth state/storage:
  //    accessToken, refreshToken, idToken, sessionId + the canonical session
  //    blob (from which the user profile and role/permission cache are derived).
  clearAuthTokens();

  // 2. One friendly toast (deduped by id, survives the SPA redirect).
  toast.error(resolveMessage(detail), { id: TOAST_ID, duration: 4500 });

  // 3. Ask the in-app handler to redirect (SPA, no reload, keeps the toast).
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));

  // 4. Safety net: if nothing handled the SPA redirect (e.g. a 401 fired before
  //    the router mounted), fall back to a hard redirect.
  window.setTimeout(() => {
    if (!redirected) {
      redirected = true;
      window.location.replace(resolveLoginPath());
    }
  }, 400);
}
