import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import {
  addAdminCommunityBlacklistKeyword,
  deleteAdminCommunityBlacklistKeyword,
  getAdminCommunityBlacklist,
  getAdminCommunityComments,
  getAdminCommunityPosts,
  getAdminCommunityReports,
  updateAdminCommunityCommentStatus,
  updateAdminCommunityPostStatus,
  updateAdminCommunityReportStatus,
} from "./adminCommunityService";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("adminCommunityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches moderation posts with status, search, and pagination", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { items: [], page: 1, size: 20, totalItems: 0, totalPages: 0, first: true, last: true } });

    await getAdminCommunityPosts({ status: "PENDING_MODERATION", search: "react", page: 1, size: 20 });

    expect(requestJson).toHaveBeenCalledWith("/api/admin/community/moderation/posts?page=1&size=20&status=PENDING_MODERATION&search=react");
  });

  it("fetches moderation comments", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, first: true, last: true } });

    await getAdminCommunityComments({ status: "HIDDEN" });

    expect(requestJson).toHaveBeenCalledWith("/api/admin/community/moderation/comments?page=0&size=10&status=HIDDEN");
  });

  it("fetches reports with target type and status", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, first: true, last: true } });

    await getAdminCommunityReports({ targetType: "MESSAGE", status: "PENDING" });

    expect(requestJson).toHaveBeenCalledWith("/api/admin/community/reports?page=0&size=10&targetType=MESSAGE&status=PENDING");
  });

  it("updates post, comment, and report status", async () => {
    vi.mocked(requestJson)
      .mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { postId: "p1" } })
      .mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { commentId: "c1" } })
      .mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: { reportId: "r1" } });

    await updateAdminCommunityPostStatus("p1", { status: "APPROVED", adminNote: "ok" });
    await updateAdminCommunityCommentStatus("c1", { status: "VISIBLE" });
    await updateAdminCommunityReportStatus("r1", { status: "REVIEWED" });

    expect(requestJson).toHaveBeenNthCalledWith(1, "/api/admin/community/posts/p1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED", adminNote: "ok" }),
    });
    expect(requestJson).toHaveBeenNthCalledWith(2, "/api/admin/community/comments/c1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "VISIBLE" }),
    });
    expect(requestJson).toHaveBeenNthCalledWith(3, "/api/admin/community/reports/r1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "REVIEWED" }),
    });
  });

  it("manages blacklist keywords", async () => {
    vi.mocked(requestJson)
      .mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: [] })
      .mockResolvedValueOnce({ success: true, code: 201, message: "ok", data: { wordId: 1, keyword: "spam" } })
      .mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: null });

    await getAdminCommunityBlacklist();
    await addAdminCommunityBlacklistKeyword({ keyword: "spam" });
    await deleteAdminCommunityBlacklistKeyword(1);

    expect(requestJson).toHaveBeenNthCalledWith(1, "/api/admin/community/blacklist");
    expect(requestJson).toHaveBeenNthCalledWith(2, "/api/admin/community/blacklist", {
      method: "POST",
      body: JSON.stringify({ keyword: "spam" }),
    });
    expect(requestJson).toHaveBeenNthCalledWith(3, "/api/admin/community/blacklist/1", { method: "DELETE" });
  });
});
