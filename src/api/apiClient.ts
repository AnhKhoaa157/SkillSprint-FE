const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

const AUTH_STORAGE_KEY = "skillSprint.auth.tokens";

export type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

function readStoredTokens(): Record<string, unknown> | null {
  try {
    let raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(AUTH_STORAGE_KEY);
    }
    if (!raw) return null;

    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    const parsed = readStoredTokens();
    if (!parsed) return null;

    const token = parsed?.accessToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function getSessionId(): string | null {
  try {
    const parsed = readStoredTokens();
    if (!parsed) return null;

    const sessionId = parsed?.sessionId;
    return typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null;
  } catch {
    return null;
  }
}

export function getAuthHeaders(): Record<string, string> {
  try {
    let raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(AUTH_STORAGE_KEY);
    }
    if (!raw) return {};

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }

    const accessToken = parsed?.accessToken;
    const sessionId = parsed?.sessionId;

    if (typeof accessToken !== "string" || accessToken.length === 0) {
      return {};
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (typeof sessionId === "string" && sessionId.length > 0) {
      headers["X-Session-Id"] = sessionId;
    }

    return headers;
  } catch (err) {
    return {};
  }
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