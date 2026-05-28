import { useEffect, useState } from "react";
import { getCurrentDateFromServer } from "../../api/dateService";

/**
 * Hook để lấy ngày từ server
 * Auto-sync khi thay đổi
 */
export const useCurrentDate = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDate = async () => {
      try {
        setLoading(true);
        const date = await getCurrentDateFromServer();
        setCurrentDate(date);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setCurrentDate(new Date()); // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchDate();

    // Optional: Refresh mỗi phút để đảm bảo ngày luôn đúng
    const interval = setInterval(fetchDate, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentDate,
    day: currentDate.getDate(),
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    loading,
    error,
  };
};
