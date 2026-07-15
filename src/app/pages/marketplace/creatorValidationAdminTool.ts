export type CreatorValidationAutofillQuestion = {
  questionId: string;
  options: Array<{
    optionId: string;
    correct?: boolean | null;
  }>;
};

export function buildCreatorValidationCorrectAnswers(
  questions: CreatorValidationAutofillQuestion[],
): Record<string, string> | null {
  const answers: Record<string, string> = {};

  for (const question of questions) {
    const correctOption = question.options.find(option => option.correct === true);
    if (!correctOption) return null;
    answers[question.questionId] = correctOption.optionId;
  }

  return answers;
}
