import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { X, Check, ShieldCheck, ChevronRight, Zap, Star, Loader2, AlertCircle, Copy, RefreshCw, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createSepayPayment, getPaymentDetail } from "../../../api/billing/sepayPaymentService";
import { getMe } from "../../../api/utilities/meService";
import type { SepayPaymentCreateResponse, CreateSepayPaymentRequest } from "../../../api/core/skillSprintModels";
import { listSubscriptionPlans, STATIC_FALLBACK_PLANS, formatPlanPrice, isFeatureEnabled, resolvePlanFeatures, type PublicPlanResponse, type PublicPlanFeature } from "../../../api/admin/adminSubscriptionPlansService";

const F = "'Plus Jakarta Sans','Inter',sans-serif";
const OG = "#FF6B00";

/* ─── Plan type ─── */
export type PlanId = "FREE" | "SKILL_BUILDER" | "PREMIUM";

/**
 * Normalized view-model for a pricing card. The SINGLE SOURCE OF TRUTH is the BE
 * `listSubscriptionPlans()` response. The shared STATIC_FALLBACK_PLANS (from the
 * service) is used only while the request is in flight or if the API returns
 * nothing — purely to avoid layout flicker. Once real data arrives it REPLACES
 * the fallback (never appended).
 */
interface DisplayPlan {
  planId: string;              // BE UUID, or a synthetic "__*" key for fallback plans
  name: string;
  monthlyPrice: number;
  priceDisplay: string;        // "Miễn phí" for free, else e.g. "89.000 đ"
  description: string;
  features: PublicPlanFeature[]; // featureName + enabled
  benefits: string[];          // marketing bullet strings (jsonb string[] on the plan)
  isFree: boolean;
  synthetic: boolean;          // true for fallback plans → pay via planType, not planId
}

function toDisplayPlan(p: PublicPlanResponse): DisplayPlan {
  const isFree = p.monthlyPrice <= 0;
  return {
    planId: p.planId,
    synthetic: p.planId.startsWith("__"), // shared fallback plans use "__"-prefixed ids
    isFree,
    name: p.planName,
    monthlyPrice: p.monthlyPrice,
    priceDisplay: formatPlanPrice(p.monthlyPrice, p.currency),
    description: p.description ?? "",
    // ðŸ›¡ï¸ Airtight safety net: BE may return eatures as null/undefined when the
    // plan has no rows in plan_feature. Always coerce to [] so consumers can call
    // .map(...) without crashing.
    // Resolve across BE naming/shape drift (features / planFeatures / featureList;
    // string or object elements) — always a normalized [], never blank or crashing.
    features: resolvePlanFeatures(p),
    benefits: p.benefits ?? [],
  };
}

function FeatureIncluded({ text, accent = false, enabled = true }: { text: string; accent?: boolean; enabled?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {enabled ? (
        <Check size={13} color={accent ? OG : "#94A3B8"} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: "2px" }} />
      ) : (
        <X size={13} color="#CBD5E1" style={{ flexShrink: 0, marginTop: "2px" }} />
      )}
      <span style={{ fontSize: "0.84rem", color: enabled ? (accent ? "#334155" : "#475569") : "#CBD5E1", lineHeight: 1.5, textDecoration: enabled ? undefined : "line-through" }}>
        {text}
      </span>
    </li>
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

const PAID_STATUSES = new Set(["SUCCESS", "COMPLETED", "PAID"]);
const FAILED_STATUSES = new Set(["FAILED", "EXPIRED", "CANCELED"]);

function isPaidStatus(status?: string | null): boolean {
  return !!status && PAID_STATUSES.has(status.toUpperCase());
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (plan: "builder" | "premium") => void;
  initialPlan?: "builder" | "premium";
  currentPlan: "starter" | "skill_builder" | "career_premium";
  /** UUID of the user's active plan — used to highlight the current plan by planId */
  currentPlanId?: string;
  packageName?: string;
}

export function PricingModal({ isOpen, onClose, onSuccess, initialPlan = "premium", currentPlan: rawCurrentPlan, currentPlanId, packageName }: PricingModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"pricing" | "checkout" | "success" | "error">("pricing");
  // `selectedPlan` is kept only for the onSuccess callback contract ("builder"|"premium").
  const [selectedPlan, setSelectedPlan] = useState<"builder" | "premium">("premium");
  // The actually-selected plan, derived from the dynamic list.
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");
  const [successCountdown, setSuccessCountdown] = useState(3);

  // Dynamic plan data from BE — the single source of truth.
  const [availablePlans, setAvailablePlans] = useState<PublicPlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const getNormalizedPlan = (planStr: string): PlanId => {
    if (!planStr) return "FREE";
    const upper = planStr.toUpperCase();
    if (upper === "BUILDER" || upper === "SKILL_BUILDER" || upper === "BASIC" || upper === "SKILL BUILDER") return "SKILL_BUILDER";
    if (upper === "PREMIUM" || upper === "CAREER_PREMIUM") return "PREMIUM";
    return "FREE";
  };

  const successPackageName = packageName?.trim() || selectedPlanName || "Gói dịch vụ";

  const [paymentData, setPaymentData] = useState<SepayPaymentCreateResponse | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [pollStatusText, setPollStatusText] = useState<string>("");
  const [pollError, setPollError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [errorStep, setErrorStep] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [userFullName, setUserFullName] = useState<string>("");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptRef = useRef(0);
  const paymentIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("pricing");
      setSelectedPlan(initialPlan);
      setSelectedPlanId(null);
      setSelectedPlanName("");
      setPaymentData(null);
      setCreatingPayment(false);
      setCreateError(null);
      setPollingActive(false);
      setPollStatusText("");
      setPollError(null);
      setCopied(false);
      setQrLoaded(false);
      setErrorStep(null);
      setVerifying(false);
      pollAttemptRef.current = 0;
      paymentIdRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Fetch dynamic plan data
      setLoadingPlans(true);
      listSubscriptionPlans()
        .then(data => setAvailablePlans(data))
        .catch(() => setAvailablePlans([]))
        .finally(() => setLoadingPlans(false));
    }
  }, [isOpen, initialPlan]);

  useEffect(() => {
    if (step !== "success") return;
    getMe()
      .then((profile) => setUserFullName(profile.fullName))
      .catch(() => {});
  }, [step]);

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

      if (isPaidStatus(detail?.status)) {
        stopPolling();
        setStep("success");
        onSuccess?.(selectedPlan);
        return;
      }

      if (detail.status && FAILED_STATUSES.has(detail.status.toUpperCase())) {
        stopPolling();
        setPollError("Giao dịch không thành công. Vui lòng thử lại.");
        setErrorStep("payment_failed");
        setStep("error");
        return;
      }

      pollAttemptRef.current += 1;
      setPollStatusText(`Kiểm tra hóa đơn... (${pollAttemptRef.current})`);

      if (pollAttemptRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPollError("Hết thời gian chờ xác thực. Vui lòng thử lại.");
        setErrorStep("timeout");
        setStep("error");
      }
    } catch {
      setPollStatusText(`Đang kết nối lại... (${pollAttemptRef.current})`);
    }
  }, [stopPolling, onSuccess, selectedPlan]);

  const startPolling = useCallback((paymentId: string) => {
    paymentIdRef.current = paymentId;
    pollAttemptRef.current = 0;
    setPollingActive(true);
    setPollStatusText("Chờ xác nhận chuyển tiền...");
    doPollingCheck();
    pollingRef.current = setInterval(doPollingCheck, POLL_INTERVAL_MS);
  }, [doPollingCheck]);

  // ── Single source of truth: BE plans, sorted by price; static only as fallback ──
  const displayPlans: DisplayPlan[] = (availablePlans.length > 0 ? availablePlans : STATIC_FALLBACK_PLANS)
    .map(toDisplayPlan)
    .sort((a, b) => a.monthlyPrice - b.monthlyPrice);

  const paidPlans = displayPlans.filter(p => !p.isFree);
  const currentNorm = getNormalizedPlan(rawCurrentPlan); // FREE | SKILL_BUILDER | PREMIUM
  const hasCurrentId = !!currentPlanId && displayPlans.some(p => p.planId === currentPlanId);

  // Resolve the user's current plan to a price so cards can be ranked upgrade/downgrade.
  const currentPrice = (() => {
    if (hasCurrentId) return displayPlans.find(p => p.planId === currentPlanId)?.monthlyPrice ?? 0;
    if (currentNorm === "SKILL_BUILDER") return paidPlans[0]?.monthlyPrice ?? 0;
    if (currentNorm === "PREMIUM") return paidPlans[paidPlans.length - 1]?.monthlyPrice ?? 0;
    return 0; // FREE
  })();

  const currentPlanName = (() => {
    if (hasCurrentId) return displayPlans.find(p => p.planId === currentPlanId)?.name ?? "Starter";
    if (currentNorm === "SKILL_BUILDER") return paidPlans[0]?.name ?? "Skill Builder";
    if (currentNorm === "PREMIUM") return paidPlans[paidPlans.length - 1]?.name ?? "Gói Premium";
    return displayPlans.find(p => p.isFree)?.name ?? "Starter";
  })();

  const handleUpgradePlan = async (plan: DisplayPlan) => {
    if (creatingPayment || plan.isFree) return;
    setSelectedPlanId(plan.planId);
    setSelectedPlanName(plan.name);
    // Keep onSuccess contract: top-priced paid plan → "premium", otherwise "builder".
    const isTopTier = paidPlans.length > 0 && plan.monthlyPrice >= paidPlans[paidPlans.length - 1].monthlyPrice;
    setSelectedPlan(isTopTier ? "premium" : "builder");
    setCreatingPayment(true);
    setCreateError(null);
    setErrorStep(null);

    try {
      // Prefer the BE UUID; synthetic fallback plans pay via the legacy planType enum.
      const payload: CreateSepayPaymentRequest = plan.synthetic
        ? { planType: isTopTier ? "PREMIUM" : "SKILL_BUILDER" }
        : { planId: plan.planId };
      const result = await createSepayPayment(payload);
      setPaymentData(result);
      setStep("checkout");
      startPolling(result.paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tạo mã QR. Vui lòng thử lại.";
      setCreateError(message);
      setErrorStep("create_failed");
      setStep("error");
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleManualVerify = async () => {
    if (verifying) return;
    setVerifying(true);
    setPollStatusText("Đang xác thực thủ công...");
    try {
      const pid = paymentIdRef.current;
      if (!pid) return;

      const detail = await getPaymentDetail(pid);

      if (isPaidStatus(detail?.status)) {
        stopPolling();
        setStep("success");
        onSuccess?.(selectedPlan);
      } else {
        toast.info("Hệ thống chưa nhận được khoản tiền. Vui lòng đợi vài giây hoặc kiểm tra lại nội dung chuyển khoản.");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ ngân hàng. Vui lòng thử lại sau.");
    } finally {
      setVerifying(false);
      setPollStatusText(`Đang tự động quét... (${pollAttemptRef.current})`);
    }
  };

  const handleRetry = () => {
    setStep("pricing");
    setCreateError(null);
    setPollError(null);
    setErrorStep(null);
    setPaymentData(null);
    stopPolling();
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Đã sao chép nội dung chuyển khoản!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Không thể sao chép. Vui lòng copy thủ công.");
    }
  };

  if (!isOpen) return null;

  const resetAndClose = () => {
    stopPolling();
    setStep("pricing");
    setPaymentData(null);
    setCreateError(null);
    setPollError(null);
    onClose();
  };

  const gridColsClass =
    displayPlans.length >= 3 ? "md:grid-cols-3" : displayPlans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={resetAndClose}
        className="bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={e => e.stopPropagation()}
          className="bg-white border border-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden relative"
          style={{
            width: "100%",
            maxWidth: step === "pricing" ? "860px" : step === "checkout" ? "880px" : "540px",
            fontFamily: F,
            transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Nút đóng X cao cấp */}
          <button onClick={resetAndClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 border-none flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-20">
            <X size={15} />
          </button>

          {/* ════ STEP 1: PRICING TAB SELECTION ════ */}
          {step === "pricing" && (
            <>
              <div className="text-center px-6 pt-10 pb-5">
                <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100/60 px-3.5 py-1 rounded-full mb-4">
                  <Zap size={11} className="fill-[#FF6B00] stroke-[#FF6B00]" />
                  <span className="text-[10px] text-[#FF6B00] font-black tracking-widest uppercase">GÓI SKILLSPRINT</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Nâng cấp hành trình sự nghiệp</h2>
                <p className="text-sm text-slate-500 font-medium">Chọn gói phù hợp với mục tiêu học tập của bạn.</p>
              </div>

              {/* Banner Gói Hiện Tại */}
              <div className="flex items-center justify-between px-6 py-4 mx-6 mb-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                <div>
                  <p className="text-[10px] text-amber-800 font-bold tracking-wider uppercase mb-0.5">GÓI HIỆN TẠI CỦA BẠN</p>
                  <p className="text-base font-black text-slate-800">{currentPlanName}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-amber-600 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Đang sử dụng
                </div>
              </div>

              {/* Grid Bảng giá — rendered from the single source of truth (displayPlans) */}
              {loadingPlans && availablePlans.length === 0 ? (
                <div className={`grid grid-cols-1 ${gridColsClass} border-t border-slate-100`}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`p-7 flex flex-col gap-3 animate-pulse ${i < 2 ? "border-b md:border-b-0 md:border-r border-slate-100" : ""}`}>
                      <div className="h-5 w-24 bg-slate-100 rounded" />
                      <div className="h-9 w-20 bg-slate-100 rounded" />
                      <div className="h-4 w-full bg-slate-100 rounded" />
                      <div className="mt-2 flex flex-col gap-2.5">
                        {[80, 70, 90].map((w, k) => <div key={k} className="h-3.5 bg-slate-100 rounded" style={{ width: `${w}%` }} />)}
                      </div>
                      <div className="h-11 bg-slate-100 rounded-xl mt-6" />
                    </div>
                  ))}
                </div>
              ) : (
              <div className={`grid grid-cols-1 ${gridColsClass} border-t border-slate-100`}>
                <style>{`
                  @keyframes ssFadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                  @keyframes ssShimmer { 0% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
                  .ss-plan-card { animation: ssFadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                  .ss-plan-card:hover { transform: scale(1.02); box-shadow: 0 20px 45px rgba(0,0,0,0.10); z-index: 20; }
                  .ss-shimmer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
                  .ss-shimmer::before { content: ""; position: absolute; top: 0; bottom: 0; width: 45%; background: linear-gradient(110deg, transparent, rgba(255,107,0,0.10), transparent); animation: ssShimmer 2.8s linear infinite; }
                  @media (prefers-reduced-motion: reduce) {
                    .ss-plan-card { animation: none; transition: none; }
                    .ss-plan-card:hover { transform: none; box-shadow: none; }
                    .ss-shimmer::before { animation: none; display: none; }
                  }
                `}</style>
                {displayPlans.map((plan, idx) => {
                  const isFeatured  = !plan.isFree && idx === displayPlans.length - 1;
                  const isCurrent   = hasCurrentId ? plan.planId === currentPlanId : plan.monthlyPrice === currentPrice;
                  const isUpgrade   = !isCurrent && !plan.isFree && plan.monthlyPrice > currentPrice;
                  const isDowngrade = !isCurrent && plan.monthlyPrice < currentPrice;
                  const isBusy      = creatingPayment && selectedPlanId === plan.planId;

                  return (
                    <div key={plan.planId}
                      className={`ss-plan-card p-7 flex flex-col h-full justify-between relative overflow-hidden ${
                        !isFeatured && isDowngrade ? "bg-slate-50/70 opacity-75" : !isFeatured ? "bg-slate-50/30" : "bg-white"
                      } ${idx < displayPlans.length - 1 ? "border-b md:border-b-0 md:border-r border-slate-100" : ""}`}
                      style={{
                        border: isFeatured ? `2px solid ${OG}` : undefined,
                        boxShadow: isFeatured ? "0 15px 45px rgba(255,107,0,0.06)" : undefined,
                        borderRadius: isFeatured ? "20px" : undefined,
                        zIndex: isFeatured ? 10 : 1,
                        animationDelay: `${idx * 90}ms`,
                      }}
                    >
                      {/* Infinite shimmer sweep over the highlighted card */}
                      {isFeatured && <span className="ss-shimmer" aria-hidden="true" />}
                      {isFeatured && (
                        <div className="absolute top-4 -right-8 bg-[#FF6B00] text-white text-[9px] font-black tracking-wider uppercase py-1 px-8 rotate-45 shadow-sm z-10">
                          ĐỀ XUẤT
                        </div>
                      )}

                      {/* Upper section — grows so the action button is pinned to the bottom */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5 mb-3">
                          <p className="text-base font-black text-slate-800">{plan.name}</p>
                          {isFeatured && <Star size={12} className="fill-amber-400 stroke-amber-400" />}
                        </div>

                        <div className="mb-3 flex items-baseline">
                          <span className={`text-4xl font-black tracking-tight ${isFeatured ? "text-[#FF6B00]" : "text-slate-800"}`}>
                            {plan.priceDisplay}
                          </span>
                          {!plan.isFree && <span className="text-xs text-slate-400 ml-1 font-medium">/tháng</span>}
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5 min-h-[32px]">{plan.description}</p>

                        {/* Benefits — marketing bullets (jsonb string[]), above the
                            feature list and separated by a divider. */}
                        {plan.benefits.length > 0 && (
                          <ul
                            className="list-none space-y-2"
                            style={{ margin: "0 0 16px", padding: "0 0 16px", borderBottom: "1px solid #F1F5F9" }}
                          >
                            {plan.benefits.map((b, bi) => (
                              <li key={bi} className="flex items-start gap-2">
                                <Check size={16} color={OG} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                                <span style={{ fontSize: "0.84rem", color: "#334155", lineHeight: 1.5 }}>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <ul className="space-y-3 list-none p-0 m-0">
                          {(plan.features ?? []).map((feat, fi) => (
                            <FeatureIncluded key={feat.featureKey ?? fi} text={feat.featureName} accent={!plan.isFree} enabled={isFeatureEnabled(feat)} />
                          ))}
                        </ul>
                      </div>

                      {isCurrent ? (
                        <button disabled className="w-full py-3 rounded-xl text-sm font-bold bg-orange-50/80 text-[#FF6B00] border border-orange-200/50 mt-6 cursor-default">
                          Gói hiện tại
                        </button>
                      ) : isUpgrade ? (
                        <motion.button
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          onClick={() => handleUpgradePlan(plan)} disabled={isBusy}
                          className="w-full py-3 bg-[#FF6B00] hover:bg-[#FF5500] text-white font-bold text-sm rounded-xl mt-6 shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                          {isBusy ? "Đang xử lý..." : `Nâng cấp ${plan.name}`}
                        </motion.button>
                      ) : (
                        <button disabled className="w-full py-3 bg-slate-100/80 text-slate-400 border border-slate-200/60 rounded-xl font-bold text-sm mt-6 cursor-not-allowed">
                          {plan.isFree ? "Miễn phí" : "Không khả dụng"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              )}

              {/* Lower Trust Metadata Bar */}
              <div className="flex items-center justify-center gap-6 px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <ShieldCheck size={13} className="text-green-500" /> Bảo mật và mã hóa
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Check size={13} className="text-[#FF6B00]" strokeWidth={3} /> Không phí ẩn
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Check size={13} className="text-[#FF6B00]" strokeWidth={3} /> Hủy bất kỳ lúc nào
                </div>
              </div>
            </>
          )}

          {/* ════ STEP 2: CỔNG QR CHECKOUT ════ */}
          {step === "checkout" && paymentData && (
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
              
              {/* Cột trái: Tóm tắt hóa đơn */}
              <div className="md:col-span-5 bg-slate-50/80 border-r border-slate-100 p-8 flex flex-col justify-between">
                <div>
                  <button onClick={() => { stopPolling(); setStep("pricing"); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#FF6B00] bg-none border-none cursor-pointer font-bold transition-colors mb-8">
                    <ChevronRight size={14} className="rotate-180" /> Quay lại bảng giá
                  </button>

                  <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase mb-1">ĐƠN HÀNG NÂNG CẤP</p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
                    {selectedPlanName || (selectedPlan === "premium" ? "Gói Premium" : "Gói Skill Builder")}
                  </h3>

                  <div className="mb-8">
                    <p className="text-3xl font-black text-[#FF6B00] tracking-tight">{formatVnd(paymentData.amount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Gia hạn tự động hàng tháng, an toàn và bảo mật</p>
                  </div>

                  {/* Khối MEMO chuyển khoản */}
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm shadow-orange-500/5">
                    <p className="text-[10px] text-[#FF6B00] font-black tracking-wider mb-2">NỘI DUNG CHUYỂN KHOẢN (MEMO)</p>
                    <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-orange-200/60">
                      <code className="text-sm font-black text-slate-800 tracking-wider font-mono select-all block overflow-hidden text-ellipsis whitespace-nowrap flex-grow">
                        {paymentData.paymentCode}
                      </code>
                      <button onClick={() => handleCopyCode(paymentData.paymentCode)} className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white flex items-center justify-center cursor-pointer border-none transition-all flex-shrink-0">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#FF6B00] font-bold mt-2 leading-tight">⚠️ Nhập chính xác mã này để tài khoản kích hoạt tự động</p>
                  </div>
                </div>

                {/* Chi tiết tài khoản thụ hưởng */}
                <div className="mt-8 pt-6 border-t border-slate-200/60 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Ngân hàng</span>
                    <span className="text-slate-800 font-black bg-slate-200/50 px-2 py-0.5 rounded text-[10px] tracking-wide">{paymentData.bank?.bankCode ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Số tài khoản</span>
                    <span className="text-slate-900 font-black font-mono text-sm tracking-wide">{paymentData.bank?.accountNumber ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Chủ tài khoản</span>
                    <span className="text-slate-800 font-bold uppercase tracking-tight">{paymentData.bank?.accountName ?? "—"}</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Khung quét QR và hiệu ứng Laser tuyến tính */}
              <div className="md:col-span-7 p-8 bg-white flex flex-col items-center justify-center">
                {pollingActive && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-50/80 border border-orange-100 px-3.5 py-1 rounded-full mb-4 animate-pulse">
                    <Loader2 size={12} className="animate-spin text-[#FF6B00]" />
                    <span className="text-[10px] text-[#FF6B00] font-bold">{pollStatusText || "Đang chờ quét hoá đơn..."}</span>
                  </div>
                )}
                <h3 className="text-lg font-black text-slate-800 mb-1">Quét mã QR để thanh toán</h3>
                <p className="text-xs text-slate-400 font-medium mb-6 text-center">Sử dụng ứng dụng ngân hàng di động bất kỳ để quét mã</p>
                
                {/* Khung chứa ảnh QR Code */}
                <div className="relative w-52 h-52 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex items-center justify-center group overflow-hidden">
                  
                  {/* Thanh quét quét Laser tịnh tiến lên xuống mượt mà vô hạn */}
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-[#FF6B00] shadow-[0_0_12px_4px_rgba(255,107,0,0.8)] z-10 pointer-events-none" 
                    style={{
                      animation: "scanLinear 2.5s linear infinite",
                    }}
                  />

                  {/* Nhúng mã Keyframes tạo chuyển động mượt cho Laser */}
                  <style>{`
                    @keyframes scanLinear {
                      0% { top: 0%; opacity: 0; }
                      5% { opacity: 1; }
                      95% { opacity: 1; }
                      100% { top: 100%; opacity: 0; }
                    }
                  `}</style>
                  
                  {!qrLoaded && (
                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#FF6B00]" />
                    </div>
                  )}
                  <img 
                    src={paymentData.qrUrl} 
                    alt="Sepay Payment QR" 
                    onLoad={() => setQrLoaded(true)} 
                    className="w-full h-full object-contain relative z-0" 
                    style={{ display: qrLoaded ? "block" : "none" }} 
                  />
                </div>

                {/* Hướng dẫn chuyển khoản nhanh */}
                <div className="w-full max-w-sm mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 space-y-2 font-medium">
                  <p>1. App Ngân hàng sẽ tự động điền số tiền <span className="text-slate-800 font-bold">{formatVnd(paymentData.amount)}</span>.</p>
                  <p>2. Đảm bảo phần nội dung chuyển khoản khớp với mã <span className="text-[#FF6B00] font-mono font-bold">{paymentData.paymentCode}</span> phía trên.</p>
                </div>

                {/* Nút kiểm tra thủ công */}
                <div className="w-full max-w-sm mt-5">
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={handleManualVerify}
                    disabled={verifying}
                    className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#FF5500] text-white font-black text-sm rounded-xl border-none shadow-[0_6px_20px_rgba(255,107,0,0.2)] flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {verifying ? "Đang xác thực giao dịch..." : "Tôi đã chuyển khoản thành công"}
                  </motion.button>
                  <p className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">Cổng SePay quét khớp lệnh hóa đơn tự động mỗi 5 giây.</p>
                </div>
              </div>

            </div>
          )}

          {/* ════ STEP 3: MÀN HÌNH SUCCESS (TEMPLATE TRẮNG CAM + DYNAMIC NAME TỪ API) ════ */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center text-center p-10 py-14 bg-white relative overflow-hidden">
              {/* Background Ambient Glow màu cam thương hiệu */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.06)_0%,transparent_70%)] pointer-events-none" />

              {/* Vòng tròn checkmark nhảy Bounce động - Màu cam đồng bộ */}
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}
                className="w-20 h-20 bg-orange-50 border-4 border-orange-100 text-[#FF6B00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/10 mb-6"
              >
                <Check size={36} strokeWidth={3.5} className="animate-pulse" />
              </motion.div>

              <p className="text-[10px] text-[#FF6B00] font-black tracking-widest uppercase mb-1.5">NÂNG CẤP THÀNH CÔNG</p>
              
              {/* TIÊU ĐỀ ĐỘNG: Đọc trực tiếp trường learnerName từ cổng API SePay */}
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Chào mừng {userFullName || "Bạn"} tới {successPackageName}! 🎉
              </h3>

              {/* NỘI DUNG MÔ TẢ ĐỘNG: Đồng bộ template trắng cam rực rỡ */}
              <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed mb-6">
                Hệ thống đã kích hoạt toàn bộ đặc quyền <span className="text-[#FF6B00] font-bold">Gia sư AI 24/7</span> và bộ công cụ tăng tốc học tập. Sẵn sàng bứt phá điểm số cùng SkillSprint chưa <span className="text-[#FF6B00] font-bold">{userFullName || "Bạn"}</span>? 🚀
              </p>

              {/* Khung biên lai mini đồng bộ sắc cam */}
              {paymentData && (
                <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 text-xs space-y-2.5 text-left divide-y divide-slate-200/50 shadow-sm">
                  <div className="flex justify-between font-medium text-slate-500 pt-0">
                    <span>Mã hóa đơn:</span>
                    <span className="font-mono text-slate-700 font-bold">{paymentData.paymentCode}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-500 pt-2.5">
                    <span>Gói tài khoản:</span>
                    <span className="text-slate-800 font-bold">{selectedPlanName || (selectedPlan === "premium" ? "Gói Premium" : "Skill Builder")}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-500 pt-2.5">
                    <span>Tổng số tiền:</span>
                    <span className="text-[#FF6B00] font-black">{formatVnd(paymentData.amount)}</span>
                  </div>
                </div>
              )}

              {/* Nút Call To Action */}
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => navigate("/app/workspaces", { replace: true })}
                  className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#FF5500] text-white font-black text-sm border-none rounded-xl cursor-pointer shadow-lg shadow-orange-500/20 transition-all block text-center"
                >
                  Bắt đầu học ngay thôi 🚀
                </button>
                <p className="text-[11px] text-slate-400 font-medium">
                  Hệ thống tự động chuyển hướng sau <span className="font-bold text-slate-600">{successCountdown}s</span>...
                </p>
              </div>
            </div>
          )}

          {/* ════ STEP 4: MÀN HÌNH BÁO LỖI ════ */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center text-center p-10 py-14 bg-white">
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-500 mb-5 shadow-sm">
                <AlertCircle size={30} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] text-red-500 font-black tracking-widest uppercase mb-1.5">
                {errorStep === "timeout" ? "HẾT THỜI GIAN CHỜ" : "CÓ LỖI XẢY RA"}
              </p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                {errorStep === "create_failed" ? "Không thể khởi tạo QR" : "Chưa nhận được khoản chuyển"}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs font-medium leading-relaxed mb-8">
                {createError || pollError || "Hệ thống gặp gián đoạn tạm thời khi liên kết ngân hàng. Vui lòng thử lại."}</p>
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={resetAndClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl bg-white cursor-pointer transition-colors">Đóng</button>
                <button onClick={handleRetry} className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#FF5500] text-white border-none font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                  <RefreshCw size={13} /> Thử lại
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
