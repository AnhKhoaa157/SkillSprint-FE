import React from "react";
import { useLocation, Navigate } from "react-router";
import { getStoredAuthSession } from "../../api/authService";

function isAuthenticated() {
  try {
    const session = getStoredAuthSession();
    return !!(session && session.accessToken);
  } catch (e) {
    return false;
  }
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (isAuthenticated()) return <>{children}</>;
  return <Navigate to="/auth?mode=login" state={{ from: location }} replace />;
}
