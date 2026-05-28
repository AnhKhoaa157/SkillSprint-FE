import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  PlayCircle,
  Star,
} from "lucide-react";

type CourseState = {
  title?: string;
  channel?: string;
  duration?: string;
  subject?: string;
  lessonId?: number;
};

type SubjectLesson = {
  id: number;
  title: string;
  duration: string;
  checklist: string[];
};

type SubjectSyllabus = {
  section: string;
  lessons: SubjectLesson[];
};

const COURSES_BY_SUBJECT: Record<string, SubjectSyllabus[]> = {
  "Cấu trúc dữ liệu": [
    {
      section: "Tuần 1: Nền tảng",
      lessons: [
        {
          id: 1,
          title: "Nhập môn Cấu trúc dữ liệu",
          duration: "08:12",
          checklist: ["Nắm khái niệm ADT", "Phân biệt mảng và danh sách liên kết", "Làm 2 câu trắc nghiệm nhanh"],
        },
        {
          id: 2,
          title: "Mảng và đánh chỉ số từ 0",
          duration: "14:22",
          checklist: ["Hiểu quy tắc index", "Tránh lỗi off-by-one", "Giải bài tập truy cập phần tử"],
        },
        {
          id: 3,
          title: "Danh sách liên kết: Lý thuyết và thực hành",
          duration: "21:05",
          checklist: ["Nắm cấu trúc node", "Mô phỏng thao tác insert/delete", "Giải thích ưu nhược điểm so với mảng"],
        },
      ],
    },
    {
      section: "Tuần 2: Trọng tâm",
      lessons: [
        {
          id: 4,
          title: "Ngăn xếp và hàng đợi",
          duration: "18:44",
          checklist: ["Phân biệt LIFO/FIFO", "Xây dựng thao tác push/pop", "Ứng dụng vào bài toán thực tế"],
        },
        {
          id: 5,
          title: "Bảng băm chuyên sâu",
          duration: "26:38",
          checklist: ["Hiểu hash function", "Mô tả collision handling", "Đánh giá độ phức tạp"],
        },
      ],
    },
  ],
  "Hệ điều hành": [
    {
      section: "Tuần 1: Tổng quan",
      lessons: [
        {
          id: 1,
          title: "Kiến trúc hệ điều hành",
          duration: "11:40",
          checklist: ["Phân biệt user mode/kernel mode", "Nắm vai trò scheduler", "Tóm tắt cấu trúc bộ nhớ"],
        },
        {
          id: 2,
          title: "Tiến trình và luồng",
          duration: "16:05",
          checklist: ["So sánh process/thread", "Mô tả context switch", "Giải bài tập đồng bộ"],
        },
      ],
    },
  ],
};

export default function CoursePlayer() {
  const location = useLocation();
  const state = (location.state as CourseState | null) ?? {};
  const subject = state.subject ?? "Cấu trúc dữ liệu";
  const subjectSyllabus = COURSES_BY_SUBJECT[subject] ?? COURSES_BY_SUBJECT["Cấu trúc dữ liệu"];
  const flattenedLessons = useMemo(
    () =>
      subjectSyllabus.flatMap(section =>
        section.lessons.map(lesson => ({ ...lesson, section: section.section })),
      ),
    [subjectSyllabus],
  );

  const initialLessonIndex = useMemo(() => {
    if (!state.lessonId) return 0;
    const idx = flattenedLessons.findIndex(lesson => lesson.id === state.lessonId);
    return idx >= 0 ? idx : 0;
  }, [flattenedLessons, state.lessonId]);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(initialLessonIndex);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [lessonChecklist, setLessonChecklist] = useState<Record<number, boolean[]>>({});

  const currentLesson = flattenedLessons[currentLessonIndex] ?? flattenedLessons[0];
  const title = currentLesson?.title ?? state.title ?? "Bài học hiện tại";
  const channel = state.channel ?? "SkillSprint Academy";
  const duration = currentLesson?.duration ?? state.duration ?? "12:00";

  const totalLessons = flattenedLessons.length;
  const doneLessons = completedLessonIds.size;
  const unlockedIndex = Math.min(Math.max(doneLessons, currentLessonIndex), Math.max(totalLessons - 1, 0));
  const currentChecklist =
    lessonChecklist[currentLesson?.id ?? 0] ??
    new Array(currentLesson?.checklist.length ?? 0).fill(false);
  const isCurrentChecklistDone = currentChecklist.length > 0 && currentChecklist.every(Boolean);
  const hasCurrentLessonCompleted = currentLesson ? completedLessonIds.has(currentLesson.id) : false;
  const currentGlobalIndex = flattenedLessons.findIndex(lesson => lesson.id === currentLesson?.id);
  const upcomingLessons = flattenedLessons.slice(currentGlobalIndex + 1, currentGlobalIndex + 4);
  const nextLesson = currentGlobalIndex >= 0 ? flattenedLessons[currentGlobalIndex + 1] : undefined;
  const completionPercent = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const [activeTab, setActiveTab] = useState<"overview" | "checklist" | "resources">("overview");
  const completionWidthClass =
    completionPercent >= 100 ? "w-full"
      : completionPercent >= 80 ? "w-4/5"
      : completionPercent >= 60 ? "w-3/5"
      : completionPercent >= 40 ? "w-2/5"
      : completionPercent >= 20 ? "w-1/5"
      : completionPercent > 0 ? "w-[10%]"
      : "w-0";

  const toggleChecklistItem = (idx: number) => {
    if (!currentLesson) return;
    setLessonChecklist(prev => {
      const prevLesson = prev[currentLesson.id] ?? new Array(currentLesson.checklist.length).fill(false);
      const nextLesson = [...prevLesson];
      nextLesson[idx] = !nextLesson[idx];
      return { ...prev, [currentLesson.id]: nextLesson };
    });
  };

  const completeCurrentLesson = () => {
    if (!currentLesson || !isCurrentChecklistDone) return;
    setCompletedLessonIds(prev => new Set([...prev, currentLesson.id]));
    if (currentLessonIndex < flattenedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const canOpenLesson = (idx: number) => idx <= unlockedIndex;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/app/learning" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors">
                <ChevronLeft size={14} /> Trung tâm học tập
              </Link>
              <span>/</span>
              <span className="truncate">{subject}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">{title}</h1>
          </div>
          <div className="text-xs font-semibold text-orange-700 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 shrink-0">
            Tiến độ khóa học: {doneLessons}/{totalLessons}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="aspect-video bg-[#101828] relative flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80"
                alt="Thumbnail bài học"
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20" />
              <button
                type="button"
                aria-label="Phát video bài học"
                title="Phát video bài học"
                className="relative z-10 h-16 w-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <PlayCircle size={34} fill="currentColor" />
              </button>
              <div className="absolute left-5 right-5 bottom-4 h-1.5 rounded-full bg-white/25">
                <div className="h-full w-[34%] rounded-full bg-orange-400" />
              </div>
              <div className="absolute right-5 bottom-7 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">{duration}</div>
            </div>
            <div className="p-5 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">{subject}</span>
                <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Clock3 size={14} /> {duration}</span>
                <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Star size={14} className="text-amber-500" /> 4.8</span>
                <span className="text-sm text-slate-500">Giảng viên: {channel}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{title}</h2>
              <p className="text-sm text-slate-600 mt-2">Phần này được thiết kế theo nhịp học ngắn, sau đó kiểm tra bằng quiz để đảm bảo nhớ lâu.</p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setCurrentLessonIndex(v => Math.max(0, v - 1))}
                  disabled={currentLessonIndex === 0}
                >
                  <ArrowLeft size={14} /> Bài trước
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
                  onClick={() => setCurrentLessonIndex(v => Math.min(flattenedLessons.length - 1, v + 1))}
                  disabled={currentLessonIndex >= flattenedLessons.length - 1}
                >
                  Bài tiếp theo <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 flex gap-2">
              {[
                { id: "overview", label: "Tổng quan" },
                { id: "checklist", label: "Checklist" },
                { id: "resources", label: "Tài liệu" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "overview" | "checklist" | "resources")}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${activeTab === tab.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === "overview" && (
                <div>
                  <h3 className="font-bold mb-2">Bạn sẽ học được gì</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /> Áp dụng kỹ thuật cốt lõi vào bài tập thực tế.</li>
                    <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /> Tránh lỗi phổ biến khi code trong dự án thật.</li>
                    <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /> Tự tin làm quiz theo từng chủ đề ngay sau bài học.</li>
                  </ul>
                </div>
              )}

              {activeTab === "checklist" && (
                <div>
                  <h3 className="font-bold mb-2">Checklist hoàn thành bài học</h3>
                  <div className="space-y-2 mb-4">
                    {currentLesson?.checklist.map((task, idx) => {
                      const checked = currentChecklist[idx] ?? false;
                      return (
                        <button
                          key={task}
                          type="button"
                          onClick={() => toggleChecklistItem(idx)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle2 size={14} className={checked ? "text-emerald-600" : "text-slate-400"} />
                            {task}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={completeCurrentLesson}
                    disabled={!isCurrentChecklistDone || hasCurrentLessonCompleted}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {hasCurrentLessonCompleted ? "Đã hoàn thành bài này" : "Hoàn thành và mở bài tiếp theo"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {activeTab === "resources" && (
                <div>
                  <h3 className="font-bold mb-2">Tài liệu đi kèm</h3>
                  <div className="space-y-2">
                    {[
                      "Tóm tắt công thức độ phức tạp",
                      "Checklist ôn tập trước quiz",
                      "Bộ câu hỏi luyện nhanh 15 phút",
                    ].map((item) => (
                      <div key={item} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 flex items-center gap-2">
                        <FileText size={14} className="text-orange-600" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="font-semibold mb-2">Video tiếp theo cần học</h4>
            {!isCurrentChecklistDone && !hasCurrentLessonCompleted && (
              <p className="text-xs text-slate-500 mb-3">Hoàn thành checklist hiện tại để mở khóa danh sách bài tiếp theo.</p>
            )}
            <div className="space-y-2">
              {upcomingLessons.map((lesson) => {
                const lessonIdx = flattenedLessons.findIndex(item => item.id === lesson.id);
                const unlocked = canOpenLesson(lessonIdx);
                return (
                  <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.duration}</p>
                    </div>
                    <span className={`text-xs font-semibold ${unlocked ? "text-emerald-600" : "text-slate-500"}`}>{unlocked ? "Đã mở" : "Đang khóa"}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/70 p-3">
              <p className="text-xs font-semibold text-orange-700">Quiz nhỏ theo từng chương</p>
              <p className="text-xs text-slate-600 mt-1">
                Xem xong một chương là có thể ôn tập ngay bằng quiz nhỏ để củng cố kiến thức.
              </p>
              {hasCurrentLessonCompleted ? (
                <Link
                  to="/app/quiz-review"
                  state={{
                    subject,
                    lessonTitle: currentLesson?.title ?? title,
                    lessonId: currentLesson?.id,
                    nextLessonId: nextLesson?.id,
                    nextLessonTitle: nextLesson?.title,
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Ôn tập TH
                </Link>
              ) : (
                <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-300 px-4 py-2.5 text-sm font-bold text-white">
                  Ôn tập TH
                </span>
              )}
              {!hasCurrentLessonCompleted && (
                <p className="mt-2 text-xs text-slate-500">Hoàn thành chương hiện tại để mở quiz chương này.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="h-fit xl:sticky xl:top-24 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-bold mb-3">Tiến độ khóa học</h3>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
              <div className={`h-full rounded-full bg-orange-400 ${completionWidthClass}`} />
            </div>
            <p className="text-sm text-slate-600">Bạn đã hoàn thành {doneLessons}/{totalLessons} bài ({completionPercent}%).</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold mb-3">Nội dung khóa học</h2>
            <div className="space-y-4 max-h-[65vh] overflow-auto pr-1">
              {subjectSyllabus.map((section) => (
                <div key={section.section}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{section.section}</p>
                  <div className="space-y-2">
                    {section.lessons.map((lesson) => {
                      const globalIdx = flattenedLessons.findIndex(item => item.id === lesson.id);
                      const isActive = flattenedLessons[currentLessonIndex]?.id === lesson.id;
                      const done = completedLessonIds.has(lesson.id);
                      const unlocked = canOpenLesson(globalIdx);

                      return (
                        <button
                          key={lesson.title}
                          type="button"
                          onClick={() => unlocked && setCurrentLessonIndex(globalIdx)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm flex items-center justify-between text-left disabled:opacity-70"
                          disabled={!unlocked}
                        >
                          <div className="min-w-0">
                            <p className={`truncate ${isActive ? "font-bold text-orange-600" : "font-medium text-slate-800"}`}>{lesson.title}</p>
                            <p className="text-xs text-slate-500">{lesson.duration}</p>
                            {done && <p className="text-[11px] font-semibold text-emerald-600 mt-1">Quiz nhỏ: sẵn sàng</p>}
                          </div>
                          {done ? <CheckCircle2 size={14} className="text-emerald-600" /> : unlocked ? <PlayCircle size={14} className="text-slate-400" /> : <Lock size={14} className="text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
