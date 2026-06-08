import { useLocation, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // Only ADMIN roles are allowed in the admin panel
  if (session?.role && session.role !== "ADMIN") {
    return <Navigate to="/app/workspaces" replace />;
  }

  return <>{children}</>;
}
