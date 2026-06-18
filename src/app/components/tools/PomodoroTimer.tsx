import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  pausePomodoro,
  resumePomodoro,
  nextPomodoroPhase,
} from "../../../api/learning/studySessionService";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const OG = "#FF6B00";
const WH = "#FFFFFF";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const BDR = "#E5E7EB";

interface PomodoroTimerProps {
  className?: string;
  style?: React.CSSProperties;
  onModeChange?: (mode: "focus" | "shortBreak" | "longBreak") => void;
  /** When provided, pause/resume/phase-change actions are synced to the backend. */
  sessionId?: string;
}

const MODES = [
  { id: "focus" as const, label: "Tập trung", duration: 25 * 60 },
  { id: "shortBreak" as const, label: "Nghỉ ngắn", duration: 5 * 60 },
  { id: "longBreak" as const, label: "Nghỉ dài", duration: 15 * 60 },
];

export function PomodoroTimer({ className = "", style = {}, onModeChange, sessionId }: PomodoroTimerProps) {
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Tracks completed focus sessions to determine when to take a long break (every 4 focus sessions).
  const focusCountRef = useRef(0);

  // Refs so the timer effect always sees the latest sessionId / onModeChange without needing them in deps.
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;

  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      setIsRunning(false);

      // Determine the next Pomodoro phase
      let nextMode: "focus" | "shortBreak" | "longBreak";
      if (mode === "focus") {
        focusCountRef.current += 1;
        // Every 4 completed focus sessions take a long break
        nextMode = focusCountRef.current % 4 === 0 ? "longBreak" : "shortBreak";
      } else {
        if (mode === "longBreak") focusCountRef.current = 0;
        nextMode = "focus";
      }

      const duration = MODES.find(m => m.id === nextMode)?.duration ?? 25 * 60;
      setMode(nextMode);
      setTimeLeft(duration);
      onModeChangeRef.current?.(nextMode);

      // Notify backend of phase transition (fire-and-forget; local state already updated)
      const sid = sessionIdRef.current;
      if (sid) {
        nextPomodoroPhase(sid).catch(() => {});
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (newMode: "focus" | "shortBreak" | "longBreak") => {
    setMode(newMode);
    setIsRunning(false);
    const duration = MODES.find(m => m.id === newMode)?.duration ?? 25 * 60;
    setTimeLeft(duration);
    onModeChange?.(newMode);
  };

  const handlePlayPause = async () => {
    const willRun = !isRunning;
    const sid = sessionIdRef.current;

    if (!sid) {
      // No active session — run purely locally
      setIsRunning(willRun);
      return;
    }

    setIsApiLoading(true);
    try {
      if (willRun) {
        await resumePomodoro(sid);
      } else {
        await pausePomodoro(sid);
      }
    } catch {
      // API failed — still update local state so the timer keeps working
    } finally {
      setIsApiLoading(false);
    }
    setIsRunning(willRun);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = MODES.find(m => m.id === mode)?.duration ?? 25 * 60;
    setTimeLeft(duration);
  };

  return (
    <div
      className={className}
      style={{
        background: WH,
        borderRadius: "14px",
        border: `1px solid ${BDR}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        ...style,
      }}
    >
      {/* Header */}
      <p
        style={{
          fontFamily: F,
          fontWeight: 700,
          fontSize: "0.88rem",
          color: T1,
          margin: 0,
        }}
      >
        Pomodoro Timer
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px" }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontFamily: F,
              fontSize: "0.7rem",
              fontWeight: 600,
              background: mode === m.id ? OG : "#F3F4F6",
              color: mode === m.id ? "#fff" : T2,
              transition: "all 0.18s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 0",
        }}
      >
        <p
          style={{
            fontFamily: F,
            fontWeight: 800,
            fontSize: "3rem",
            color: OG,
            margin: 0,
            lineHeight: 1,
          }}
        >
          {formatTime(timeLeft)}
        </p>
        {timeLeft === 0 && (
          <p
            style={{
              fontFamily: F,
              fontSize: "0.68rem",
              color: T2,
              marginTop: "8px",
              fontWeight: 600,
            }}
          >
            Phiên hiện tại đã kết thúc
          </p>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={handleReset}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            border: "none",
            background: `${OG}20`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s",
          }}
        >
          <RotateCcw size={16} color={OG} />
        </button>
        <button
          onClick={handlePlayPause}
          disabled={isApiLoading}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            border: "none",
            background: OG,
            cursor: isApiLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s",
            opacity: isApiLoading ? 0.7 : 1,
          }}
        >
          {isApiLoading ? (
            <Loader2 size={16} color="#fff" className="animate-spin" />
          ) : isRunning ? (
            <Pause size={16} color="#fff" fill="#fff" />
          ) : (
            <Play size={16} color="#fff" fill="#fff" style={{ marginLeft: "2px" }} />
          )}
        </button>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: F,
          fontSize: "0.7rem",
          color: T3,
          textAlign: "center",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {sessionId
          ? "Đồng bộ trạng thái với phiên học đang hoạt động"
          : "Bắt đầu 25 phút tập trung, sau đó nghỉ ngắn"}
      </p>
    </div>
  );
}
