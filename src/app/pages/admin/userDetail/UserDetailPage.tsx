import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { PlanBadgeStyles } from "../../../../components/admin/PlanTypeBadge";
import { useAdminUserDetail } from "./useUserDetail";
import { STATUS_OPTIONS, ROLE_OPTIONS, PLAN_TYPE_OPTIONS } from "./config";
import {
  containerVariants,
  itemVariants,
  LoadingScreen,
  ErrorScreen,
  NotFoundScreen,
  InvalidIdScreen,
  UserBanner,
  SubscriptionCard,
  ControlPanel,
  SystemLogTimeline,
} from "./components";
import { PointAuditSection } from "./PointAuditSection";
import { CoinWalletAuditSection } from "./CoinWalletAuditSection";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, plans, viewState, loadError, form, dirty, setField, save, savingKey } = useAdminUserDetail(id);

  function renderContent() {
    switch (viewState) {
      case "invalid":
        return <InvalidIdScreen />;
      case "loading":
        return <LoadingScreen />;
      case "error":
        return <ErrorScreen message={loadError || "Không thể tải thông tin người dùng"} />;
      case "empty":
        return <NotFoundScreen />;
      case "ready":
        return (
          <div className="space-y-6">
            <UserBanner user={user!} id={id!} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <SubscriptionCard sub={user!.currentSubscription} plans={plans} />
              <ControlPanel
                form={form}
                dirty={dirty}
                savingKey={savingKey}
                setField={setField}
                save={save}
                statusOptions={STATUS_OPTIONS}
                roleOptions={ROLE_OPTIONS}
                planOptions={PLAN_TYPE_OPTIONS}
              />
            </div>

            <PointAuditSection
              userId={id!}
              userName={user!.fullName || user!.email || id!}
              initialBanned={Boolean(
                (user! as { isBannedFromLeaderboard?: boolean; bannedFromLeaderboard?: boolean }).isBannedFromLeaderboard ??
                  (user! as { isBannedFromLeaderboard?: boolean; bannedFromLeaderboard?: boolean }).bannedFromLeaderboard,
              )}
            />

            <CoinWalletAuditSection userId={id!} />

            <SystemLogTimeline user={user!} />
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif" }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </motion.button>
        </motion.div>

        {renderContent()}
      </motion.div>

      {/* Badge keyframes + Tailwind safelist (single source: components/admin/PlanTypeBadge). */}
      <PlanBadgeStyles />
    </div>
  );
}
