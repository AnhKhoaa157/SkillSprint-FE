import { useLocation, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // 401-driven logout + redirect is handled globally by <SessionExpiryHandler/>;
  // this guard only blocks unauthenticated access to protected routes.
  if (isAuthenticated) return <>{children}</>;
  return <Navigate to="/login" state={{ from: location }} replace />;
}
