import { requestJson } from "../core/apiClient";

// ── Request DTOs ────────────────────────────────────────────────────────────────

export interface QuizAnswerRequest {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitQuizRequest {
  answers: QuizAnswerRequest[];
}

// ── Response DTOs ───────────────────────────────────────────────────────────────

export interface QuizOptionResponse {
  optionId: string;
  text: string;
  // Present ONLY for ADMIN_DEFAULT users (backend omits it for everyone else to
  // prevent answer scraping). Powers the admin "auto-fill correct answers" tool.
  correct?: boolean | null;
}

export interface QuizQuestionResponse {
  questionId: string;
  type: string;
  question: string;
  sequenceNo: number;
  options: QuizOptionResponse[];
}

export interface QuizResponse {
  quizId: string;
  stepId: string;
  title: string;
  passingScore: number;
  questionCount: number;
  status: string;
  latestAttempt: unknown | null;
  description?: string | null;
  durationSeconds?: number | null;
  questions: QuizQuestionResponse[];
}

export interface QuizQuestionResult {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
  explanation: string | null;
}

export interface QuizAttemptResponse {
  attemptId: string;
  quizId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  canCompleteStep: boolean;
  feedback: string | null;
  submittedAt: string;
  results: QuizQuestionResult[];
}

// ── Service functions ───────────────────────────────────────────────────────────

/**
 * GET /api/roadmap-steps/{stepId}/quiz/current
 * Returns null when no quiz exists yet for this step (404).
 */
async function getCurrent(stepId: string): Promise<QuizResponse | null> {
  const res = await requestJson<QuizResponse>(
    `/api/roadmap-steps/${stepId}/quiz/current`,
    { method: "GET" },
  );
  return res.data ?? null;
}

/**
 * POST /api/roadmap-steps/{stepId}/quiz/generate
 * AI-generates a fresh quiz for the given roadmap step.
 */
async function generate(stepId: string): Promise<QuizResponse> {
  const res = await requestJson<QuizResponse>(
    `/api/roadmap-steps/${stepId}/quiz/generate`,
    { method: "POST" },
  );
  if (!res.data) throw new Error(res.message || "Failed to generate quiz");
  return res.data;
}

/**
 * POST /api/quizzes/{quizId}/submit
 * Submits all answers and returns a scored attempt.
 */
async function submit(
  quizId: string,
  request: SubmitQuizRequest,
): Promise<QuizAttemptResponse> {
  const res = await requestJson<QuizAttemptResponse>(
    `/api/quizzes/${quizId}/submit`,
    { method: "POST", body: JSON.stringify(request) },
  );
  if (!res.data) throw new Error(res.message || "Submission failed");
  return res.data;
}

/**
 * GET /api/quizzes/{quizId}/attempts/latest
 * Returns null when no attempt has been made yet (404).
 */
async function getLatestAttempt(quizId: string): Promise<QuizAttemptResponse | null> {
  const res = await requestJson<QuizAttemptResponse>(
    `/api/quizzes/${quizId}/attempts/latest`,
    { method: "GET" },
  );
  return res.data ?? null;
}

const quizService = { getCurrent, generate, submit, getLatestAttempt };
export default quizService;
