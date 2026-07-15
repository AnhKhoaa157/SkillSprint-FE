const COMPLETED_TASK_STATUSES = new Set(["COMPLETED", "DONE"]);

export function isCompletedTaskStatus(status: string | null | undefined): boolean {
  return COMPLETED_TASK_STATUSES.has(String(status ?? "").trim().toUpperCase());
}
