import { API_BASE } from "./config";

export async function probeHealth(): Promise<{ status: string; service?: string; timestamp?: string }> {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Health check returned non-JSON response');
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Failed to parse health JSON');
  }

  if (!data || typeof data !== 'object' || !('status' in data)) {
    throw new Error('Invalid health payload');
  }

  return data;
}

type HealthStatus = 'unknown' | 'up' | 'down';

let currentStatus: HealthStatus = 'unknown';
let intervalId: number | null = null;
const subscribers = new Set<(s: HealthStatus) => void>();

async function updateOnce() {
  try {
    await probeHealth();
    if (currentStatus !== 'up') {
      currentStatus = 'up';
      subscribers.forEach((cb) => cb(currentStatus));
    }
  } catch (e) {
    if (currentStatus !== 'down') {
      currentStatus = 'down';
      subscribers.forEach((cb) => cb(currentStatus));
    }
  }
}

function startPolling() {
  if (intervalId != null) return;
  // run immediately and then every 30s
  updateOnce();
  intervalId = window.setInterval(updateOnce, 30000) as unknown as number;
}

function stopPollingIfUnused() {
  if (subscribers.size === 0 && intervalId != null) {
    clearInterval(intervalId as unknown as number);
    intervalId = null;
    currentStatus = 'unknown';
  }
}

export function subscribeHealth(cb: (s: HealthStatus) => void): () => void {
  subscribers.add(cb);
  // notify immediately with current value
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
