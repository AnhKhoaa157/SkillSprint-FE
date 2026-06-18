import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "./Auth";
import { login, clearAuthTokens, storeAuthTokens } from "../../../api/auth/authService";

// ─── Hoisted spies (referenced inside vi.mock factories) ───────────────────────

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

// ─── Mocks ────────────────────────────────────────────────────────────────────

// react-router: stub navigation so we can assert the route transition is suppressed.
vi.mock("react-router", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    useNavigate: () => navigateMock,
    useLocation: () => ({ search: "", pathname: "/login", hash: "", state: null, key: "test" }),
    Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) =>
      React.createElement("a", { href: typeof to === "string" ? to : "#", ...rest }, children),
  };
});

// motion/react: render plain DOM elements (strip animation-only props), pass-through AnimatePresence.
vi.mock("motion/react", async () => {
  const React = await import("react");
  const ANIMATION_PROPS = new Set([
    "initial", "animate", "exit", "transition", "variants", "custom", "viewport",
    "whileHover", "whileTap", "whileFocus", "whileInView", "whileDrag",
    "layout", "layoutId", "drag", "dragConstraints", "dragElastic",
    "onAnimationStart", "onAnimationComplete",
  ]);
  const stripAnimationProps = (props: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const key in props) {
      if (!ANIMATION_PROPS.has(key)) out[key] = props[key];
    }
    return out;
  };
  const cache = new Map<string, unknown>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => {
        if (typeof tag !== "string") return undefined;
        if (!cache.has(tag)) {
          cache.set(
            tag,
            React.forwardRef(function MotionMock(
              { children, ...rest }: { children?: React.ReactNode },
              ref: React.Ref<unknown>,
            ) {
              return React.createElement(tag, { ref, ...stripAnimationProps(rest) }, children);
            }),
          );
        }
        return cache.get(tag);
      },
    },
  );
  const AnimatePresence = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  return { __esModule: true, motion, AnimatePresence };
});

// Auth service: spy on storage sanitation + token persistence; keep role helpers realistic.
vi.mock("../../../api/auth/authService", () => ({
  __esModule: true,
  login: vi.fn(),
  clearAuthTokens: vi.fn(),
  storeAuthTokens: vi.fn(),
  // Real-enough role resolver: only an exact ADMIN (optionally ROLE_-prefixed) is an admin.
  isAdminRole: (role: unknown) =>
    typeof role === "string" && role.trim().toUpperCase().replace(/^ROLE_/, "") === "ADMIN",
  getPostLoginPath: (role: unknown) => (role === "ADMIN" ? "/admin" : "/app"),
  redirectToCognitoGoogleSignIn: vi.fn(),
  completeNewPassword: vi.fn(),
  confirmForgotPassword: vi.fn(),
  confirmRegister: vi.fn(),
  forgotPassword: vi.fn(),
  register: vi.fn(),
  resendConfirmationCode: vi.fn(),
}));

// Peripheral imports of Auth — stub to keep the render focused on the sign-in flow.
vi.mock("../../components/layout/BrandLogo", () => ({ __esModule: true, BrandLogo: () => null }));
vi.mock("../../components/modals/RegistrationSuccessModal", () => ({
  __esModule: true,
  RegistrationSuccessModal: () => null,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LEARNER_TOKENS = {
  accessToken: "access-token",
  idToken: "id-token",
  refreshToken: "refresh-token",
  expiresIn: 3600,
  tokenType: "Bearer",
  role: "LEARNER" as const,
  sessionId: "session-123",
};

beforeEach(() => {
  vi.clearAllMocks();
  // The auth API hands back a valid, NON-admin session payload.
  vi.mocked(login).mockResolvedValue({ status: "authenticated", tokens: LEARNER_TOKENS });
  vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {});
  vi.spyOn(Storage.prototype, "setItem");
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// <Auth> holds a full-screen spinner until its initial maintenance check resolves
// (initialCheckDone). With no <MaintenanceContext> provider in the test, refresh() is the default
// no-op, but it still resolves on a later microtask — so we must await the form entering the DOM
// (findByLabelText waits out the spinner) before firing any events.
async function submitLearnerLogin() {
  fireEvent.change(await screen.findByLabelText("Địa chỉ email"), {
    target: { value: "learner@gmail.com" },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), {
    target: { value: "Learner@123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));
}

// ─── Specs ────────────────────────────────────────────────────────────────────

// Maintenance lockdown now lives entirely in <MaintenanceGate> (it replaces the whole app,
// including this page, when active). The login page itself must therefore carry NO maintenance
// interception logic — a successful learner sign-in always proceeds.
describe("Auth — no auth-layer maintenance interception", () => {
  it("lets a successful learner sign-in proceed (gate owns the lockdown)", async () => {
    render(<Auth />);

    await submitLearnerLogin();

    await waitFor(() => expect(login).toHaveBeenCalledWith("learner@gmail.com", "Learner@123"));

    // onLoginSuccess runs: the fresh session is persisted and tokens are NOT wiped.
    await waitFor(() => expect(storeAuthTokens).toHaveBeenCalledWith(LEARNER_TOKENS));
    expect(clearAuthTokens).not.toHaveBeenCalled();

    // No blocking maintenance dialog is rendered from the login page anymore.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
