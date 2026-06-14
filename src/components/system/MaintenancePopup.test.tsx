import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaintenancePopup } from "./MaintenancePopup";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// motion/react → render plain DOM elements (strip animation-only props) so AnimatePresence
// content is mounted synchronously and we never depend on requestAnimationFrame timing.
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

// Centralized maintenance context. Tests drive this to simulate an active blackout.
const { useMaintenanceMock } = vi.hoisted(() => ({ useMaintenanceMock: vi.fn() }));
vi.mock("./MaintenanceGate", () => ({
  __esModule: true,
  useMaintenance: useMaintenanceMock,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTIVE_MESSAGE = "Hệ thống SkillSprint đang bảo trì định kỳ";
const ACTIVE_END_AT = "2026-06-15T12:00:00.000Z";

const activeMaintenanceState = {
  status: {
    isActive: true,
    message: ACTIVE_MESSAGE,
    startAt: null,
    endAt: ACTIVE_END_AT,
  },
  loading: false,
  refresh: vi.fn(),
};

beforeEach(() => {
  useMaintenanceMock.mockReturnValue(activeMaintenanceState);
});

// ─── Specs ────────────────────────────────────────────────────────────────────

describe("MaintenancePopup", () => {
  it("renders the admin-configured maintenance message verbatim", () => {
    render(<MaintenancePopup open onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(ACTIVE_MESSAGE)).toBeInTheDocument();
  });

  it("formats the endAt ISO timestamp into the vi-VN locale layout", () => {
    render(<MaintenancePopup open onClose={vi.fn()} />);

    // Recompute the expectation with the SAME Intl call the component uses. This keeps the
    // assertion deterministic regardless of the machine timezone (12:00Z renders differently
    // in UTC vs UTC+7), while still proving the component used vi-VN + medium/short styles.
    const expectedEnd = new Date(ACTIVE_END_AT).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(`Dự kiến hoàn tất: ${expectedEnd}`);
    // Sanity: it must NOT leak the raw ISO string (i.e. formatting actually happened).
    expect(dialog).not.toHaveTextContent("2026-06-15T12:00:00");
    // And it must surface the year so an empty/locale-stripped render can't pass silently.
    expect(dialog).toHaveTextContent("2026");
  });

  it("invokes onClose when the primary 'Đã hiểu' button is clicked", () => {
    const onClose = vi.fn();
    render(<MaintenancePopup open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Đã hiểu" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onClose via the corner dismiss (X) control", () => {
    const onClose = vi.fn();
    render(<MaintenancePopup open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo bảo trì" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    render(<MaintenancePopup open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(ACTIVE_MESSAGE)).not.toBeInTheDocument();
  });

  it("falls back to a default message when the admin left status.message empty", () => {
    useMaintenanceMock.mockReturnValue({
      ...activeMaintenanceState,
      status: { ...activeMaintenanceState.status, message: "" },
    });

    render(<MaintenancePopup open onClose={vi.fn()} />);

    expect(screen.getByText(/SkillSprint đang được nâng cấp/i)).toBeInTheDocument();
  });
});
