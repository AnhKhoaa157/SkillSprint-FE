import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { getAuthToken, getSessionId } from "./apiClient";
import { API_BASE } from "./config";

export type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
  path?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export const skillSprintApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

skillSprintApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("session-kickout-triggered"));
    }
    // Extract the backend's error message from the response body if available
    const backendMessage: string | undefined = error.response?.data?.message;
    if (backendMessage) {
      // Wrap it in an Error so catch blocks can read err.message
      const wrapped = new Error(backendMessage);
      (wrapped as any).status = error.response?.status;
      (wrapped as any).originalError = error;
      return Promise.reject(wrapped);
    }
    return Promise.reject(error);
  },
);

skillSprintApiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const sessionId = getSessionId();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;

    // Only set X-Session-Id to the real sessionId, never to a JWT.
    // The backend SingleSessionFilter validates this against Redis.
    if (sessionId) {
      config.headers["X-Session-Id"] = sessionId;
    }
  }

  return config;
});

export function extractApiData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const payload = response.data;
  if (payload?.data === null || payload?.data === undefined) {
    throw new Error(payload?.message || "Empty response payload");
  }

  return payload.data;
}

export function getApiMessage<T>(response: AxiosResponse<ApiResponse<T>>): string {
  return response.data?.message || "Success";
}
