import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, ShieldAlert } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = { loginPath: string };

export function SessionKickoutModal({ loginPath }: Props) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handle = () => setVisible(true);
    window.addEventListener("session-kickout-triggered", handle);
    return () => window.removeEventListener("session-kickout-triggered", handle);
  }, []);

  if (!visible) return null;

  function handleReLogin() {
    logout();
    localStorage.clear();
    sessionStorage.clear();
    navigate(loginPath, { replace: true });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "36px 32px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "'Inter','Plus Jakarta Sans',sans-serif",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "14px",
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
        }}>
          <ShieldAlert size={26} color="#DC2626" />
        </div>

        <h2 style={{
          fontSize: "1.2rem", fontWeight: 800, color: "#111827",
          marginBottom: "10px", textAlign: "center", lineHeight: 1.25,
          margin: "0 0 10px 0",
        }}>
          Phiên đăng nhập hết hạn
        </h2>

        <p style={{
          fontSize: "0.875rem", color: "#6B7280", textAlign: "center",
          lineHeight: 1.65, marginBottom: "28px", margin: "0 0 28px 0",
        }}>
          Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc trình duyệt khác.
          Bạn đã bị đăng xuất khỏi phiên làm việc này.
        </p>

        <button
          onClick={handleReLogin}
          style={{
            width: "100%", padding: "13px 0",
            background: "linear-gradient(135deg, #FF6B00, #FF8C3A)",
            color: "#FFFFFF", fontWeight: 700, fontSize: "0.95rem",
            border: "none", borderRadius: "12px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(255,107,0,0.30)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <LogIn size={17} />
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
}
