import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Flame, Zap, Info, ChevronUp, ChevronDown, Minus } from "lucide-react";

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week");

  const currentUser = {
    rank: 4,
    name: "Nguyễn Văn A",
    subject: "Cấu trúc dữ liệu & Giải thuật",
    streak: 12,
    xp: 2450,
    avatar: "A",
    trend: "up"
  };

  const leaderboardData = [
    { id: 1, name: "Trần Bình", subject: "Chuyên sâu React Native", streak: 45, xp: 5200, avatar: "T", trend: "same" },
    { id: 2, name: "Lê Thị C", subject: "UI/UX nâng cao", streak: 32, xp: 4800, avatar: "L", trend: "up" },
    { id: 3, name: "Phạm D", subject: "Thiết kế hệ thống", streak: 28, xp: 3900, avatar: "P", trend: "down" },
    { id: 4, name: "Nguyễn Văn A", subject: "Cấu trúc dữ liệu & Giải thuật", streak: 12, xp: 2450, avatar: "A", trend: "up", isUser: true },
    { id: 5, name: "Hoàng E", subject: "Nền tảng AWS Cloud", streak: 10, xp: 2100, avatar: "H", trend: "same" },
    { id: 6, name: "Đặng F", subject: "Fullstack Next.js", streak: 8, xp: 1950, avatar: "Đ", trend: "down" },
    { id: 7, name: "Bùi G", subject: "Python cho Khoa học dữ liệu", streak: 5, xp: 1500, avatar: "B", trend: "up" },
    { id: 8, name: "Vũ H", subject: "Nhập môn Học máy", streak: 4, xp: 1200, avatar: "V", trend: "same" },
    { id: 9, name: "Ngô I", subject: "An toàn thông tin 101", streak: 3, xp: 950, avatar: "N", trend: "down" },
    { id: 10, name: "Đỗ K", subject: "Phát triển game với Unity", streak: 2, xp: 800, avatar: "Đ", trend: "same" },
  ];

  const timeframeLabels = {
    week: "Tuần này",
    month: "Tháng này",
    all: "Toàn thời gian",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 text-center sm:text-left">
        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shadow-inner">
            <Trophy size={24} className="fill-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bảng xếp hạng</h1>
            <p className="text-gray-500 text-sm mt-1">Thi đua cùng bạn bè và duy trì chuỗi học của bạn.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex bg-gray-100 p-1 rounded-xl mx-auto sm:mx-0">
          {(["week", "month", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                timeframe === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {timeframeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* User Highlight Card */}
      <div className="bg-[#FF6B00] rounded-2xl shadow-lg shadow-[#FF6B00]/20 p-1 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-xl border border-amber-200">
            #{currentUser.rank}
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm shrink-0">
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{currentUser.name} (Bạn)</h3>
            <p className="text-gray-500 text-xs truncate">{currentUser.subject}</p>
          </div>
          <div className="flex gap-4 sm:gap-6 items-center shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-0.5">
                <Flame size={16} className="fill-orange-500" />
                <span className="font-bold text-lg leading-none">{currentUser.streak}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ngày</p>
            </div>
            <div className="text-center border-l border-gray-100 pl-4 sm:pl-6">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-0.5">
                <Zap size={16} className="fill-blue-500" />
                <span className="font-bold text-lg leading-none">{currentUser.xp}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="grid grid-cols-[40px_1fr_60px_60px] sm:grid-cols-[60px_1fr_80px_80px] gap-4 p-4 border-b border-gray-50 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="text-center">Hạng</div>
          <div>Học viên</div>
          <div className="text-center">Chuỗi</div>
          <div className="text-center">Điểm</div>
        </div>
        <div className="divide-y divide-gray-50">
          {leaderboardData.map((user, idx) => (
            <div 
              key={user.id} 
              className={`grid grid-cols-[40px_1fr_60px_60px] sm:grid-cols-[60px_1fr_80px_80px] gap-4 p-4 items-center transition-colors hover:bg-gray-50/80 ${user.isUser ? 'bg-orange-50/30' : ''}`}
            >
              {/* Rank */}
              <div className="flex flex-col items-center justify-center gap-1">
                <span className={`font-bold text-sm ${idx < 3 ? 'text-amber-500' : 'text-gray-500'}`}>
                  #{idx + 1}
                </span>
                {user.trend === 'up' ? <ChevronUp size={14} className="text-green-500" /> : 
                 user.trend === 'down' ? <ChevronDown size={14} className="text-red-500" /> : 
                 <Minus size={14} className="text-gray-300" />}
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                  idx === 0 ? 'bg-amber-400 ring-2 ring-amber-100' :
                  idx === 1 ? 'bg-gray-400 ring-2 ring-gray-100' :
                  idx === 2 ? 'bg-orange-400 ring-2 ring-orange-100' :
                  user.isUser ? 'bg-[#FF6B00]' : 'bg-blue-900/80'
                }`}>
                  {user.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-2">
                    {user.name} {user.isUser && <span className="bg-[#FF6B00] text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Bạn</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5 hidden sm:block">{user.subject}</p>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center justify-center gap-1 text-orange-500 font-semibold">
                <Flame size={14} className="fill-orange-500" />
                <span className="text-sm">{user.streak}</span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-center gap-1 text-blue-500 font-semibold">
                <Zap size={14} className="fill-blue-500" />
                <span className="text-sm">{user.xp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
          <Info size={18} />
        </div>
        <p className="text-green-800 text-sm font-medium">
          <strong className="font-bold">Mẹo:</strong> Hoàn thành ít nhất 1 phiên học hoặc 1 bài quiz mỗi ngày để giữ chuỗi và nhận hệ số nhân 2x XP.
        </p>
      </div>
    </motion.div>
  );
}