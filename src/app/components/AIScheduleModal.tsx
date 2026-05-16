import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, ChevronRight, ChevronLeft, Calendar, Clock,
  Target, BookOpen, Check, AlertCircle, Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════ */
const F = "'Inter','Plus Jakarta Sans',sans-serif";
const PAGE = "#F8FAFC";
const CARD = "#FFFFFF";
const CARD2 = "#F1F5F9";
const BORDER = "#E5E7EB";
const OG = "#FF6B00";
const OG2 = "#FF8C3A";
const BLUE = "#2563EB";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const GR = "#10B981";
const RD = "#EF4444";

type ScheduleStep =
  | "dateRange"
  | "availableDays"
  | "timeSlots"
  | "duration"
  | "goal"
  | "preview"
  | "confirm";

interface ScheduleConfig {
  dateRange: { start: string; end: string } | null;
  availableDays: string[];
  timeSlots: { start: string; end: string }[];
  duration: number | null;
  goal: "current-step" | "full-roadmap" | null;
}

interface AIScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ScheduleConfig) => void;
  subjectTitle?: string;
  currentPhase?: number;
}

const DAYS_OF_WEEK = [
  { id: "mon", label: "Thứ 2", shortLabel: "T2" },
  { id: "tue", label: "Thứ 3", shortLabel: "T3" },
  { id: "wed", label: "Thứ 4", shortLabel: "T4" },
  { id: "thu", label: "Thứ 5", shortLabel: "T5" },
  { id: "fri", label: "Thứ 6", shortLabel: "T6" },
  { id: "sat", label: "Thứ 7", shortLabel: "T7" },
  { id: "sun", label: "Chủ nhật", shortLabel: "CN" },
];

const TIME_SLOTS_OPTIONS = [
  { id: "6-8", label: "Sáng sớm (6:00 - 8:00)", value: "6-8" },
  { id: "8-10", label: "Sáng (8:00 - 10:00)", value: "8-10" },
  { id: "10-12", label: "Trước trưa (10:00 - 12:00)", value: "10-12" },
  { id: "12-2", label: "Chiều (12:00 - 14:00)", value: "12-2" },
  { id: "2-4", label: "Chiều (14:00 - 16:00)", value: "2-4" },
  { id: "4-6", label: "Chiều tối (16:00 - 18:00)", value: "4-6" },
  { id: "6-8pm", label: "Tối (18:00 - 20:00)", value: "6-8pm" },
  { id: "8-10pm", label: "Tối muộn (20:00 - 22:00)", value: "8-10pm" },
];

const DURATION_OPTIONS = [
  { id: 15, label: "15 phút" },
  { id: 30, label: "30 phút" },
  { id: 45, label: "45 phút" },
  { id: 60, label: "1 giờ" },
  { id: 90, label: "1.5 giờ" },
  { id: 120, label: "2 giờ" },
];

function AIScheduleModalComponent({
  isOpen,
  onClose,
  onConfirm,
  subjectTitle = "Mảng và đánh chỉ số",
  currentPhase = 3,
}: AIScheduleModalProps) {
  // Helper function to parse YYYY-MM-DD string to Date object safely
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper function to format Date object to Vietnamese format
  const formatDateVN = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
    });
  };

  const [step, setStep] = useState<ScheduleStep>("dateRange");
  const [config, setConfig] = useState<ScheduleConfig>({
    dateRange: null,
    availableDays: [],
    timeSlots: [],
    duration: null,
    goal: null,
  });

  const [tempDateStart, setTempDateStart] = useState(() => {
    const today = new Date(2026, 4, 6); // May 6, 2026 (current date)
    return today.toISOString().split('T')[0];
  });
  
  const [tempDateEnd, setTempDateEnd] = useState(() => {
    const today = new Date(2026, 4, 6);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30); // 30 days from today
    return endDate.toISOString().split('T')[0];
  });

  /* ── Generated preview schedule ── */
  const previewSchedule = useMemo(() => {
    if (!config.dateRange || config.availableDays.length === 0 || !config.duration || !config.goal) {
      return [];
    }

    const schedule = [];
    
    const startDate = parseDate(config.dateRange.start);
    const endDate = parseDate(config.dateRange.end);
    let current = new Date(startDate);

    const dayMap: Record<string, number> = {
      "sun": 0, "mon": 1, "tue": 2, "wed": 3,
      "thu": 4, "fri": 5, "sat": 6,
    };

    while (current <= endDate) {
      const dayId = Object.keys(dayMap).find(
        k => dayMap[k] === current.getDay()
      ) || "mon";

      if (config.availableDays.includes(dayId) && config.timeSlots.length > 0) {
        const slot: { start: string; end: string } = config.timeSlots[schedule.length % config.timeSlots.length];
        schedule.push({
          date: new Date(current),
          day: dayId,
          timeSlot: slot,
          duration: config.duration,
          topic: schedule.length === 0
            ? `${subjectTitle} - Phần nhập môn`
            : schedule.length === Math.floor(schedule.length / 3) * 3
            ? `${subjectTitle} - Thực hành`
            : `${subjectTitle} - Tiếp tục`,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return schedule;
  }, [config, subjectTitle]);

  const isStepValid = (): boolean => {
    switch (step) {
      case "dateRange":
        return !!tempDateStart && !!tempDateEnd;
      case "availableDays":
        return config.availableDays.length > 0;
      case "timeSlots":
        return config.timeSlots.length > 0;
      case "duration":
        return !!config.duration;
      case "goal":
        return !!config.goal;
      case "preview":
        return previewSchedule.length > 0;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const steps: ScheduleStep[] = [
      "dateRange", "availableDays", "timeSlots", "duration", "goal", "preview", "confirm"
    ];
    const currentIndex = steps.indexOf(step);
    
    // Validate current step
    let isValid = false;
    if (step === "dateRange") {
      isValid = !!tempDateStart && !!tempDateEnd;
      if (isValid) {
        setConfig(prev => ({
          ...prev,
          dateRange: { start: tempDateStart, end: tempDateEnd }
        }));
      }
    } else {
      isValid = isStepValid();
    }
    
    if (currentIndex < steps.length - 1 && isValid) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const steps: ScheduleStep[] = [
      "dateRange", "availableDays", "timeSlots", "duration", "goal", "preview", "confirm"
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: F,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: CARD,
          borderRadius: 20,
          width: "90%",
          maxWidth: 680,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 28px",
          borderBottom: `1px solid ${BORDER}`,
          position: "sticky",
          top: 0,
          background: CARD,
          zIndex: 10,
        }}>
          <div>
            <h2 style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: T1,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <Sparkles size={24} color={OG} />
              AI soạn lịch học
            </h2>
            <p style={{
              fontSize: "0.82rem",
              color: T2,
              marginTop: 6,
              margin: 0,
            }}>
              Để AI lên lịch học tối ưu cho bạn
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color={T2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 28px", minHeight: 300 }}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Date Range */}
            {step === "dateRange" && (
              <motion.div
                key="dateRange"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    📅 Chọn khoảng ngày muốn học
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Xác định ngày bắt đầu và ngày kết thúc lịch học của bạn
                  </p>

                  <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 6,
                      }}>
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={tempDateStart}
                        onChange={e => setTempDateStart(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${BORDER}`,
                          fontSize: "0.85rem",
                          color: T1,
                          fontFamily: F,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 6,
                      }}>
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={tempDateEnd}
                        onChange={e => setTempDateEnd(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${BORDER}`,
                          fontSize: "0.85rem",
                          color: T1,
                          fontFamily: F,
                        }}
                      />
                    </div>
                  </div>

                  {tempDateStart && tempDateEnd && (
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.10)",
                      border: `1px solid rgba(16,185,129,0.22)`,
                      fontSize: "0.82rem",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <Check size={16} />
                      <span>
                        Khoảng {Math.ceil((parseDate(tempDateEnd).getTime() - parseDate(tempDateStart).getTime()) / (1000 * 60 * 60 * 24))} ngày
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Available Days */}
            {step === "availableDays" && (
              <motion.div
                key="availableDays"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    🗓️ Chọn ngày rảnh trong tuần
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Bạn có thể học vào những ngày nào?
                  </p>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                    gap: 10,
                  }}>
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = config.availableDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              availableDays: isSelected
                                ? prev.availableDays.filter(d => d !== day.id)
                                : [...prev.availableDays, day.id],
                            }));
                          }}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: isSelected ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                            background: isSelected
                              ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))`
                              : CARD2,
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: isSelected ? OG : T1,
                            transition: "all 0.15s",
                          }}
                        >
                          {day.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  {config.availableDays.length > 0 && (
                    <div style={{
                      marginTop: 16,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.10)",
                      border: `1px solid rgba(16,185,129,0.22)`,
                      fontSize: "0.82rem",
                      color: "#059669",
                    }}>
                      Bạn chọn {config.availableDays.length} ngày rảnh
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Time Slots */}
            {step === "timeSlots" && (
              <motion.div
                key="timeSlots"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    🕐 Chọn khung giờ rảnh
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Bạn có thể học vào những giờ nào? (Chọn 1-3 khung giờ ưu tiên)
                  </p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}>
                    {TIME_SLOTS_OPTIONS.map(slot => {
                      const isSelected = config.timeSlots.some(s => s.start === slot.value.split("-")[0]);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setConfig(prev => {
                              const isAlreadySelected = prev.timeSlots.some(
                                s => s.start === slot.value.split("-")[0]
                              );
                              return {
                                ...prev,
                                timeSlots: isAlreadySelected
                                  ? prev.timeSlots.filter(
                                      s => s.start !== slot.value.split("-")[0]
                                    )
                                  : [
                                      ...prev.timeSlots,
                                      {
                                        start: slot.value.split("-")[0],
                                        end: slot.value.split("-")[1],
                                      },
                                    ],
                              };
                            });
                          }}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: isSelected ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                            background: isSelected
                              ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))`
                              : CARD2,
                            cursor: "pointer",
                            fontSize: "0.84rem",
                            fontWeight: 500,
                            color: isSelected ? OG : T1,
                            textAlign: "left",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          {isSelected && <Check size={16} color={OG} />}
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>

                  {config.timeSlots.length > 0 && (
                    <div style={{
                      marginTop: 16,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.10)",
                      border: `1px solid rgba(16,185,129,0.22)`,
                      fontSize: "0.82rem",
                      color: "#059669",
                    }}>
                      Bạn chọn {config.timeSlots.length} khung giờ
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Duration */}
            {step === "duration" && (
              <motion.div
                key="duration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    ⏱️ Mỗi buổi học bao lâu?
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Bạn muốn mỗi buổi học dài bao lâu?
                  </p>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: 10,
                  }}>
                    {DURATION_OPTIONS.map(dur => {
                      const isSelected = config.duration === dur.id;
                      return (
                        <button
                          key={dur.id}
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              duration: isSelected ? null : dur.id,
                            }));
                          }}
                          style={{
                            padding: "14px 12px",
                            borderRadius: 12,
                            border: isSelected ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                            background: isSelected
                              ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))`
                              : CARD2,
                            cursor: "pointer",
                            fontSize: "0.84rem",
                            fontWeight: 600,
                            color: isSelected ? OG : T1,
                            textAlign: "center",
                            transition: "all 0.15s",
                          }}
                        >
                          {dur.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Goal */}
            {step === "goal" && (
              <motion.div
                key="goal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    🎯 Mục tiêu học tập?
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Bạn muốn lên lịch cho cái gì?
                  </p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}>
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          goal: config.goal === "current-step" ? null : "current-step",
                        }));
                      }}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: config.goal === "current-step" ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                        background: config.goal === "current-step"
                          ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))`
                          : CARD2,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          border: config.goal === "current-step" ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                          background: config.goal === "current-step" ? OG : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {config.goal === "current-step" && <Check size={14} color="#fff" />}
                        </div>
                        <div>
                          <p style={{
                            margin: 0,
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            color: T1,
                          }}>
                            📖 Học phần hiện tại
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: "0.78rem",
                            color: T2,
                            marginTop: 4,
                          }}>
                            Tập trung vào phần {currentPhase}: {subjectTitle}
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          goal: config.goal === "full-roadmap" ? null : "full-roadmap",
                        }));
                      }}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: config.goal === "full-roadmap" ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                        background: config.goal === "full-roadmap"
                          ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))`
                          : CARD2,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          border: config.goal === "full-roadmap" ? "2px solid " + OG : `1.5px solid ${BORDER}`,
                          background: config.goal === "full-roadmap" ? OG : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {config.goal === "full-roadmap" && <Check size={14} color="#fff" />}
                        </div>
                        <div>
                          <p style={{
                            margin: 0,
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            color: T1,
                          }}>
                            🗺️ Toàn bộ roadmap
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: "0.78rem",
                            color: T2,
                            marginTop: 4,
                          }}>
                            Lên lịch cho tất cả các phần từ phần 1 đến hết
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Preview */}
            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: T1,
                    marginBottom: 12,
                  }}>
                    👁️ AI đề xuất lịch học
                  </label>
                  <p style={{
                    fontSize: "0.82rem",
                    color: T2,
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    Đây là lịch học được tối ưu hóa dựa trên các tiêu chí của bạn
                  </p>

                  <div style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    {previewSchedule.slice(0, 8).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 12,
                          background: CARD2,
                          border: `1px solid ${BORDER}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div style={{
                          fontSize: "1.2rem",
                          minWidth: 40,
                        }}>
                          📚
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: T1,
                            marginBottom: 4,
                          }}>
                            {item.date.toLocaleDateString("vi-VN", {
                              weekday: "short",
                              day: "numeric",
                              month: "numeric",
                            })}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: "0.78rem",
                            color: T2,
                          }}>
                            {item.topic}
                          </p>
                        </div>
                        <div style={{
                          textAlign: "right",
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: OG,
                          }}>
                            {item.timeSlot.start}:00
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: "0.74rem",
                            color: T3,
                          }}>
                            {item.duration} phút
                          </p>
                        </div>
                      </div>
                    ))}
                    {previewSchedule.length > 8 && (
                      <div style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "0.82rem",
                        color: T3,
                      }}>
                        + {previewSchedule.length - 8} buổi học khác
                      </div>
                    )}
                  </div>

                  <div style={{
                    marginTop: 20,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: `linear-gradient(135deg, rgba(37,99,235,0.10), rgba(37,99,235,0.05))`,
                    border: `1px solid rgba(37,99,235,0.22)`,
                    fontSize: "0.82rem",
                    color: "#1E40AF",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}>
                    <span>💡</span>
                    <span>Tổng cộng <strong>{previewSchedule.length} buổi học</strong> trong {Math.ceil((config.dateRange?.end ? (parseDate(config.dateRange.end).getTime() - parseDate(config.dateRange.start).getTime()) / (1000 * 60 * 60 * 24) : 0))} ngày</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 7: Confirm */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
              >
                <div>
                  <div style={{
                    padding: "20px",
                    borderRadius: 14,
                    background: `linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.05))`,
                    border: `1.5px solid rgba(16,185,129,0.22)`,
                    textAlign: "center",
                    marginBottom: 20,
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#059669",
                      marginBottom: 10,
                    }}>
                      ✨ Lịch học đã sẵn sàng!
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "#047857",
                      lineHeight: 1.6,
                    }}>
                      AI đã lên lịch {previewSchedule.length} buổi học cho bạn.
                      <br />
                      Nhấn "Lưu vào calendar" để bắt đầu học tập!
                    </p>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    <div style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: CARD2,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}>
                        📅 Khoảng thời gian
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: T1,
                      }}>
                        {config.dateRange && (
                          `${formatDateVN(parseDate(config.dateRange.start))} - ${formatDateVN(parseDate(config.dateRange.end))}`
                        )}
                      </p>
                    </div>

                    <div style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: CARD2,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}>
                        🗓️ Ngày học
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: T1,
                      }}>
                        {config.availableDays.map(d => {
                          const day = DAYS_OF_WEEK.find(day => day.id === d);
                          return day?.label;
                        }).join(", ")}
                      </p>
                    </div>

                    <div style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: CARD2,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}>
                        ⏱️ Thời lượng mỗi buổi
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: T1,
                      }}>
                        {config.duration} phút
                      </p>
                    </div>

                    <div style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: CARD2,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: T3,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}>
                        🎯 Mục tiêu
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: T1,
                      }}>
                        {config.goal === "current-step" ? "Học phần hiện tại" : "Toàn bộ roadmap"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer / Buttons */}
        <div style={{
          display: "flex",
          gap: 12,
          padding: "20px 28px",
          borderTop: `1px solid ${BORDER}`,
          background: CARD,
          position: "sticky",
          bottom: 0,
        }}>
          <button
            onClick={handlePrev}
            disabled={step === "dateRange"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 10,
              border: `1.5px solid ${BORDER}`,
              background: CARD,
              cursor: step === "dateRange" ? "not-allowed" : "pointer",
              color: T2,
              fontWeight: 600,
              fontSize: "0.82rem",
              opacity: step === "dateRange" ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={14} />
            Quay lại
          </button>

          <div style={{ flex: 1 }} />

          {step !== "confirm" && (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: isStepValid()
                  ? `linear-gradient(135deg, ${OG}, ${OG2})`
                  : `rgba(0,0,0,0.08)`,
                cursor: isStepValid() ? "pointer" : "not-allowed",
                color: isStepValid() ? "#fff" : T3,
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              Tiếp tục
              <ChevronRight size={14} />
            </button>
          )}

          {step === "confirm" && (
            <button
              onClick={handleConfirm}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${GR}, #34D399)`,
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              <Check size={14} />
              Lưu vào calendar
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AIScheduleModalComponent;
export { AIScheduleModalComponent as AIScheduleModal };
