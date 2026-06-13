import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { SESSION_EXPIRED_EVENT, markRedirectHandled } from "../../../api/sessionExpiry";

/**
 * Global listener for session-expiry events raised by the HTTP clients.
 *
 * Mounted once inside the router tree (RootLayout). When a 401 invalidates the
 * session it resets the auth context and redirects to the correct login page
 * (admin vs learner). Storage cleanup + the toast are already done centrally in
 * `triggerSessionExpiry`; this component only owns the in-app navigation.
 */
export function SessionExpiryHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const handle = () => {
      markRedirectHandled(); // cancel the hard-redirect safety net in sessionExpiry
      logout(); // clear React auth state so guarded routes re-evaluate
      const loginPath = location.pathname.startsWith("/admin") ? "/admin-login" : "/login";
      navigate(loginPath, { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handle);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handle);
  }, [navigate, location.pathname, logout]);

  return null;
}

export default SessionExpiryHandler;
