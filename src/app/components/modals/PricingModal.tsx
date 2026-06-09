import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { X, Check, ShieldCheck, ChevronRight, Zap, CreditCard, Smartphone, Star, Loader2, AlertCircle, Copy, ExternalLink, RefreshCw, ArrowDown, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createSepayPayment, getPaymentDetail } from "../../../api/sepayPaymentService";
import type { SepayPaymentCreateResponse, SepayPaymentDetailResponse } from "../../../api/skillSprintModels";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const OG = "#FF6B00";

/* ─── Plan type ─── */
export type PlanId = "FREE" | "SKILL_BUILDER" | "PREMIUM";

interface PlanConfig {
  name: string;
  price: number;
  priceDisplay: string;
  tier: number;
  description: string;
  features: PlanFeature[];
}

interface PlanFeature {
  text: string;
  highlight?: boolean;
  dim?: boolean;
  extra?: boolean;
}

const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    name: "Starter",
    price: 0,
    priceDisplay: "0đ",
    tier: 0,
    description: "Công cụ cơ bản để tổ chức việc học.",
    features: [
      { text: "Quản lý công việc học tập" },
      { text: "Lộ trình mẫu" },
      { text: "Lộ trình AI cá nhân hóa", dim: true },
    ],
  },
  SKILL_BUILDER: {
    name: "Skill Builder",
    price: 89000,
    priceDisplay: "89k",
    tier: 1,
    description: "Mở khóa lộ trình AI cá nhân hóa.",
    features: [
      { text: "Lộ trình AI cá nhân hóa", highlight: true },
      { text: "Phát hiện lỗ hổng kỹ năng", highlight: true },
      { text: "Gợi ý tài nguyên học bằng AI", highlight: true },
    ],
  },
  PREMIUM: {
    name: "Career Premium",
    price: 199000,
    priceDisplay: "199k",
    tier: 2,
    description: "Bộ công cụ tăng tốc học tập với Gia sư AI và Quiz nhỏ theo chương.",
    features: [
      { text: "Bao gồm toàn bộ gói Skill Builder, cộng thêm:", extra: true },
      { text: "Gia sư AI 24/7 cá nhân hóa", highlight: true, extra: true },
      { text: "AI tự động tìm tài nguyên", highlight: true },
      { text: "Quiz nhỏ và thống kê tiến độ", highlight: true },
      { text: "Ưu tiên xử lý AI không giới hạn", highlight: true },
    ],
  },
};

/* ─── Button config helper (INDEX-BASED COMPARISON) ─── */
const planOrder: PlanId[] = ["FREE", "SKILL_BUILDER", "PREMIUM"];

type ButtonAction = "current" | "downgrade" | "upgrade";

interface ButtonConfig {
  text: string;
  disabled: boolean;
  variant: "ghost" | "outline" | "primary" | "primary-outline";
  action: ButtonAction;
}

function getButtonConfig(cardPlan: PlanId, currentPlan: PlanId): ButtonConfig {
  const cardIndex = planOrder.indexOf(cardPlan);
  const currentIndex = planOrder.indexOf(currentPlan);

  // Same plan → current
  if (cardIndex === currentIndex) {
    return { text: "Gói hiện tại", disabled: true, variant: "ghost", action: "current" };
  }
  // Lower tier → downgrade
  if (cardIndex < currentIndex) {
    return {
      text: `Hạ cấp xuống ${PLANS[cardPlan].name}`,
      disabled: false,
      variant: "primary-outline",
      action: "downgrade",
    };
  }
  // Higher tier → upgrade
  return {
    text: `Nâng cấp ${PLANS[cardPlan].name}`,
    disabled: false,
    variant: "primary",
    action: "upgrade",
  };
}

/* ─── Reusable dark feature row for Pricing Step ─── */
function DarkFeature({ text, color = "rgba(255,255,255,0.75)", check = "default", dim = false }: {
  text: string; color?: string; check?: "default" | "orange" | "dim"; dim?: boolean;
}) {
  const iconColor = check === "orange" ? OG : check === "dim" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)";
  return (
    <li style={{
      display: "flex", alignItems: "flex-start", gap: "9px",
      opacity: dim ? 0.38 : 1,
    }}>
      {check === "dim"
        ? <X size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0, marginTop: "2px" }} />
        : <Check size={13} color={iconColor} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: "2px" }} />
      }
      <span style={{ fontSize: "0.84rem", color, lineHeight: 1.5 }}>{text}</span>
    </li>
  );
}

/* ─── Helpers ─── */
function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function mapPlanType(selectedPlan: "builder" | "premium"): string {
  return selectedPlan === "premium" ? "PREMIUM" : "SKILL_BUILDER";
}

function planIdToPaymentType(plan: PlanId): "builder" | "premium" | null {
  if (plan === "SKILL_BUILDER") return "builder";
  if (plan === "PREMIUM") return "premium";
  return null;
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (plan: "builder" | "premium") => void;
  initialPlan?: "builder" | "premium";
  currentPlan: string; // Đổi thành string để nhận linh hoạt data từ Backend/Context
}

/* ─── Component ─── */
export function PricingModal({ isOpen, onClose, onSuccess, initialPlan = "premium", currentPlan: rawCurrentPlan }: PricingModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"pricing" | "checkout" | "success" | "error">("pricing");
  const [selectedPlan, setSelectedPlan] = useState<"builder" | "premium">("premium");
  const [successCountdown, setSuccessCountdown] = useState(3);

  // ── ĐÃ FIX CHÍ MẠNG: CHUẨN HÓA STATE ĐẦU VÀO TRÁNH LỖI UNDEFINED TIER ──
  const getNormalizedPlan = (planStr: string): PlanId => {
    if (!planStr) return "FREE";
    const upper = planStr.toUpperCase();
    if (upper === "BUILDER" || upper === "SKILL_BUILDER") return "SKILL_BUILDER";
    if (upper === "PREMIUM" || upper === "CAREER_PREMIUM") return "PREMIUM";
    return "FREE";
  };

  const currentPlan = getNormalizedPlan(rawCurrentPlan);
  console.log("[PricingModal] Received currentPlan prop:", rawCurrentPlan, "→ Normalized:", currentPlan);

  /* Sepay payment state */
  const [paymentData, setPaymentData] = useState<SepayPaymentCreateResponse | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<SepayPaymentDetailResponse | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [pollStatusText, setPollStatusText] = useState<string>("");
  const [pollError, setPollError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [errorStep, setErrorStep] = useState<string | null>(null);

  /* State quản lý Toast Thông báo góc phải */
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptRef = useRef(0);
  const paymentIdRef = useRef<string | null>(null);

  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("pricing");
      setSelectedPlan(initialPlan);
      setPaymentData(null);
      setPaymentDetail(null);
      setCreatingPayment(false);
      setCreateError(null);
      setPollingActive(false);
      setPollStatusText("");
      setPollError(null);
      setCopied(false);
      setQrLoaded(false);
      setErrorStep(null);
      setToast({ show: false, message: "" });
      pollAttemptRef.current = 0;
      paymentIdRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [isOpen, initialPlan]);

  /* Auto-redirect to workspaces when payment succeeds */
  useEffect(() => {
    if (step !== "success") return;
    setSuccessCountdown(3);
    const interval = setInterval(() => {
      setSuccessCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/app/workspaces", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, navigate]);

  const stopPolling = useCallback(() => {
    setPollingActive(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const doPollingCheck = useCallback(async () => {
    const pid = paymentIdRef.current;
    if (!pid) return;

    try {
      const detail = await getPaymentDetail(pid);
      setPaymentDetail(detail);

      if (detail?.status === "SUCCESS" || detail?.status === "COMPLETED" || detail?.status === "PAID" || detail?.status?.toUpperCase() === "PAID") {
        stopPolling();
        setStep("success");
        onSuccess?.(selectedPlan);
        return;
      }

      if (detail.status === "FAILED" || detail.status === "EXPIRED" || detail.status === "CANCELED") {
        stopPolling();
        setPollError(`Payment ${detail.status.toLowerCase()}. Please try again.`);
        setErrorStep("payment_failed");
        setStep("error");
        return;
      }

      pollAttemptRef.current += 1;
      setPollStatusText(`Checking payment status... (${pollAttemptRef.current})`);

      if (pollAttemptRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPollError("Payment verification timed out. Please contact support.");
        setErrorStep("timeout");
        setStep("error");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to check payment status";
      setPollError(message);
      setPollStatusText(`Connection issue, retrying... (${pollAttemptRef.current})`);
    }
  }, [stopPolling, onSuccess, selectedPlan]);

  const startPolling = useCallback((paymentId: string) => {
    paymentIdRef.current = paymentId;
    pollAttemptRef.current = 0;
    setPollingActive(true);
    setPollStatusText("Waiting for payment confirmation...");
    doPollingCheck();
    pollingRef.current = setInterval(doPollingCheck, POLL_INTERVAL_MS);
  }, [doPollingCheck]);

  const handleCreatePayment = async (plan: "builder" | "premium") => {
    if (creatingPayment) return;

    setSelectedPlan(plan);
    setCreatingPayment(true);
    setCreateError(null);
    setErrorStep(null);

    try {
      const planType = mapPlanType(plan);
      const result = await createSepayPayment({ planType });

      setPaymentData(result);
      setStep("checkout");
      startPolling(result.paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create payment. Please try again.";
      setCreateError(message);
      setErrorStep("create_failed");
      setStep("error");
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleManualVerify = async () => {
    setPollStatusText("Đang kiểm tra thủ công...");
    try {
      const pid = paymentIdRef.current;
      if (!pid) return;

      const detail = await getPaymentDetail(pid);
      setPaymentDetail(detail);

      if (detail?.status === "SUCCESS" || detail?.status === "COMPLETED" || detail?.status === "PAID" || detail?.status?.toUpperCase() === "PAID") {
        stopPolling();
        setStep("success");
        onSuccess?.(selectedPlan);
      } else {
        showToast("Hệ thống chưa nhận được khoản tiền này, ông vui lòng đợi vài giây hoặc kiểm tra lại nội dung chuyển khoản nhé!");
      }
    } catch (error) {
      showToast("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setPollStatusText(`Waiting for payment confirmation... (${pollAttemptRef.current})`);
    }
  };

  const handleRetry = () => {
    setStep("pricing");
    setCreateError(null);
    setPollError(null);
    setErrorStep(null);
    setPaymentData(null);
    setPaymentDetail(null);
    stopPolling();
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast("Đã sao chép mã Memo thành công! 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      showToast("Đã sao chép mã Memo thành công! 📋");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCardAction = (plan: PlanId) => {
    const config = getButtonConfig(plan, currentPlan);

    if (config.action === "current") {
      return;
    }

    if (config.action === "downgrade") {
      onClose();
      return;
    }

    if (config.action === "upgrade") {
      const paymentType = planIdToPaymentType(plan);
      if (paymentType) {
        handleCreatePayment(paymentType);
      }
    }
  };

  const renderCardButton = (plan: PlanId) => {
    const config = getButtonConfig(plan, currentPlan);
    const isLoading = creatingPayment && planIdToPaymentType(plan) === selectedPlan;

    switch (config.variant) {
      case "ghost":
        return (
          <button
            disabled
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.35)", fontFamily: F, fontWeight: 600,
              fontSize: "0.875rem", cursor: "not-allowed", marginTop: "24px",
              opacity: 0.5,
            }}>
            {config.text}
          </button>
        );

      case "primary":
        return (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleCardAction(plan)}
            disabled={isLoading}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: OG, border: "none",
              color: "#FFFFFF", fontFamily: F, fontWeight: 700,
              fontSize: "0.875rem", cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "24px", opacity: isLoading ? 0.6 : 1,
              boxShadow: `0 4px 16px ${OG}61`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
            {isLoading ? "Đang xử lý..." : config.text}
          </motion.button>
        );

      case "primary-outline":
        return (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleCardAction(plan)}
            disabled={isLoading}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              background: "transparent",
              border: `1.5px solid ${OG}`,
              color: OG, fontFamily: F, fontWeight: 700,
              fontSize: "0.875rem", cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "24px", opacity: isLoading ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : config.action === "downgrade" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            {isLoading ? "Đang xử lý..." : config.text}
          </motion.button>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const resetAndClose = () => {
    stopPolling();
    setStep("pricing");
    setPaymentData(null);
    setPaymentDetail(null);
    setCreateError(null);
    setPollError(null);
    onClose();
  };

  const closeButtonColor = step === "checkout" ? "#4A5568" : "rgba(255,255,255,0.6)";
  const planCards: PlanId[] = ["FREE", "SKILL_BUILDER", "PREMIUM"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={resetAndClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
          overflowY: "auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: step === "pricing" ? "860px" : step === "checkout" ? "960px" : "560px",
            background: step === "checkout" ? "#F7F9FC" : "#111115",
            borderRadius: "24px",
            border: step === "checkout" ? "1px solid #E2E8F0" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
            overflow: "hidden",
            position: "relative",
            fontFamily: F,
            transition: "background 0.3s ease, max-width 0.3s ease",
          }}
        >
          {/* Close Button */}
          <button onClick={resetAndClose}
            style={{
              position: "absolute", top: "16px", right: "16px",
              width: "32px", height: "32px", borderRadius: "50%",
              background: step === "checkout" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
              border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: closeButtonColor, zIndex: 20,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = step === "checkout" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.14)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = step === "checkout" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)"; }}
          >
            <X size={16} />
          </button>

          {/* ══ PRICING STEP ══ */}
          {step === "pricing" && (
            <>
              {/* Header */}
              <div style={{ textAlign: "center", padding: "36px 24px 20px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "5px 14px", borderRadius: "99px",
                  background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.35)",
                  marginBottom: "18px",
                }}>
                  <Zap size={11} color={OG} fill={OG} />
                  <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 800, letterSpacing: "0.1em" }}>
                    GÓI SKILLSPRINT
                  </span>
                </div>
                <h2 style={{
                  fontWeight: 900, fontSize: "clamp(1.5rem,3vw,2rem)",
                  color: "#FFFFFF", letterSpacing: "-0.04em",
                  marginBottom: "8px", lineHeight: 1.1,
                }}>
                  Nâng cấp hành trình sự nghiệp
                </h2>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.45)" }}>
                  Chọn gói phù hợp với mục tiêu học tập của bạn.
                </p>
              </div>

              {/* ══ BANNER ĐỘNG HIỂN THỊ ĐÚNG THEO TÀI KHOẢN ══ */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 24px", margin: "0 24px 20px",
                background: "rgba(255,107,0,0.06)",
                border: "1px solid rgba(255,107,0,0.25)",
                borderRadius: "12px",
              }}>
                <div>
                  <p style={{
                    fontSize: "0.7rem", color: "rgba(255,255,255,0.4)",
                    fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    marginBottom: "2px",
                  }}>
                    GÓI HIỆN TẠI
                  </p>
                  <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.3 }}>
                    {PLANS[currentPlan]?.name || "Starter"}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>
                    {currentPlan === "FREE" ? "Miễn phí" : `${formatVnd(PLANS[currentPlan]?.price || 0)} / tháng`}
                  </p>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "4px 14px", borderRadius: "99px",
                  background: "rgba(255,107,0,0.15)",
                  border: "1px solid rgba(255,107,0,0.35)",
                }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: OG, display: "inline-block",
                  }} />
                  <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 700, letterSpacing: "0.06em" }}>
                    Đang sử dụng
                  </span>
                </div>
              </div>

              {/* Cards grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}>
                {planCards.map((planId, idx) => {
                  const plan = PLANS[planId];
                  const isPremium = planId === "PREMIUM";
                  const isSkillBuilder = planId === "SKILL_BUILDER";
                  const isCurrent = planId === currentPlan;

                  return (
                    <div key={planId} style={{
                      padding: "28px 24px 24px",
                      borderRight: idx < planCards.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                      display: "flex", flexDirection: "column",
                      background: isPremium
                        ? "rgba(255,107,0,0.06)"
                        : isSkillBuilder
                          ? "rgba(255,107,0,0.03)"
                          : "transparent",
                      border: isPremium ? `1.5px solid ${OG}` : "none",
                      position: "relative", overflow: "hidden",
                    }}>
                      {isPremium && (
                        <div style={{
                          position: "absolute", top: "16px", right: "-28px",
                          background: OG, color: "#000",
                          fontSize: "8.5px", fontWeight: 900, letterSpacing: "0.1em",
                          padding: "4px 36px",
                          transform: "rotate(45deg)",
                          transformOrigin: "center",
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(255,107,0,0.4)",
                        }}>
                          ĐỀ XUẤT
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                        <p style={{
                          fontSize: "0.95rem",
                          fontWeight: isSkillBuilder ? 700 : 600,
                          color: isSkillBuilder ? OG : isPremium ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                        }}>
                          {plan.name}
                        </p>
                        {isPremium && <Star size={13} color="#FBBF24" fill="#FBBF24" />}
                        {isCurrent && (
                          <span style={{
                            marginLeft: "4px",
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "2px 8px", borderRadius: "99px",
                            background: "rgba(255,107,0,0.15)",
                            border: "1px solid rgba(255,107,0,0.35)",
                            fontSize: "0.6rem", color: OG, fontWeight: 700, letterSpacing: "0.06em",
                          }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: OG, display: "inline-block" }} />
                            Đang sử dụng
                          </span>
                        )}
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <span style={{
                          fontSize: "2.6rem", fontWeight: 900,
                          color: isSkillBuilder ? OG : "#FFFFFF",
                          letterSpacing: "-0.05em",
                        }}>
                          {plan.priceDisplay}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.3)", marginLeft: "2px" }}>/tháng</span>
                      </div>

                      <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.6, marginBottom: "20px" }}>
                        {plan.description}
                      </p>

                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px", marginBottom: "auto" }}>
                        {plan.features.map((feat, fi) => {
                          if (feat.extra && feat.text.startsWith("Bao gồm")) {
                            return <DarkFeature key={fi} text={feat.text} check="orange" color={OG} />;
                          }
                          if (feat.extra && feat.text.startsWith("Gia sư AI")) {
                            return (
                              <li key={fi} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                <Zap size={13} color="#FBBF24" fill="#FBBF24" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: "0.84rem", color: "#FFFFFF", fontWeight: 700 }}>{feat.text}</span>
                              </li>
                            );
                          }
                          if (feat.dim) {
                            return <DarkFeature key={fi} text={feat.text} check="dim" dim />;
                          }
                          if (feat.highlight) {
                            return <DarkFeature key={fi} text={feat.text} check="orange" color="rgba(255,255,255,0.85)" />;
                          }
                          return <DarkFeature key={fi} text={feat.text} />;
                        })}
                      </ul>

                      {renderCardButton(planId)}
                    </div>
                  );
                })}
              </div>

              {/* Trust bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "24px", padding: "14px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                {[
                  { icon: <ShieldCheck size={12} color="rgba(255,255,255,0.35)" />, text: "Bảo mật và mã hóa" },
                  { icon: <Check size={12} color="rgba(255,255,255,0.35)" strokeWidth={2.5} />, text: "Không phí ẩn" },
                  { icon: <Check size={12} color="rgba(255,255,255,0.35)" strokeWidth={2.5} />, text: "Hủy bất kỳ lúc nào" },
                ].map(t => (
                  <div key={t.text} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {t.icon}
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ SEPAY CHECKOUT STEP ══ */}
          {step === "checkout" && paymentData && (
            <div style={{ display: "flex", minHeight: "540px" }}>
              {/* Left Column: Order Summary */}
              <div style={{ width: "38%", background: "#1A1B23", padding: "36px 32px", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                <button onClick={() => { stopPolling(); setStep("pricing"); }}
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: F, marginBottom: "24px", zIndex: 1, fontWeight: 500 }}>
                  <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
                  Quay lại bảng giá
                </button>

                <h2 style={{ fontSize: "1.4rem", fontWeight: 850, color: "#FFFFFF", marginBottom: "20px", zIndex: 1, letterSpacing: "-0.02em" }}>
                  {selectedPlan === "premium" ? "Gói Career Premium" : "Gói Skill Builder"}
                </h2>

                <div style={{ marginBottom: "24px", zIndex: 1 }}>
                  <p style={{ fontSize: "2.2rem", fontWeight: 900, color: OG, letterSpacing: "-0.03em" }}>{formatVnd(paymentData.amount)}</p>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Thanh toán một lần bảo mật</p>
                </div>

                <div style={{ zIndex: 1, background: "#FFF5EC", border: "1px solid #FFE0C2", borderRadius: "14px", padding: "18px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(255, 107, 0, 0.04)" }}>
                  <p style={{ fontSize: "0.72rem", color: "#AA4700", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.06em" }}>MÃ THANH TOÁN (MEMO)</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <code style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1A202C", letterSpacing: "0.05em", fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>{paymentData.paymentCode}</code>
                    <button onClick={() => handleCopyCode(paymentData.paymentCode)}
                      style={{ background: "#FFFFFF", border: "1px solid #FFE0C2", borderRadius: "8px", width: "36px", height: "36px", minWidth: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: OG, transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)", flexShrink: 0 }}
                    >
                      {copied ? <Check size={16} color={OG} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: OG, marginTop: "8px", fontWeight: 600 }}>⚠️ Nhập chính xác mã này khi chuyển khoản</p>
                </div>

                <div style={{ zIndex: 1, marginBottom: "auto" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>Tài khoản thụ hưởng</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Ngân hàng</span>
                      <span style={{ fontSize: "0.85rem", color: "#FFFFFF", fontWeight: 600 }}>{paymentData.bank?.bankCode ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Số tài khoản</span>
                      <span style={{ fontSize: "0.85rem", color: "#FFFFFF", fontWeight: 700, fontFamily: "monospace" }}>{paymentData.bank?.accountNumber ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2px" }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Chủ tài khoản</span>
                      <span style={{ fontSize: "0.85rem", color: "#FFFFFF", fontWeight: 600 }}>{paymentData.bank?.accountName ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR & Interactive Flow */}
              <div style={{ flex: 1, padding: "36px 40px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1", minWidth: "240px" }}>
                  {pollingActive && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "99px", background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.2)", marginBottom: "14px" }}>
                      <Loader2 size={12} className="animate-spin" color={OG} />
                      <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 600 }}>{pollStatusText || "Đang quét giao dịch..."}</span>
                    </div>
                  )}
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1A202C", marginBottom: "4px" }}>Quét mã QR để thanh toán</h3>
                  <p style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "16px", textAlign: "center" }}>Mở app Ngân hàng hoặc Ví điện tử của ông</p>
                  <div style={{ position: "relative", width: "220px", height: "220px", borderRadius: "18px", overflow: "hidden", background: "#FFFFFF", padding: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!qrLoaded && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}><Loader2 size={26} className="animate-spin" color={OG} /></div>}
                    <img src={paymentData.qrUrl} alt="Sepay Payment QR" onLoad={() => setQrLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "contain", display: qrLoaded ? "block" : "none" }} />
                  </div>
                </div>

                <div style={{ flex: "1.2", minWidth: "280px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 800, color: OG, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><AlertCircle size={14} /> Hướng dẫn chuyển khoản nhanh</p>
                    <ol style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li style={{ fontSize: "0.78rem", color: "#4A5568", lineHeight: 1.5 }}>Quét mã QR tự động điền thông tin hoặc copy tay.</li>
                      <li style={{ fontSize: "0.78rem", color: "#4A5568", lineHeight: 1.5 }}>Kiểm tra số tiền đúng: <strong style={{ color: "#1A202C" }}>{formatVnd(paymentData.amount ?? 0)}</strong></li>
                      <li style={{ fontSize: "0.78rem", color: "#4A5568", lineHeight: 1.5 }}>Nội dung ghi chuẩn: <strong style={{ color: OG, fontFamily: "monospace" }}>{paymentData.paymentCode}</strong></li>
                      <li style={{ fontSize: "0.78rem", color: "#4A5568", lineHeight: 1.5 }}>Bấm xác nhận chuyển khoản bên dưới nếu app ngân hàng đã báo trừ tiền.</li>
                    </ol>
                  </div>

                  <motion.button whileHover={{ scale: 1.02, background: "#E66000" }} whileTap={{ scale: 0.98 }} onClick={handleManualVerify}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", background: OG, border: "none", color: "#FFFFFF", fontFamily: F, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 8px 20px rgba(255, 107, 0, 0.3)", transition: "transform 0.1s ease" }}
                  >
                    <RefreshCw size={15} /> Xác Nhận Đã Chuyển Khoản 🦾
                  </motion.button>
                  <p style={{ fontSize: "0.72rem", color: "#718096", textAlign: "center", marginTop: "2px" }}>Hệ thống tự động kiểm tra hóa đơn liên tục mỗi 5 giây.</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ SUCCESS STEP ══ */}
          {step === "success" && (
            <div style={{ minHeight: "440px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 28px", background: `radial-gradient(circle at top, rgba(255,107,0,0.18) 0%, rgba(17,17,21,1) 52%)` }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                style={{ width: "88px", height: "88px", borderRadius: "50%", background: "rgba(255,107,0,0.18)", border: `1px solid rgba(255,107,0,0.45)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", boxShadow: "0 0 0 12px rgba(255,107,0,0.08), 0 0 0 24px rgba(255,107,0,0.04)" }}
              >
                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}><Check size={36} color={OG} strokeWidth={3} /></motion.div>
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ fontSize: "0.8rem", color: OG, fontWeight: 800, letterSpacing: "0.12em", marginBottom: "8px" }}>THANH TOÁN THÀNH CÔNG</motion.p>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: "10px" }}>Chúc mừng bạn đã nâng cấp gói!</motion.h3>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.62)", maxWidth: "380px", lineHeight: 1.6, marginBottom: "6px" }}>
                Gói <span style={{ color: "#fff", fontWeight: 700 }}>{selectedPlan === "premium" ? "Career Premium" : "Skill Builder"}</span> đã được kích hoạt.
              </motion.p>
              {paymentData && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.42)", marginBottom: "26px" }}>
                  Mã giao dịch: <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{paymentData.paymentCode}</span>
                </motion.p>
              )}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%", maxWidth: "360px" }}>
                <button
                  onClick={() => navigate("/app/workspaces", { replace: true })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: OG, color: "#fff", fontFamily: F, fontWeight: 700, cursor: "pointer", boxShadow: `0 6px 22px rgba(255,107,0,0.38)`, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  Bắt đầu học ngay →
                </button>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.38)", margin: 0 }}>
                  Tự động chuyển trang sau {successCountdown}s...
                </p>
              </motion.div>
            </div>
          )}

          {/* ══ ERROR STEP ══ */}
          {step === "error" && (
            <div style={{ minHeight: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 28px", background: "radial-gradient(circle at top, rgba(239,68,68,0.12) 0%, rgba(17,17,21,1) 52%)" }}>
              <div style={{ width: "78px", height: "78px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <AlertCircle size={34} color="#EF4444" strokeWidth={2.5} />
              </div>
              <p style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 800, letterSpacing: "0.12em", marginBottom: "8px" }}>{errorStep === "timeout" ? "THỜI GIAN CHỜ HẾT" : "THANH TOÁN THẤT BẠI"}</p>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: "10px" }}>{errorStep === "create_failed" ? "Không thể tạo giao dịch" : errorStep === "timeout" ? "Giao dịch chưa được xác nhận" : "Thanh toán chưa hoàn tất"}</h3>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px" }}>{createError || pollError || "Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."}</p>
              <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "360px" }}>
                <button onClick={resetAndClose} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: "rgba(255,255,255,0.88)", fontFamily: F, fontWeight: 700, cursor: "pointer" }}>Đóng</button>
                <button onClick={handleRetry} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: OG, color: "#fff", fontFamily: F, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 22px rgba(255,107,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><RefreshCw size={15} /> Thử lại</button>
              </div>
            </div>
          )}

          {/* ══ TOAST NOTIFICATION COMPONENT ══ */}
          <AnimatePresence>
            {toast.show && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 100, display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              >
                <AlertCircle size={16} color={OG} />
                <span style={{ fontSize: "0.82rem", color: "#1A202C", fontWeight: 600, whiteSpace: "nowrap" }}>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}