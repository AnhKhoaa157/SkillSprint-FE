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
      <div className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-200/60 p-1.5 text-slate-500 w-fit">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
            activeTab === "announcements"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:bg-slate-200/80 hover:text-slate-800"
          }`}
        >
          <Megaphone size={16} className={`mr-2 ${activeTab === "announcements" ? "text-orange-500" : "text-slate-400"}`} />
          Thông báo chung
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
            activeTab === "maintenance"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:bg-slate-200/80 hover:text-slate-800"
          }`}
        >
          <ServerCog size={16} className={`mr-2 ${activeTab === "maintenance" ? "text-red-500" : "text-slate-400"}`} />
          Bảo trì hệ thống
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
