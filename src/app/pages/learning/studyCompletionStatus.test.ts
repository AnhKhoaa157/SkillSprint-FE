import { describe, expect, it } from "vitest";
import { isCompletedTaskStatus } from "./studyCompletionStatus";

describe("isCompletedTaskStatus", () => {
  it.each(["COMPLETED", "completed", "DONE", " done "])("recognizes %s as completed", (status) => {
    expect(isCompletedTaskStatus(status)).toBe(true);
  });

  it.each(["TODO", "IN_PROGRESS", null, undefined])("does not treat %s as completed", (status) => {
    expect(isCompletedTaskStatus(status)).toBe(false);
  });
});
