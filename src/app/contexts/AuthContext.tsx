import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getStoredAuthSession,
  storeAuthTokens,
  clearAuthTokens,
  isValidAuthSession,
  type AuthSession,
} from "../../api/authService";
import { resetSessionExpiry } from "../../api/sessionExpiry";

const AUTH_STORAGE_KEY = "skillSprint.auth.tokens";
const SESSION_HYDRATED_KEY = "skillSprint.auth.hydrated";

/* ─── Helpers ─── */

/**
 * Writes the current localStorage tokens into sessionStorage so that
 * a fresh page load can be detected (sessionStorage survives tab
 * reload within the same session, but not new tab).
 */
function hydrateSessionStorage(session: AuthSession): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    sessionStorage.setItem(SESSION_HYDRATED_KEY, "true");
  } catch {
    // sessionStorage may be full or blocked; non-critical
  }
}

/**
 * On first load, if localStorage has tokens but sessionStorage doesn't,
 * we know this is a "new tab" or a post-reload where hydration didn't
 * happen yet.  We copy the tokens into sessionStorage so the rest of
 * the app can rely on either store.
 */
function ensureSessionHydration(): AuthSession | null {
  const session = getStoredAuthSession();

  if (!isValidAuthSession(session)) {
    clearAuthTokens();
    return null;
  }

  // Write to sessionStorage if not already hydrated in this browser session.
  const alreadyHydrated = sessionStorage.getItem(SESSION_HYDRATED_KEY);
  if (!alreadyHydrated) {
    hydrateSessionStorage(session);
  }

  return session;
}

/* ─── Context ─── */

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  hydrate: () => AuthSession | null;
  persist: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ─── Provider ─── */

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    ensureSessionHydration(),
  );

  const hydrate = useCallback((): AuthSession | null => {
    const s = ensureSessionHydration();
    setSession(s);
    return s;
  }, []);

  const persist = useCallback((tokens: AuthSession) => {
    storeAuthTokens(tokens);
    hydrateSessionStorage(tokens);
    setSession(tokens);
    resetSessionExpiry(); // re-arm the 401 guard so a future expiry fires again
  }, []);

  const logout = useCallback(() => {
    clearAuthTokens();
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_HYDRATED_KEY);
    } catch {
      // ignore
    }
    setSession(null);
  }, []);

  // Re-hydrate on mount (handles the case where localStorage was updated
  // in another tab between render and effect).
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const value: AuthContextValue = {
    session,
    isAuthenticated: isValidAuthSession(session),
    hydrate,
    persist,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Consumer hook ─── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthContextProvider>");
  }
  return ctx;
}
