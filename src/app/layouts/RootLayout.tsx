import { Outlet } from "react-router";
import { PomodoroProvider } from "../contexts/PomodoroContext";
import { SessionExpiryHandler } from "../components/auth/SessionExpiryHandler";

/**
 * Pathless root layout — wraps the entire route tree so that PomodoroProvider
 * (which uses useBlocker internally) lives inside the React Router context.
 * It also hosts the global SessionExpiryHandler so a 401 on any route triggers
 * one centralised logout + redirect.
 */
export default function RootLayout() {
  return (
    <PomodoroProvider>
      <SessionExpiryHandler />
      <Outlet />
    </PomodoroProvider>
  );
}
