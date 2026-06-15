import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { RegistrationSuccessModal } from "../../components/modals/RegistrationSuccessModal";
import { AuthForm } from "./AuthForm";
import { AuthLayout } from "./components/AuthLayout";
import { ResetPassword } from "./components/ResetPassword";
import { NewPasswordRequiredModal } from "./components/NewPasswordRequired";
import { ConfirmRegisterModal } from "./components/ConfirmRegister";
import { isMaintenanceError } from "./components/AuthShared";
import { storeAuthTokens, getPostLoginPath, redirectToCognitoGoogleSignIn, login, isAdminRole } from "../../../api/authService";
import { useMaintenance } from "../../../components/system/MaintenanceGate";
import { getSystemStatus } from "../../../api/systemMaintenanceService";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status: maintenanceStatus, loading: maintenanceLoading, refresh: refreshMaintenance } = useMaintenance();

  const [forceMaintenanceView, setForceMaintenanceView] = useState(false);
  const isCurrentlyLocked = maintenanceStatus?.isActive === true || forceMaintenanceView === true;
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showReset, setShowReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [challengeSession, setChallengeSession] = useState("");
  const [challengeRole, setChallengeRole] = useState<string | null>(null);
  
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "register") setTab("signup");
    if (mode === "login") setTab("signin");
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;
    const performInitialCheck = async () => {
      try {
        await refreshMaintenance();
      } catch (e) {
        if (isMaintenanceError(e)) setForceMaintenanceView(true);
      } finally {
        if (isMounted) setInitialCheckDone(true);
      }
    };
    void performInitialCheck();

    const intervalId = setInterval(() => {
      void refreshMaintenance().catch((e) => {
        if (isMaintenanceError(e)) setForceMaintenanceView(true);
      });
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [location.pathname, refreshMaintenance]);

  useEffect(() => {
    if (maintenanceStatus?.isActive === false) setForceMaintenanceView(false);
  }, [maintenanceStatus]);

  const onLoginSuccess = async (tokens: Parameters<typeof storeAuthTokens>[0]) => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      storeAuthTokens(tokens);
      setTimeout(() => {
        window.location.href = getPostLoginPath(tokens.role);
      }, 100);
    } catch (error) {
      console.error("Login session initialization failed:", error);
    }
  };

  const handleContinueWithGoogle = async () => {
    if (isCurrentlyLocked || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const fresh = await getSystemStatus();
      void refreshMaintenance();
      if (fresh.isActive) {
        setForceMaintenanceView(true);
        return;
      }
      redirectToCognitoGoogleSignIn();
    } catch (e) {
      if (isMaintenanceError(e)) setForceMaintenanceView(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSwitchMode = (newMode: "signin" | "signup") => {
    setTab(newMode);
    navigate(`/login?mode=${newMode === "signup" ? "register" : "login"}`, { replace: true });
  };

  const handleAutoLogin = async () => {
    if (isCurrentlyLocked || !modalEmail || !modalPassword) {
      navigate("/");
      return;
    }
    try {
      const result = await login(modalEmail, modalPassword);
      if (result.status === "authenticated") {
        if (isAdminRole(result.tokens.role)) return;
        await onLoginSuccess(result.tokens);
      }
    } catch (e) {
      navigate("/");
    }
  };

  if (maintenanceLoading || !initialCheckDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <AuthLayout>
      <AuthForm
        mode={tab}
        isMaintenanceActive={isCurrentlyLocked}
        isGoogleLoading={isGoogleLoading}
        onContinueWithGoogle={handleContinueWithGoogle}
        onSwitchMode={handleSwitchMode}
        onLoginSuccess={onLoginSuccess}
        onRequireNewPassword={(email, session, role) => {
          setModalEmail(email);
          setChallengeSession(session);
          setChallengeRole(role);
          setShowNewPassword(true);
        }}
        onRequireConfirmation={(email, password) => {
          setModalEmail(email);
          if (password) setModalPassword(password);
          setShowConfirm(true);
        }}
        onForgotPassword={() => setShowReset(true)}
        onError={(msg) => { if (msg === "maintenance") setForceMaintenanceView(true); }}
      />

      <AnimatePresence>
        {showReset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResetPassword onBack={() => setShowReset(false)} />
          </motion.div>
        )}
        {showNewPassword && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NewPasswordRequiredModal
              email={modalEmail}
              session={challengeSession}
              onBack={() => {
                setShowNewPassword(false);
                setChallengeSession("");
                setChallengeRole(null);
              }}
              onSuccess={(role) => {
                setShowNewPassword(false);
                setChallengeSession("");
                setChallengeRole(null);
                if (isAdminRole(role ?? challengeRole)) return;
                navigate("/app");
              }}
            />
          </motion.div>
        )}
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConfirmRegisterModal
              email={modalEmail}
              onClose={() => setShowConfirm(false)}
              onConfirmed={() => {
                setShowConfirm(false);
                setShowSuccess(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <RegistrationSuccessModal
        open={showSuccess}
        onStartSetup={handleAutoLogin}
        onSkip={() => {
          setShowSuccess(false);
          setModalEmail("");
          setModalPassword("");
          navigate("/");
        }}
      />
    </AuthLayout>
  );
}