import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

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
}

export function PomodoroTimer({ className = "", style = {}, onModeChange }: PomodoroTimerProps) {
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const modes = [
    { id: "focus", label: "Tập trung", duration: 25 * 60 },
    { id: "shortBreak", label: "Nghỉ ngắn", duration: 5 * 60 },
    { id: "longBreak", label: "Nghỉ dài", duration: 15 * 60 },
  ];

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) {
      setIsRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (newMode: "focus" | "shortBreak" | "longBreak") => {
    setMode(newMode);
    setIsRunning(false);
    const duration = modes.find(m => m.id === newMode)?.duration || 25 * 60;
    setTimeLeft(duration);
    onModeChange?.(newMode);
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = modes.find(m => m.id === mode)?.duration || 25 * 60;
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
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id as any)}
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
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            border: "none",
            background: OG,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s",
          }}
        >
          {isRunning ? (
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
        Bắt đầu 25 phút tập trung, sau đó nghỉ ngắn
      </p>
    </div>
  );
}
