type HealthStatus = "unknown" | "up" | "down";

let currentStatus: HealthStatus = "unknown";
let intervalId: number | null = null;
const subscribers = new Set<(status: HealthStatus) => void>();

export async function probeHealth(): Promise<{ status: string; service?: string; timestamp?: string }> {
  return {
    status: "up",
    service: "skillsprint-prototype-mock",
    timestamp: new Date().toISOString(),
  };
}

async function updateOnce() {
  try {
    await probeHealth();
    if (currentStatus !== "up") {
      currentStatus = "up";
      subscribers.forEach((cb) => cb(currentStatus));
    }
  } catch {
    if (currentStatus !== "down") {
      currentStatus = "down";
      subscribers.forEach((cb) => cb(currentStatus));
    }
  }
}

function startPolling() {
  if (intervalId != null) {
    return;
  }

  void updateOnce();
  intervalId = window.setInterval(updateOnce, 30000) as unknown as number;
}

function stopPollingIfUnused() {
  if (subscribers.size === 0 && intervalId != null) {
    window.clearInterval(intervalId as unknown as number);
    intervalId = null;
    currentStatus = "unknown";
  }
}

export function subscribeHealth(cb: (status: HealthStatus) => void): () => void {
  subscribers.add(cb);
  cb(currentStatus);
  startPolling();

  return () => {
    subscribers.delete(cb);
    stopPollingIfUnused();
  };
}

export function getCurrentHealth(): HealthStatus {
  return currentStatus;
}

export default { probeHealth, subscribeHealth, getCurrentHealth };