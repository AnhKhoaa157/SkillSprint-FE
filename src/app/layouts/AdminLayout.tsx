import { Outlet } from "react-router";
import { SessionKickoutModal } from "../components/auth/SessionKickoutModal";

export default function AdminLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", width: '100%' }}>
      <main style={{ width: '100%', padding: 0 }}>
        <Outlet />
      </main>
      <SessionKickoutModal loginPath="/admin-login" />
    </div>
  );
}
