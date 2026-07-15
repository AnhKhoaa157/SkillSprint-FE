import { describe, expect, it } from "vitest";
import { buildCreatorValidationCorrectAnswers } from "./creatorValidationAdminTool";

describe("buildCreatorValidationCorrectAnswers", () => {
  it("fills every question with its backend-flagged correct option", () => {
    expect(buildCreatorValidationCorrectAnswers([
      {
        questionId: "question-1",
        options: [
          { optionId: "option-1", correct: false },
          { optionId: "option-2", correct: true },
        ],
      },
      {
        questionId: "question-2",
        options: [{ optionId: "option-3", correct: true }],
      },
    ])).toEqual({
      "question-1": "option-2",
      "question-2": "option-3",
    });
  });

  it("does not guess an answer when the backend has not provided an answer key", () => {
    expect(buildCreatorValidationCorrectAnswers([
      {
        questionId: "question-1",
        options: [{ optionId: "option-1" }],
      },
    ])).toBeNull();
  });
});
