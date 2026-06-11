/**
 * Date Service
 * 
 * Backend Endpoint (sau này):
 * GET /api/current-date
 * Response: { date: "2026-05-06", timestamp: 1715000000 }
 */

/**
 * Mock: Lấy ngày từ server (hiện tại dùng client ngày, sau thay backend)
 * TODO: Thay bằng real API khi có backend
 */
export const getCurrentDateFromServer = async (): Promise<Date> => {
  try {
    // 🔧 PRODUCTION: Uncomment dòng dưới để dùng backend
    // import { API_BASE } from "./config";
    // const response = await fetch(`${API_BASE}/api/current-date`);
    // const data = await response.json();
    // return new Date(data.date);

    // Lúc này: Mock từ client
    return new Date();
  } catch (error) {
    console.error("Error fetching current date:", error);
    return new Date(); // Fallback: ngày máy user
  }
};

/**
 * Lấy ngày bắt đầu tháng hiện tại từ server
 */
export const getMonthStartDate = async (): Promise<Date> => {
  const currentDate = await getCurrentDateFromServer();
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
};

/**
 * Lấy ngày cuối tháng hiện tại từ server
 */
export const getMonthEndDate = async (): Promise<Date> => {
  const currentDate = await getCurrentDateFromServer();
  return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
};

/**
 * Format ngày theo Vietnamese locale
 */
export const formatDateVN = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
};

/**
 * Format ngày theo pattern YYYY-MM-DD
 */
export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
