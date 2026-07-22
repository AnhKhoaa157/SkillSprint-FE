import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, beforeEach, expect, it } from "vitest";
import Workspaces from "./Workspaces";
import workspaceService from "../../../api/utilities/workspaceService";

const navigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../../api/utilities/workspaceService", () => ({
  default: {
    createWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    getMyWorkspaces: vi.fn(),
    updateWorkspace: vi.fn(),
  },
}));

vi.mock("../../components/workspace/WorkspaceCard", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe("Workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspaceService.getMyWorkspaces).mockResolvedValue([]);
  });

  it("opens the full workspace creation form", async () => {
    const user = userEvent.setup();

    render(<Workspaces />);

    await user.click(await screen.findByRole("button", { name: "Tạo workspace" }));
    await user.click(screen.getByRole("button", { name: "Đi tới form đầy đủ" }));

    expect(navigate).toHaveBeenCalledWith("/app/workspaces/new");
  });
});
