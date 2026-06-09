import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Calendar, Check, ChevronLeft, ChevronRight, Clock, Clock3, Loader2, Plus, Sparkles, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { fetchOnboardingProfile, upsertOnboardingProfile, type OnboardingProfileResponse } from "../../../api/onboardingService";

const dayOptions = [
  { label: "Thứ 2", value: "MONDAY" },
  { label: "Thứ 3", value: "TUESDAY" },
  { label: "Thứ 4", value: "WEDNESDAY" },
  { label: "Thứ 5", value: "THURSDAY" },
  { label: "Thứ 6", value: "FRIDAY" },
  { label: "Thứ 7", value: "SATURDAY" },
  { label: "Chủ Nhật", value: "SUNDAY" },
] as const;

const confidenceOptions = [
  { value: "LOW", title: "🥲 Bắt đầu từ số 0", description: "Cần xây dựng lộ trình chi tiết từng bước căn bản nhất." },
  { value: "MEDIUM", title: "🤔 Đã biết chút ít", description: "Muốn củng cố kiến thức với nhịp độ học tập vừa phải." },
  { value: "HIGH", title: "😎 Rất tự tin", description: "Đã có nền tảng vững chắc và muốn tăng tốc đi nhanh hơn." },
] as const;

const schema = z.object({
  targetGoal: z.string().min(1, "Mục tiêu không được để trống").max(2000, "Tối đa 2000 ký tự"),
  studyHoursPerWeek: z.number().min(1, "Tối thiểu 1 giờ/tuần").max(40, "Tối đa 40 giờ/tuần"),
  targetDeadline: z.string().min(1, "Vui lòng chọn ngày hoàn thành"),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

type FormValues = z.infer<typeof schema>;

type OnboardingPayload = {
  targetGoal: string;
  studyHoursPerWeek: number;
  targetDeadline: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  preferredDays: string[];
  preferredTimeSlots: string[];
};

type ConfidenceCardProps = {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
};

function ConfidenceCard({ active, title, description, onClick }: ConfidenceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 cursor-pointer ${
        active
          ? "border-[#FF6B00] bg-orange-50/50 shadow-md shadow-orange-600/5 ring-2 ring-[#FF6B00]/20"
          : "border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50/50 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={`text-sm font-bold transition-colors ${active ? "text-orange-700" : "text-slate-800"}`}>
            {title}
          </div>
          <div className="text-xs leading-relaxed text-slate-500">{description}</div>
        </div>
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            active ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-slate-300 text-transparent"
          }`}
        >
          <Check className="h-3 w-3 stroke-[3]" />
        </div>
      </div>
    </button>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function DayChip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer border ${
        active
          ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm shadow-orange-600/20"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

type TimeSlotTagProps = {
  label: string;
  onRemove: () => void;
};

function TimeSlotTag({ label, onRemove }: TimeSlotTagProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3.5 py-2 text-xs font-semibold text-orange-700 shadow-sm">
      <Clock className="h-3.5 w-3.5 text-[#FF6B00]" />
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-lg text-orange-400 hover:bg-orange-100 hover:text-orange-700 transition cursor-pointer"
        aria-label={`Remove ${label}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function isValidTimeSlot(slot: string): boolean {
  const parts = slot.split('-');
  if (parts.length !== 2) return false;
  const [start, end] = parts;
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end);
}

export default function OnboardingModal({
  open,
  onClose,
  workspaceId,
  initialValues,
  mode = "onboarding",
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  initialValues?: OnboardingProfileResponse | null;
  mode?: "onboarding" | "edit";
}) {
  const isEditMode = mode === "edit";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    trigger,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetGoal: "",
      studyHoursPerWeek: 8,
      targetDeadline: "",
      confidence: "MEDIUM",
    },
  });

  const [step, setStep] = React.useState(0);
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  const [slotStart, setSlotStart] = React.useState("");
  const [slotEnd, setSlotEnd] = React.useState("");
  const [loadingProfile, setLoadingProfile] = React.useState(false);

  const targetGoalValue = watch("targetGoal") || "";
  const targetDeadlineValue = watch("targetDeadline") ?? null;
  const currentConfidence = watch("confidence");

  React.useEffect(() => {
    if (!open) return;

    let alive = true;

    const applyProfile = (profile?: OnboardingProfileResponse | null) => {
      reset({
        targetGoal: profile?.targetGoal ?? "",
        studyHoursPerWeek: profile?.studyHoursPerWeek ?? 8,
        targetDeadline: profile?.targetDeadline ?? "",
        confidence: (profile?.confidence as FormValues["confidence"]) ?? "MEDIUM",
      });
      setSelectedDays(profile?.preferredDays ?? []);
      setTimeSlots((profile?.preferredTimeSlots ?? []).filter(isValidTimeSlot));
      setSlotStart("");
      setSlotEnd("");
      setStep(0);
    };

    if (initialValues) {
      applyProfile(initialValues);
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        if (initialValues) return;
        const response = await fetchOnboardingProfile(workspaceId);
        const profile = response.data;
        if (!alive) return;
        applyProfile(profile);
      } catch (error: any) {
        if (!alive) return;
        toast.error(error?.message || "Không thể tải dữ liệu onboarding");
        applyProfile(initialValues ?? null);
      } finally {
        if (alive) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => { alive = false; };
  }, [open, reset, workspaceId, initialValues]);

  if (!open) return null;

  const progress = ((step + 1) / 2) * 100;

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const addTimeSlot = () => {
    const start = slotStart.trim();
    const end = slotEnd.trim();

    if (!start || !end) {
      toast.error("Vui lòng chọn cả thời gian bắt đầu và kết thúc");
      return;
    }
    if (start >= end) {
      toast.error("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
      return;
    }

    const slot = `${start}-${end}`;
    if (timeSlots.includes(slot)) {
      toast.info("Khung giờ này đã được thêm");
      return;
    }

    setTimeSlots((current) => [...current, slot]);
    setSlotStart("");
    setSlotEnd("");
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isEditMode && step === 0) {
      setStep(1);
      return;
    }
    if (selectedDays.length < 1) {
      toast.error("Vui lòng chọn ít nhất 1 ngày trong tuần");
      return;
    }
    if (timeSlots.length < 1) {
      toast.error("Vui lòng thêm ít nhất 1 khung giờ học");
      return;
    }

    const payload: OnboardingPayload = {
      targetGoal: values.targetGoal.trim(),
      studyHoursPerWeek: values.studyHoursPerWeek,
      targetDeadline: values.targetDeadline.trim(),
      confidence: values.confidence,
      preferredDays: selectedDays,
      preferredTimeSlots: timeSlots,
    };

    try {
      await upsertOnboardingProfile(workspaceId, payload);
      toast.success("Lưu lộ trình thành công");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi lưu lộ trình");
    }
  });

  const handleNextStep = async () => {
    const valid = await trigger(["targetGoal", "studyHoursPerWeek", "targetDeadline", "confidence"]);
    if (valid) setStep(1);
  };

  const goBack = () => setStep(0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-slate-100 bg-[#F8FAFC] shadow-2xl">
        {/* Modal Header */}
        <div className="border-b border-slate-100 bg-white px-6 py-5">
          <div className="h-1 w-full bg-gradient-to-r from-[#FF6B00] to-amber-500 absolute top-0 left-0 right-0" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B00]">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                {isEditMode ? "Quick Configuration" : "SkillSprint Onboarding Pipeline"}
              </div>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                {isEditMode ? "Chỉnh sửa cấu hình học tập" : "Thiết lập lộ trình học cá nhân"}
              </h3>
              {!isEditMode && (
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
                  Hoàn thiện các thông tin cơ bản để hệ thống AI đề xuất nhịp học, lịch biểu và khung giờ tối ưu nhất.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 cursor-pointer shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isEditMode && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>{step === 0 ? "Bước 1: Mục tiêu & Mức độ tự tin" : "Bước 2: Phân bổ lịch học biểu"}</span>
                <span className="font-mono text-xs font-bold text-[#FF6B00]">{step + 1}/2</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loadingProfile ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white gap-3 text-slate-400 text-sm">
              <Loader2 className="h-6 w-6 React-spin text-[#FF6B00] animate-spin" />
              <span>Đang đồng bộ dữ liệu lộ trình...</span>
            </div>
          ) : (
            <form id="onboarding-form" onSubmit={onSubmit} className="space-y-5 pb-20">
              {/* STEP 0 OR EDIT MODE */}
              {(isEditMode || step === 0) && (
                <section className="space-y-5">
                  {/* Learning Goal */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                          <Target className="h-4 w-4 text-[#FF6B00]" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mục tiêu học tập của bạn</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono">{targetGoalValue.length}/2000</span>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        {...register("targetGoal")}
                        rows={5}
                        maxLength={2000}
                        placeholder="Ví dụ: Đạt chứng chỉ FE nâng cao, làm chủ kiến thức nền tảng trong tài liệu và hoàn thành project thực tế..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/5 placeholder:text-slate-400"
                      />
                    </div>
                    {errors.targetGoal && <p className="text-xs font-semibold text-rose-500">{errors.targetGoal.message}</p>}
                  </div>

                  {/* Hours & Timeline */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                        <BookOpen className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thời gian & Hạn định</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Số giờ học cam kết / tuần</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={40}
                            {...register("studyHoursPerWeek", { valueAsNumber: true })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/5"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-400">
                            giờ/tuần
                          </span>
                        </div>
                        {errors.studyHoursPerWeek && (
                          <p className="text-xs font-semibold text-rose-500">{errors.studyHoursPerWeek.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Ngày hoàn thành đích (Tùy chọn)</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={targetDeadlineValue ?? ""}
                            onChange={(e) => setValue("targetDeadline", e.target.value, { shouldDirty: true })}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/5"
                          />
                          {targetDeadlineValue && (
                            <button
                              type="button"
                              onClick={() => setValue("targetDeadline", "", { shouldDirty: true })}
                              className="rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer shadow-sm"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Levels */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                        <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mức độ tự tin hiện tại</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {confidenceOptions.map((option) => (
                        <ConfidenceCard
                          key={option.value}
                          active={currentConfidence === option.value}
                          title={option.title}
                          description={option.description}
                          onClick={() => setValue("confidence", option.value, { shouldValidate: true, shouldDirty: true })}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 1 OR EDIT MODE */}
              {(isEditMode || step === 1) && (
                <section className="space-y-5">
                  {/* Preferred Days */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                          <Calendar className="h-4 w-4 text-[#FF6B00]" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ngày học ưu tiên</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Chọn tối thiểu 1 ngày</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((day) => (
                        <DayChip
                          key={day.value}
                          label={day.label}
                          active={selectedDays.includes(day.value)}
                          onClick={() => toggleDay(day.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Selection */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                        <Clock3 className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Khung thời gian rảnh</span>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] items-end">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Giờ bắt đầu</label>
                        <input
                          type="time"
                          value={slotStart}
                          onChange={(e) => setSlotStart(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#FF6B00]"
                        />
                      </div>
                      <div className="hidden h-9 items-center justify-center text-slate-400 font-bold sm:flex">→</div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Giờ kết thúc</label>
                        <input
                          type="time"
                          value={slotEnd}
                          onChange={(e) => setSlotEnd(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#FF6B00]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-50 px-4 text-xs font-extrabold text-orange-700 border border-orange-100 hover:bg-orange-100 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        Thêm khung giờ
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {timeSlots.length === 0 ? (
                        <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-xs font-semibold text-slate-400">
                          Chưa có khung giờ cụ thể nào được cấu hình bổ sung.
                        </div>
                      ) : (
                        timeSlots.map((slot, index) => (
                          <TimeSlotTag
                            key={`time-badge-${index}`}
                            label={slot.replace('-', ' - ')}
                            onRemove={() => setTimeSlots((current) => current.filter((item) => item !== slot))}
                          />
                        ))
                      )}
                    </div>

                    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 text-xs leading-relaxed text-orange-800 font-medium">
                      💡 <b>Hệ thống AI thông minh:</b> SkillSprint sẽ dựa trên phân bổ ngày học và các khoảng trống ưu tiên này để xếp lịch, nhắc nhở tiến độ học một cách khoa học nhất cho bạn.
                    </div>
                  </div>
                </section>
              )}
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-3">
            {isEditMode ? (
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loadingProfile}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="onboarding-form"
                  disabled={isSubmitting || loadingProfile}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/10 hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0 || loadingProfile}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                    step === 0 || loadingProfile
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer shadow-sm"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Quay lại
                </button>

                {step === 0 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loadingProfile}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/10 hover:bg-orange-600 transition cursor-pointer"
                  >
                    Tiếp theo
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="onboarding-form"
                    disabled={isSubmitting || loadingProfile}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/10 hover:from-orange-600 hover:to-amber-600 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                    Hoàn thành thiết lập
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}