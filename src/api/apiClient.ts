import { getStoredAuthSession, isValidAuthSession } from "./authService";
import { triggerSessionExpiry, extractAuthCode } from "./sessionExpiry";
import { API_BASE } from "./config";

export type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export function getAuthToken(): string | null {
  const session = getStoredAuthSession();
  return isValidAuthSession(session) ? session.accessToken : null;
}

export function getSessionId(): string | null {
  const session = getStoredAuthSession();
  return isValidAuthSession(session) ? session.sessionId : null;
}

export function getAuthHeaders(): Record<string, string> {
  const session = getStoredAuthSession();
  if (!isValidAuthSession(session)) {
    return {};
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
  };
  // isValidAuthSession() already guarantees a non-empty sessionId; guard anyway
  // so we never emit a literal "null" X-Session-Id header.
  if (session.sessionId) {
    headers["X-Session-Id"] = session.sessionId;
  }
  return headers;
}

/**
 * Shared fetch-based request function with optimized clean console logs
 */
export async function requestJson<T>(
  path: string,
  opts: RequestInit = {},
): Promise<ApiResponse<T>> {
  const authHeaders = getAuthHeaders();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
    ...(opts.headers as Record<string, string> || {}),
  };

  // 🎯 FIX CHỖ NÀY: Cắt bỏ token dài ngoằng, chỉ in 10 ký tự đầu để debug gọn gàng sạch sẽ!
  const shortToken = headers.Authorization && headers.Authorization !== "(not set)"
    ? `${headers.Authorization.substring(0, 15)}...`
    : "(not set)";

  console.log(
    `[apiClient] → ${opts.method || "GET"} ${path} | Auth: ${shortToken} | Session: ${headers["X-Session-Id"] ?? "(not set)"}`
  );

  const response = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    // Workaround cứu vớt lỗi 500/403 ngáo nếu ruột trả về thành công
    if (payload && payload.success === true && payload.code === 200) {
      console.warn(
        `[apiClient] Backend sent HTTP ${response.status} but payload indicates success=true — treating as success.`
      );
      return payload;
    }

    if (response.status === 401) {
      triggerSessionExpiry({ status: 401, code: extractAuthCode(payload) });
    }

    const message = payload?.message || `Server error: ${response.status}`;
    const error: any = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (!payload) {
    throw new Error("Invalid response from server");
  }

  return payload;
}
