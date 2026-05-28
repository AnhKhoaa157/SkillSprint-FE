import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Clock3, Sparkles } from "lucide-react";

const TOTAL_SECONDS = 8 * 60;

type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
};

const DEFAULT_QUIZ: Question[] = [
  {
    id: 1,
    question: "Trong mảng C/C++, phần tử đầu tiên có chỉ số là bao nhiêu?",
    options: ["1", "0", "-1", "2"],
    correctAnswer: "0",
  },
  {
    id: 2,
    question: "Với mảng có 5 phần tử, chỉ số hợp lệ cuối cùng là?",
    options: ["4", "5", "3", "6"],
    correctAnswer: "4",
  },
  {
    id: 3,
    question: "Lỗi off-by-one thường xảy ra khi nào?",
    options: [
      "Duyệt sai điều kiện biên vòng lặp",
      "Dùng biến const",
      "Khai báo mảng động",
      "Viết comment thiếu",
    ],
    correctAnswer: "Duyệt sai điều kiện biên vòng lặp",
  },
];

type QuizState = {
  subject?: string;
  lessonTitle?: string;
  lessonId?: number;
  nextLessonId?: number;
  nextLessonTitle?: string;
};

export default function QuizReviewFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as QuizState | null) ?? {};

  const subject = state.subject ?? "Cấu trúc dữ liệu";
  const lessonTitle = state.lessonTitle ?? "Nhập môn Cấu trúc dữ liệu";

  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeText = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [remainingSeconds]);

  const progressPercent = useMemo(() => Math.max(0, Math.min(100, (remainingSeconds / TOTAL_SECONDS) * 100)), [remainingSeconds]);

  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPercent / 100);

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = DEFAULT_QUIZ.reduce((acc, question) => {
    return selectedAnswers[question.id] === question.correctAnswer ? acc + 1 : acc;
  }, 0);
  const scoreOn10 = DEFAULT_QUIZ.length ? Number(((correctCount / DEFAULT_QUIZ.length) * 10).toFixed(1)) : 0;

  const handleSelectAnswer = (questionId: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (answeredCount < DEFAULT_QUIZ.length) return;
    const resultPath = location.pathname.startsWith("/app") ? "/app/quiz-review/result" : "/quiz-review/result";
    navigate(resultPath, {
      state: {
        subject,
        lessonTitle,
        lessonId: state.lessonId,
        nextLessonId: state.nextLessonId,
        nextLessonTitle: state.nextLessonTitle,
        scoreOn10,
        correctCount,
        totalQuestions: DEFAULT_QUIZ.length,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={location.pathname.startsWith("/app") ? "/app/learning/course" : "/learning/course"}
          state={{ subject, lessonId: state.lessonId }}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={14} /> Quay về bài học
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white to-[#FFF8F3]">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Quiz nhỏ: {subject}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Chương hiện tại: <span className="font-semibold text-slate-700">{lessonTitle}</span>
            </p>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                <Clock3 size={13} /> Đang làm quiz
              </div>

              <div className="relative h-24 w-24 grid place-items-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                  <circle cx="48" cy="48" r={ringRadius} className="fill-none stroke-slate-200" strokeWidth="5" />
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    className="fill-none stroke-orange-400 transition-all duration-500"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <span className="text-2xl font-black tracking-tight text-slate-900">{timeText}</span>
              </div>
            </div>

            {DEFAULT_QUIZ.map((question) => {
              const userAnswer = selectedAnswers[question.id];
              return (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-bold text-slate-900 mb-3">Câu {question.id}: {question.question}</p>

                  <button
                    type="button"
                    className="mb-3 inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-bold text-orange-600"
                    disabled
                  >
                    <Sparkles size={13} /> Gợi ý AI theo bài học
                  </button>

                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = userAnswer === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelectAnswer(question.id, option)}
                          className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                            isSelected
                                  ? "border-orange-300 bg-orange-50 text-orange-700"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-orange-500" : "border-slate-400"}`}
                              aria-hidden="true"
                            >
                              <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-orange-500" : "bg-transparent"}`} />
                            </span>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={answeredCount < DEFAULT_QUIZ.length}
                className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(255,107,0,0.25)] hover:bg-orange-400 hover:shadow-[0_10px_24px_rgba(255,107,0,0.35)] transition-all disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {`Nộp quiz (${answeredCount}/${DEFAULT_QUIZ.length})`}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
