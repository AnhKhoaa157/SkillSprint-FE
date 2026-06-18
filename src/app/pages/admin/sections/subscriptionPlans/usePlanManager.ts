import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getSubscriptionPlanAuditLogs,
  getSubscriptionPlans,
  type AdminAuditLogResponse,
  type ServicePlanResponse,
} from "../../../../../api/admin/adminSubscriptionPlansService";

/* -------------------------------------------------------------------------- */
/*  Plans data.                                                               */
/* -------------------------------------------------------------------------- */

export function usePlans() {
  const [plans, setPlans] = useState<ServicePlanResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await getSubscriptionPlans());
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách gói");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Insert a new plan or merge an updated one in place. */
  const upsert = useCallback((saved: ServicePlanResponse) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.planId === saved.planId);
      if (idx < 0) return [...prev, saved];
      const next = [...prev];
      next[idx] = { ...next[idx], ...saved };
      return next;
    });
  }, []);

  return { plans, loading, reload, upsert };
}

/* -------------------------------------------------------------------------- */
/*  Audit log (lazy-loaded the first time its tab is opened).                 */
/* -------------------------------------------------------------------------- */

export function useAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await getSubscriptionPlanAuditLogs());
      loadedRef.current = true;
    } catch (err) {
      toast.error((err as Error).message || "Không tải được nhật ký");
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureLoaded = useCallback(() => {
    if (!loadedRef.current) load();
  }, [load]);

  /** Mark stale so the next tab visit refetches (e.g. after a plan mutation). */
  const invalidate = useCallback(() => {
    loadedRef.current = false;
  }, []);

  const reload = useCallback(() => {
    loadedRef.current = false;
    load();
  }, [load]);

  return { logs, loading, ensureLoaded, invalidate, reload };
}

/* -------------------------------------------------------------------------- */
/*  Modal manager — one discriminated state replaces 9 boolean/plan flags.    */
/* -------------------------------------------------------------------------- */

export type PlanModal =
  | { type: "create" }
  | { type: "edit"; plan: ServicePlanResponse }
  | { type: "detail"; plan: ServicePlanResponse }
  | { type: "status"; plan: ServicePlanResponse }
  | { type: "features"; plan: ServicePlanResponse }
  | null;

export function useModal() {
  const [modal, setModal] = useState<PlanModal>(null);
  const close = useCallback(() => setModal(null), []);
  return { modal, setModal, close };
}
