import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "./Auth";
import { login, clearAuthTokens, storeAuthTokens } from "../../../api/authService";

// ─── Hoisted spies (referenced inside vi.mock factories) ───────────────────────

const { navigateMock, useMaintenanceMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useMaintenanceMock: vi.fn(),
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

// Centralized maintenance context (consumed by both Auth and the real MaintenancePopup).
vi.mock("../../../components/system/MaintenanceGate", () => ({
  __esModule: true,
  useMaintenance: useMaintenanceMock,
  MaintenanceGate: ({ children }: { children?: unknown }) => children,
}));

// Auth service: spy on storage sanitation + token persistence; keep role helpers realistic.
vi.mock("../../../api/authService", () => ({
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

// Peripheral imports of Auth — stub to keep the render focused on the interceptor.
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

const activeMaintenanceState = {
  status: {
    isActive: true,
    message: "Hệ thống SkillSprint đang bảo trì định kỳ",
    startAt: null,
    endAt: "2026-06-15T12:00:00.000Z",
  },
  loading: false,
  refresh: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Active blackout for every case in this suite.
  useMaintenanceMock.mockReturnValue(activeMaintenanceState);
  // The auth API hands back a valid, NON-admin session payload.
  vi.mocked(login).mockResolvedValue({ status: "authenticated", tokens: LEARNER_TOKENS });
  // Spy on the browser storage mechanisms the success path would otherwise touch.
  vi.spyOn(Storage.prototype, "clear");
  vi.spyOn(Storage.prototype, "setItem");
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function submitLearnerLogin() {
  fireEvent.change(screen.getByLabelText("Địa chỉ email"), {
    target: { value: "learner@gmail.com" },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), {
    target: { value: "Learner@123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));
}

// ─── Specs ────────────────────────────────────────────────────────────────────

describe("Auth — maintenance interceptor for learners", () => {
  it("blocks a learner sign-in during maintenance: wipes tokens, aborts navigation, shows popup", async () => {
    render(<Auth />);

    submitLearnerLogin();

    // The auth API is allowed to resolve; the boundary is enforced AFTER the payload returns.
    await waitFor(() => expect(login).toHaveBeenCalledWith("learner@gmail.com", "Learner@123"));

    // 1) Partial credentials are neutralized via the sanitation method.
    await waitFor(() => expect(clearAuthTokens).toHaveBeenCalledTimes(1));

    // 2) The route transition is strictly suppressed — onLoginSuccess (which persists tokens and
    //    redirects) must never run, so neither storeAuthTokens nor navigate fire.
    expect(storeAuthTokens).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();

    // 3) The localized maintenance popup is now visible to the guest.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hệ thống đang bảo trì" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hệ thống SkillSprint đang bảo trì định kỳ"),
    ).toBeInTheDocument();
  });

  it("does not persist or hydrate any session while blocked", async () => {
    render(<Auth />);

    submitLearnerLogin();

    await waitFor(() => expect(clearAuthTokens).toHaveBeenCalled());
    // onLoginSuccess does localStorage.clear()+storeAuthTokens(); blocked path skips it entirely.
    expect(storeAuthTokens).not.toHaveBeenCalled();
    expect(Storage.prototype.setItem).not.toHaveBeenCalled();
  });
});
