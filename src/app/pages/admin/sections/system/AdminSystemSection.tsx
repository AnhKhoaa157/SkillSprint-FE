import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Megaphone, ServerCog } from "lucide-react";
import AdminAnnouncementsSection from "../announcements/AdminAnnouncementsSection";
import AdminSystemStatus from "../../../../../components/admin/AdminSystemStatus";

export default function AdminSystemSection() {
  const [activeTab, setActiveTab] = useState<"announcements" | "maintenance">("announcements");

  return (
    <div className="flex flex-col gap-5">
      {/* Custom Tabs List */}
      <div className="relative inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 p-1.5 text-slate-500 w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2 text-sm font-bold transition-colors duration-200 ${
            activeTab === "announcements" ? "text-slate-900" : "hover:text-slate-800"
          }`}
        >
          {activeTab === "announcements" && (
            <motion.div
              layoutId="system-tab-bg"
              className="absolute inset-0 rounded-lg bg-white shadow-sm border border-slate-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Megaphone size={16} className={`relative z-10 mr-2 transition-colors ${activeTab === "announcements" ? "text-[#FF6B00]" : "text-slate-400"}`} />
          <span className="relative z-10">Thông báo chung</span>
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2 text-sm font-bold transition-colors duration-200 ${
            activeTab === "maintenance" ? "text-slate-900" : "hover:text-slate-800"
          }`}
        >
          {activeTab === "maintenance" && (
            <motion.div
              layoutId="system-tab-bg"
              className="absolute inset-0 rounded-lg bg-white shadow-sm border border-slate-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <ServerCog size={16} className={`relative z-10 mr-2 transition-colors ${activeTab === "maintenance" ? "text-red-500" : "text-slate-400"}`} />
          <span className="relative z-10">Bảo trì hệ thống</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "announcements" ? (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminAnnouncementsSection />
            </motion.div>
          ) : (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminSystemStatus />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
