import { useEffect } from "react";
import { useLocation, Navigate, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleSessionKickout = () => {
      logout();
      navigate("/login", { replace: true });
    };

    // User dashboard routes listen for API 401 events, not just admin routes.
    window.addEventListener("session-kickout-triggered", handleSessionKickout);
    return () => window.removeEventListener("session-kickout-triggered", handleSessionKickout);
  }, [logout, navigate]);

  if (isAuthenticated) return <>{children}</>;
  return <Navigate to="/login" state={{ from: location }} replace />;
}
