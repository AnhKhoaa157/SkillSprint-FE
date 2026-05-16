import { Link, useLocation } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

type QuizResultState = {
  subject?: string;
  lessonTitle?: string;
  lessonId?: number;
  nextLessonId?: number;
  nextLessonTitle?: string;
  scoreOn10?: number;
  correctCount?: number;
  totalQuestions?: number;
};

export default function QuizResult() {
  const location = useLocation();
  const state = (location.state as QuizResultState | null) ?? {};

  const subject = state.subject ?? "Cấu trúc dữ liệu";
  const lessonTitle = state.lessonTitle ?? "Bài học";
  const lessonId = state.lessonId;
  const nextLessonId = state.nextLessonId;
  const nextLessonTitle = state.nextLessonTitle;
  const scoreOn10 = state.scoreOn10 ?? 0;
  const correctCount = state.correctCount ?? 0;
  const totalQuestions = state.totalQuestions ?? 0;
  const hasNextLesson = typeof nextLessonId === "number";

  const isAppPath = location.pathname.startsWith("/app");
  const coursePath = isAppPath ? "/app/learning/course" : "/learning/course";
  const quizPath = isAppPath ? "/app/quiz-review" : "/quiz-review";

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={coursePath}
          state={{ subject, lessonId }}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={14} /> Quay về bài học
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white to-[#ECFDF5]">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Kết quả ôn tập chương</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1">
              {lessonTitle}
            </h1>
            <p className="text-sm text-slate-500 mt-2">Môn học: <span className="font-semibold text-slate-700">{subject}</span></p>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">Bạn đã hoàn thành quiz</p>
              <p className="text-4xl font-black tracking-tight text-slate-900 mt-2">{scoreOn10}/10</p>
              <p className="text-sm text-slate-700 mt-2">Đúng {correctCount}/{totalQuestions} câu</p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} /> Hoàn thành ôn tập cho chương hiện tại
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Link
                to={quizPath}
                state={{ subject, lessonTitle, lessonId, nextLessonId, nextLessonTitle }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={15} /> Làm lại quiz
              </Link>

              <Link
                to={coursePath}
                state={{ subject, lessonId }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={15} /> Quay về bài học
              </Link>

              {hasNextLesson ? (
                <Link
                  to={coursePath}
                  state={{ subject, lessonId: nextLessonId }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
                >
                  Sang phần tiếp theo <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-300 px-4 py-3 text-sm font-bold text-white"
                >
                  Đã là chương cuối
                </button>
              )}
            </div>

            {hasNextLesson && (
              <p className="text-xs text-slate-500">
                Gợi ý tiếp theo: <span className="font-semibold text-slate-700">{nextLessonTitle}</span>
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
