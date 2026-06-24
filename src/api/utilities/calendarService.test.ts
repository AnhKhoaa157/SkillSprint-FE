import { describe, it, expect, vi, beforeEach } from "vitest";
import calendarService from "./calendarService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("calendarService", () => {
  const mockWorkspaceId = "test-workspace-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCalendarSchedule", () => {
    it("should generate a calendar schedule successfully", async () => {
      const mockResponse = {
        data: {
          runId: "run-1",
          workspaceId: mockWorkspaceId,
          status: "SUCCESS",
        },
      };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse as any);

      const requestBody = {
        preferredDays: ["MONDAY", "WEDNESDAY"] as any,
      };

      const result = await calendarService.generateCalendarSchedule(mockWorkspaceId, requestBody);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/calendar/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            startDate: null,
            endDate: null,
            preferredDays: ["MONDAY", "WEDNESDAY"],
            dailyStartTime: null,
            sessionMinutes: null,
            sessionsPerDay: null,
            includeReviewSessions: null,
          }),
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if generate schedule fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ message: "Generate failed" } as any);

      await expect(
        calendarService.generateCalendarSchedule(mockWorkspaceId, { preferredDays: [] })
      ).rejects.toThrow("Generate failed");
    });

    it("surfaces the backend capacity-insufficient message unchanged", async () => {
      // On a 400, apiClient throws an Error carrying the backend envelope message verbatim.
      // The capacity message must reach the caller and must NOT be the old study-days message.
      const capacityMessage =
        "Số ngày học và khung giờ bạn chọn chưa đủ để xếp hết lộ trình trong thời hạn. " +
        "Vui lòng chọn thêm ngày học, thêm khung giờ, tăng số giờ học mỗi tuần hoặc kéo dài thời hạn hoàn thành";
      const error: any = new Error(capacityMessage);
      error.status = 400;
      vi.mocked(requestJson).mockRejectedValueOnce(error);

      const thrown = await calendarService
        .generateCalendarSchedule(mockWorkspaceId, { preferredDays: ["THURSDAY"] as any })
        .then(() => null, (e: any) => e);

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown.message).toBe(capacityMessage);
      expect(thrown.message).not.toBe("Cần chọn ít nhất một ngày học trong tuần");
    });
  });

  describe("getCalendarTasks", () => {
    it("should fetch calendar tasks", async () => {
      const mockTasks = [{ taskId: "t1", title: "Task 1" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockTasks } as any);

      const result = await calendarService.getCalendarTasks(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/calendar/tasks`,
        { method: "GET" }
      );
      expect(result).toEqual(mockTasks);
    });

    it("should return an empty array if data is missing", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      const result = await calendarService.getCalendarTasks(mockWorkspaceId);

      expect(result).toEqual([]);
    });
  });

  describe("updateCalendarTask", () => {
    it("should update a task", async () => {
      const mockTask = { taskId: "t1", title: "Task 1" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockTask } as any);

      const body = { startTime: "09:00" };
      const result = await calendarService.updateCalendarTask("t1", body);

      expect(requestJson).toHaveBeenCalledWith(`/api/calendar/tasks/t1`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      expect(result).toEqual(mockTask);
    });

    it("should throw an error if data is missing", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(calendarService.updateCalendarTask("t1", {})).rejects.toThrow("Failed to update calendar task");
    });
  });

  describe("completeCalendarTask", () => {
    it("should mark a task as complete", async () => {
      const mockTask = { taskId: "t1", title: "Task 1" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockTask } as any);

      const result = await calendarService.completeCalendarTask("t1");

      expect(requestJson).toHaveBeenCalledWith(`/api/calendar/tasks/t1/complete`, {
        method: "PATCH",
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe("getEisenhowerTasks", () => {
    it("should fetch and normalize eisenhower tasks", async () => {
      const mockApiData = {
        data: {
          quadrants: [
            { quadrant: "DO_NOW", tasks: [{ taskId: "t1" }] },
            { quadrant: "SCHEDULE", tasks: [] },
          ]
        }
      };
      vi.mocked(requestJson).mockResolvedValueOnce(mockApiData as any);

      const result = await calendarService.getEisenhowerTasks(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/eisenhower-tasks`,
        { method: "GET" }
      );
      expect(result.DO_NOW).toHaveLength(1);
      expect(result.SCHEDULE).toEqual([]);
      expect(result.DELAY_OR_DELEGATE).toEqual([]);
      expect(result.ELIMINATE).toEqual([]);
    });

    it("should fetch tasks with specific date", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ data: { quadrants: [] } } as any);
      const date = "2024-01-01";
      await calendarService.getEisenhowerTasks(mockWorkspaceId, date);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/calendar/eisenhower?date=${date}`,
        { method: "GET" }
      );
    });
  });

  describe("createCalendarTask", () => {
    it("should create a new task", async () => {
      const mockTask = { taskId: "t1", title: "New Task" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockTask } as any);

      const body = { title: "New Task" };
      const result = await calendarService.createCalendarTask(mockWorkspaceId, body);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/calendar/tasks`,
        { method: "POST", body: JSON.stringify(body) }
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe("updateCalendarTaskStatus", () => {
    it("should update task status", async () => {
      const mockTask = { taskId: "t1", status: "DONE" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockTask } as any);

      const body = { status: "DONE" };
      const result = await calendarService.updateCalendarTaskStatus(mockWorkspaceId, "t1", body);

      expect(requestJson).toHaveBeenCalledWith(
        `/api/workspaces/${mockWorkspaceId}/calendar/tasks/t1/status`,
        { method: "PATCH", body: JSON.stringify(body) }
      );
      expect(result).toEqual(mockTask);
    });
  });
});
