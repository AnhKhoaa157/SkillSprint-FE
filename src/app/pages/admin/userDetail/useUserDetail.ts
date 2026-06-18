import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminUserService, {
  type AdminUserDetail,
  type SubscriptionAdminResponse,
} from "../../../../api/admin/adminUserService";
import { getSubscriptionPlans } from "../../../../api/admin/adminSubscriptionPlansService";

/* -------------------------------------------------------------------------- */
/*  Form model.                                                               */
/* -------------------------------------------------------------------------- */

export type ActionKey = "status" | "role" | "plan";
type FormState = Record<ActionKey, string>;

const EMPTY_FORM: FormState = { status: "", role: "LEARNER", plan: "FREE" };

/** Derive the form's "server" baseline from a loaded user (used for dirty checks + reset). */
function serverValues(user: AdminUserDetail): FormState {
  return {
    status: user.status ?? "",
    role: user.role ? String(user.role).toUpperCase() : "LEARNER",
    plan: user.currentSubscription?.planType ?? "FREE",
  };
}

/** Flatten the nested subscription response into the flat shape the UI consumes. */
function normalizeSubscription(resp: any, planType: string): SubscriptionAdminResponse {
  return {
    subscriptionId: resp.subscriptionId,
    planName: resp.plan?.planName || "Hệ Thống Admin",
    planType,
    startDate: resp.startDate || resp.startAt,
    endDate: planType === "ADMIN_DEFAULT" ? null : resp.endDate || resp.endAt,
    status: resp.status,
    badgeColor: resp.plan?.badgeColor,
    badgeIcon: resp.plan?.badgeIcon,
    animationType: resp.plan?.animationType,
  };
}

/**
 * One descriptor per admin action — replaces three near-identical save handlers.
 * `run` performs the mutation; `merge` folds the response back into local state.
 */
const ACTIONS: Record<
  ActionKey,
  {
    run: (id: string, value: string) => Promise<any>;
    merge: (prev: AdminUserDetail, resp: any, value: string) => AdminUserDetail;
    successMsg: string;
    errorMsg: string;
  }
> = {
  status: {
    run: (id, value) => adminUserService.updateUserStatus(id, { status: value as any }),
    merge: (_prev, resp) => resp,
    successMsg: "Cập nhật trạng thái thành công",
    errorMsg: "Lỗi cập nhật trạng thái",
  },
  role: {
    run: (id, value) => adminUserService.updateUserRole(id, { role: value }),
    merge: (_prev, resp) => resp,
    successMsg: "Cập nhật vai trò thành công",
    errorMsg: "Lỗi cập nhật vai trò",
  },
  plan: {
    run: (id, value) => adminUserService.updateUserSubscription(id, { planType: value as any }),
    merge: (prev, resp, value) => ({ ...prev, currentSubscription: normalizeSubscription(resp, value) }),
    successMsg: "Phát gói dịch vụ mới cho thành viên thành công!",
    errorMsg: "Lỗi khi cập nhật gói đăng ký",
  },
};

export type ViewState = "invalid" | "loading" | "error" | "empty" | "ready";

/* -------------------------------------------------------------------------- */
/*  Hook.                                                                     */
/* -------------------------------------------------------------------------- */

export function useAdminUserDetail(id: string | undefined) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [savingKey, setSavingKey] = useState<ActionKey | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reload = useCallback(() => setReloadTrigger((prev) => prev + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(null);

    adminUserService
      .getAdminUser(id)
      .then((data) => {
        if (!active) return;
        setUser(data);
        setForm(serverValues(data));
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setLoadError(err?.message || "Không thể tải thông tin người dùng");
        toast.error("Không thể tải thông tin người dùng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getSubscriptionPlans()
      .then((p) => {
        if (active) setPlans(p);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [id, reloadTrigger]);

  useEffect(() => {
    const handlePlansUpdated = () => {
      reload();
    };
    window.addEventListener("subscription-plans-updated", handlePlansUpdated);
    return () => {
      window.removeEventListener("subscription-plans-updated", handlePlansUpdated);
    };
  }, [reload]);

  const dirty = useMemo<Record<ActionKey, boolean>>(() => {
    const base = user ? serverValues(user) : EMPTY_FORM;
    return {
      status: form.status !== base.status,
      role: form.role !== base.role,
      plan: form.plan !== base.plan,
    };
  }, [user, form]);

  const setField = useCallback((key: ActionKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(
    async (key: ActionKey) => {
      if (!id || !user || savingKey) return;
      const action = ACTIONS[key];
      try {
        setSavingKey(key);
        const resp = await action.run(id, form[key]);
        setUser((prev) => (prev ? action.merge(prev, resp, form[key]) : prev));
        toast.success(action.successMsg);
      } catch (e: any) {
        toast.error(e?.message || action.errorMsg);
      } finally {
        setSavingKey(null);
      }
    },
    [id, user, form, savingKey],
  );

  const viewState: ViewState = !id
    ? "invalid"
    : loading && !user
      ? "loading"
      : loadError && !user
        ? "error"
        : !user
          ? "empty"
          : "ready";

  return { user, plans, viewState, loadError, form, dirty, setField, save, savingKey };
}
