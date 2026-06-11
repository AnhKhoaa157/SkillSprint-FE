import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import {
  clearAuthTokens,
  completeCognitoOAuthLogin,
  getPostLoginPath,
} from "../../../api/authService";
import { useAuth } from "../../contexts/AuthContext";

const F = "'Plus Jakarta Sans', 'Inter', sans-serif";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { persist } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finishOAuthLogin() {
      const oauthError = searchParams.get("error");
      const oauthErrorDescription = searchParams.get("error_description");
      const code = searchParams.get("code");

      if (oauthError) {
        setError(oauthErrorDescription || oauthError);
        return;
      }

      if (!code) {
        setError("Missing Cognito authorization code.");
        return;
      }

      try {
        clearAuthTokens();
        const session = await completeCognitoOAuthLogin(code);

        if (cancelled) {
          return;
        }

        persist(session);
        navigate(getPostLoginPath(session.role), { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Google sign-in failed.");
        }
      }
    }

    finishOAuthLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate, persist, searchParams]);

  return (
    <div
      className="flex h-screen w-full items-center justify-center overflow-hidden bg-white px-4"
      style={{ fontFamily: F }}
    >
      <div className="w-full max-w-sm text-center">
        <img
          src="/logo.png"
          alt="SkillSprint logo"
          className="mx-auto mb-6 h-14 w-auto object-contain"
        />

        {error ? (
          <>
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">Sign-in failed</h1>
            <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="min-h-[44px] rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-[#FF6B00]" />
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">Completing sign-in</h1>
            <p className="text-sm text-slate-500">
              Please wait while SkillSprint creates your session.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
