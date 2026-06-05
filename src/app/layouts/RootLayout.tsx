import { Outlet } from "react-router";
import { PomodoroProvider } from "../contexts/PomodoroContext";

/**
 * Pathless root layout — wraps the entire route tree so that PomodoroProvider
 * (which uses useBlocker internally) lives inside the React Router context.
 */
export default function RootLayout() {
  return (
    <PomodoroProvider>
      <Outlet />
    </PomodoroProvider>
  );
}
