import { useLocation, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <>{children}</>;
  return <Navigate to="/auth?mode=login" state={{ from: location }} replace />;
}
