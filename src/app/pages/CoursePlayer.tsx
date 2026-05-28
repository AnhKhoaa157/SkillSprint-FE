import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
  Sparkles,
  MessagesSquare,
  Send,
  BookOpen,
  FileCode2,
  StickyNote,
  Link2,
  CirclePlay,
  ChevronDown,
  Layers3,
} from "lucide-react";

type CourseState = {
  title?: string;
  channel?: string;
  duration?: string;
  subject?: string;
  lessonId?: number;
  lessonIndex?: number;
};

type SubjectLesson = {
  id: number;
  title: string;
  duration: string;
  checklist: string[];
};

type ChatMessage = {
  role: "ai" | "user";
  text: string;
  time: string;
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
  const navigate = useNavigate();
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
    if (typeof state.lessonIndex === "number" && state.lessonIndex >= 0) return Math.min(state.lessonIndex, flattenedLessons.length - 1);
    if (!state.lessonId) return 0;
    const idx = flattenedLessons.findIndex(lesson => lesson.id === state.lessonId);
    return idx >= 0 ? idx : 0;
  }, [flattenedLessons, state.lessonId, state.lessonIndex]);

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
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "resources">("overview");
  const [coachInput, setCoachInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>([
    { role: "ai" as const, text: `Hi! I'm your AI Study Coach. Ask me anything about ${title} and I'll keep the explanation tied to this lesson.`, time: "Vừa xong" },
  ]);

  const nextLessonIndex = currentGlobalIndex >= 0 ? currentGlobalIndex + 1 : -1;
  const nextLessonAvailable = nextLessonIndex >= 0 && nextLessonIndex < flattenedLessons.length;
  const nextLessonTitle = nextLessonAvailable ? flattenedLessons[nextLessonIndex].title : "Bài tiếp theo";
  const nextLessonLabel = `Lesson ${Math.min(currentLessonIndex + 1, totalLessons)} of ${totalLessons}`;

  useEffect(() => {
    setCoachMessages([
      { role: "ai", text: `Hi! I'm your AI Study Coach. Ask me anything about ${title} and I'll keep the explanation tied to this lesson.`, time: "Vừa xong" },
    ]);
    setCoachInput("");
    setTyping(false);
  }, [title]);

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

  const sendCoachMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCoachMessages(prev => [...prev, { role: "user", text: trimmed, time: "Vừa xong" }]);
    setCoachInput("");
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setCoachMessages(prev => [...prev, {
        role: "ai",
        text: `Great question! For ${title}, focus first on the lesson pattern, then apply it on one small example. If you want, I can break it into 3 steps with a mini quiz.`,
        time: "Vừa xong",
      }]);
    }, 850);
  };

  const canOpenLesson = (idx: number) => idx <= unlockedIndex;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link to="/app/learning" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors">
                <ChevronLeft size={14} /> Trung tâm học tập
              </Link>
              <span>/</span>
              <span className="truncate">{subject}</span>
              <span>/</span>
              <span className="truncate font-semibold text-orange-600">{title}</span>
            </div>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{title}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {nextLessonLabel}
            </div>
            <button
              type="button"
              onClick={() => nextLessonAvailable && setCurrentLessonIndex(i => Math.min(flattenedLessons.length - 1, i + 1))}
              disabled={!nextLessonAvailable}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CirclePlay size={15} /> Next Lesson
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-6 xl:px-8">
        <aside className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black tracking-tight">Course Outline</h2>
                <p className="mt-1 text-xs text-slate-500">Progress</p>
              </div>
              <div className="text-sm font-bold text-orange-600">{doneLessons}/{totalLessons} lessons</div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(completionPercent, 6)}%` }} />
            </div>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-auto px-3 py-4">
            {subjectSyllabus.map((section) => (
              <div key={section.section} className="mb-4">
                <button className="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <span>{section.section}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <div className="space-y-2">
                  {section.lessons.map((lesson) => {
                    const globalIdx = flattenedLessons.findIndex(item => item.id === lesson.id);
                    const isActive = flattenedLessons[currentLessonIndex]?.id === lesson.id;
                    const done = completedLessonIds.has(lesson.id);
                    const unlocked = canOpenLesson(globalIdx);

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => unlocked && setCurrentLessonIndex(globalIdx)}
                        disabled={!unlocked}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed ${isActive ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className={`truncate text-sm font-semibold ${isActive ? "text-orange-600" : "text-slate-800"}`}>{lesson.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{lesson.duration} · {section.section}</p>
                        </div>
                        {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : unlocked ? <PlayCircle size={16} className="text-slate-400" /> : <Lock size={16} className="text-slate-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
            <div className="relative overflow-hidden rounded-[22px] bg-[#111827] shadow-[0_20px_45px_rgba(15,23,42,0.20)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.15),rgba(15,23,42,0.72))]" />
              <div className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500 align-middle" />
                {sectionBadge(currentLesson?.title ?? title)}
              </div>

              <div className="relative flex min-h-[520px] items-center justify-center px-4 py-8 sm:min-h-[560px]">
                <div className="absolute inset-x-8 top-10 rounded-3xl border border-white/10 bg-white/5 p-4 text-left font-mono text-[13px] leading-8 text-fuchsia-300/90 backdrop-blur-sm sm:inset-x-16 sm:top-14 sm:p-6">
                  <div>const Counter = () =&gt; &#123;</div>
                  <div className="pl-6">const [count, setCount] = useState(0);</div>
                  <div className="pl-6">return (</div>
                  <div className="pl-12">&lt;button onClick=&#123;() =&gt; setCount(count + 1)&#125;&gt;</div>
                  <div className="pl-12">Count: &#123;count&#125;</div>
                  <div className="pl-12">&lt;/button&gt;</div>
                  <div className="pl-6">);</div>
                  <div>&#125;;</div>
                </div>

                <button
                  type="button"
                  aria-label="Phát video bài học"
                  className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_0_0_10px_rgba(255,107,0,0.18),0_16px_30px_rgba(255,107,0,0.32)] transition-transform hover:scale-105"
                >
                  <PlayCircle size={34} fill="currentColor" />
                </button>

                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="h-1.5 rounded-full bg-white/20">
                    <div className="h-full w-[34%] rounded-full bg-orange-500" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/90">
                    <div className="flex items-center gap-2">
                      <button className="rounded-md bg-white/10 px-2 py-1 backdrop-blur">▶</button>
                      <button className="rounded-md bg-white/10 px-2 py-1 backdrop-blur">||</button>
                      <span>{duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>0.75x</span>
                      <span className="rounded-md bg-white/10 px-2 py-1 backdrop-blur">⛶</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {subject}
                </span>
                <span className="inline-flex items-center gap-1 text-xs"><Clock3 size={14} /> {duration}</span>
                <span className="inline-flex items-center gap-1 text-xs"><Star size={14} className="text-amber-500" /> 4.8</span>
                <span className="text-xs text-slate-500">Giảng viên: {channel}</span>
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Xem video ở giữa màn hình, dùng checklist ở dưới để hoàn thành bài học, và hỏi AI Study Coach ở panel bên phải nếu cần giải thích thêm.
              </p>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                {[
                  { id: "overview", label: "Overview", icon: BookOpen },
                  { id: "notes", label: "Notes", icon: StickyNote },
                  { id: "resources", label: "Resources", icon: Link2 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as "overview" | "notes" | "resources")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-orange-50 text-orange-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold">Props & State in React</h3>
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                        Phần này được thiết kế ngắn gọn để đi từ khái niệm đến thực hành: xem video, làm checklist, rồi mở quiz để nhớ lâu hơn.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: Clock3, label: `${duration} duration` },
                        { icon: Sparkles, label: "100 XP reward" },
                        { icon: MessagesSquare, label: "AI coach enabled" },
                      ].map((item) => (
                        <div key={item.label} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                          <item.icon size={14} className="text-orange-600" /> {item.label}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Checklist hoàn thành</p>
                          <p className="mt-1 text-xs text-slate-500">Hoàn thành hết checklist để mở khóa bài tiếp theo.</p>
                        </div>
                        <button
                          type="button"
                          onClick={completeCurrentLesson}
                          disabled={!isCurrentChecklistDone || hasCurrentLessonCompleted}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {hasCurrentLessonCompleted ? "Đã hoàn thành" : "Hoàn thành bài học"}
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {currentLesson?.checklist.map((task, idx) => {
                          const checked = currentChecklist[idx] ?? false;
                          return (
                            <button
                              key={task}
                              type="button"
                              onClick={() => toggleChecklistItem(idx)}
                              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                            >
                              <CheckCircle2 size={14} className={checked ? "text-emerald-600" : "text-slate-400"} />
                              {task}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <FileCode2 size={15} className="text-orange-600" /> Notes
                    </div>
                    <textarea
                      className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-orange-300"
                      placeholder="Ghi chú của bạn cho bài học này..."
                      defaultValue={`- Props: dữ liệu truyền vào từ parent\n- State: dữ liệu nội bộ của component\n- Khi state đổi thì component re-render\n- Tránh nhầm props với state trong bài tập thực tế`}
                    />
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Layers3 size={15} className="text-orange-600" /> Resources
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { title: "Lesson summary", desc: "Tóm tắt nhanh nội dung" },
                        { title: "Practice file", desc: "Bài tập mini để tự làm" },
                        { title: "Quiz deck", desc: "Bộ câu hỏi ôn tập" },
                      ].map(item => (
                        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="font-bold text-slate-800">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Video tiếp theo cần học</h3>
              <div className="mt-3 space-y-2">
                {upcomingLessons.map((lesson) => {
                  const lessonIdx = flattenedLessons.findIndex(item => item.id === lesson.id);
                  const unlocked = canOpenLesson(lessonIdx);
                  return (
                    <div key={lesson.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{lesson.title}</p>
                        <p className="text-xs text-slate-500">{lesson.duration}</p>
                      </div>
                      <span className={`text-xs font-semibold ${unlocked ? "text-emerald-600" : "text-slate-500"}`}>{unlocked ? "Đã mở" : "Đang khóa"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black">AI Study Coach</h3>
              <p className="truncate text-xs text-emerald-600">Online · Lesson context loaded</p>
            </div>
          </div>

          <div className="flex max-h-[calc(100vh-220px)] flex-col p-4">
            <div className="flex-1 space-y-3 overflow-auto pr-1">
              {coachMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "border-orange-200 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">Typing...</div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="grid gap-2 sm:grid-cols-1">
                {[
                  "Explain re-rendering in React",
                  "When should I use props vs state?",
                  "Give me a code example",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendCoachMessage(chip)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  value={coachInput}
                  onChange={e => setCoachInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") sendCoachMessage(coachInput);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ask about this lesson..."
                />
                <button
                  type="button"
                  onClick={() => sendCoachMessage(coachInput)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function sectionBadge(title: string) {
  if (title.toLowerCase().includes("props") || title.toLowerCase().includes("state")) return "3. Props & State";
  if (title.toLowerCase().includes("mảng")) return "2. Arrays & Indexing";
  return "Lesson player";
}
