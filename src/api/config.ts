const LOCAL_API_BASE = "http://localhost:8080";
const PRODUCTION_API_BASE = "https://api.skillsprint.site";

// Kiểm tra nghiêm ngặt môi trường chạy thực tế dựa trên Hostname của trình duyệt
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

// 3. Cấu hình Cognito Client ID
export const COGNITO_CLIENT_ID = env.VITE_COGNITO_CLIENT_ID || "6ovoqlj3dialglnc3j8pabpru8";

// 4. KHÓA CỨNG REDIRECT URI THEO TRÌNH DUYỆT (Xóa bỏ hoàn toàn biến env gây nhiễu link)
// User vào bằng https://skillsprint.site -> Redirect về đúng https://skillsprint.site/auth/callback
// User vào bằng https://www.skillsprint.site -> Redirect về đúng https://www.skillsprint.site/auth/callback
export const COGNITO_REDIRECT_URI = `${window.location.origin}/auth/callback`;