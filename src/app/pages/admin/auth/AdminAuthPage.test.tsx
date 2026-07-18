import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AdminAuthPage from "./AdminAuthPage";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("framer-motion", () => {
  type MotionDivProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & {
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  };

  const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(
    ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }, ref) => (
      <div ref={ref} {...props}>{children}</div>
    ),
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MotionDiv },
    useReducedMotion: () => false,
  };
});

vi.mock("../../../../api/auth/authService", () => ({
  completePasswordReset: vi.fn(),
  forgotPassword: vi.fn(),
  getPostLoginPath: vi.fn(),
  isAdminRole: vi.fn(),
  login: vi.fn(),
  storeAuthTokens: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("AdminAuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the refreshed admin sign-in form with accessible controls", () => {
    render(<AdminAuthPage />);

    expect(screen.getByRole("img", { name: "SkillSprint" })).toHaveAttribute("src", "/logo.png");
    expect(screen.getByRole("heading", { name: "Đăng nhập Admin" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email quản trị")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));

    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toBeInTheDocument();
  });

  it("keeps the password recovery route and learner-login navigation available", () => {
    render(<AdminAuthPage />);

    fireEvent.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
    expect(screen.getByRole("heading", { name: "Quên mật khẩu" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email tài khoản Admin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quay lại đăng nhập" }));
    expect(screen.getByRole("heading", { name: "Đăng nhập Admin" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quay lại đăng nhập học viên" }));
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
