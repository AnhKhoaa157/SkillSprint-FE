const LOCAL_API_BASE = "http://localhost:8080";
const PRODUCTION_API_BASE = "https://api.skillsprint.site";

// Check trực tiếp client-side xem có phải môi trường production thật không
const isStrictProd = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

const env = (import.meta as any).env as {
  VITE_API_URL?: string;
  VITE_COGNITO_DOMAIN?: string;
  VITE_COGNITO_CLIENT_ID?: string;
  VITE_COGNITO_REDIRECT_URI?: string;
  PROD?: boolean;
};

// 1. Cấu hình API Base URL
const configuredApiBase = env.VITE_API_URL?.replace(/\/$/, "") || (isStrictProd ? PRODUCTION_API_BASE : LOCAL_API_BASE);

if ((env.PROD || isStrictProd) && configuredApiBase !== PRODUCTION_API_BASE) {
  throw new Error(
    `Invalid production VITE_API_URL: expected "${PRODUCTION_API_BASE}", received "${configuredApiBase}".`,
  );
}

export const API_BASE = configuredApiBase;

// 2. Cấu hình AWS Cognito Domain
export const COGNITO_DOMAIN = env.VITE_COGNITO_DOMAIN?.replace(/\/$/, "") || "https://ap-southeast-1zylkslsqu.auth.ap-southeast-1.amazoncognito.com";

// 3. Cấu hình Cognito Client ID (Bao gồm Fallback chuẩn SPA không secret cho cả local và prod)
export const COGNITO_CLIENT_ID = env.VITE_COGNITO_CLIENT_ID || "6ovoqlj3dialglnc3j8pabpru8";

// 4. Cấu hình Redirect URI tự động co giãn theo Origin hiện tại (Bảo đảm không lệch www / no-www)
export const COGNITO_REDIRECT_URI = env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;