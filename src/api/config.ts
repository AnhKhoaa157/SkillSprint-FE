const LOCAL_API_BASE = "http://localhost:8080";
const PRODUCTION_API_BASE = "https://api.skillsprint.site";

const env = (import.meta as any).env as {
  VITE_API_URL?: string;
  VITE_COGNITO_DOMAIN?: string;
  VITE_COGNITO_CLIENT_ID?: string;
  VITE_COGNITO_REDIRECT_URI?: string;
  PROD?: boolean;
};
const configuredApiBase = env.VITE_API_URL?.replace(/\/$/, "") || LOCAL_API_BASE;

// Local development may use localhost, but production must call the public API.
if (env.PROD && configuredApiBase !== PRODUCTION_API_BASE) {
  throw new Error(
    `Invalid production VITE_API_URL: expected "${PRODUCTION_API_BASE}", received "${configuredApiBase}".`,
  );
}

// Single source of truth: import API_BASE instead of redefining fallbacks in services.
export const API_BASE = configuredApiBase;

export const COGNITO_DOMAIN = env.VITE_COGNITO_DOMAIN?.replace(/\/$/, "") || "";
export const COGNITO_CLIENT_ID = env.VITE_COGNITO_CLIENT_ID || "";
export const COGNITO_REDIRECT_URI =
  env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;
