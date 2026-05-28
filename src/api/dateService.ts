export const getCurrentDateFromServer = async (): Promise<Date> => {
  return new Date();
};

export const getMonthStartDate = async (): Promise<Date> => {
  const currentDate = await getCurrentDateFromServer();
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
};

export const getMonthEndDate = async (): Promise<Date> => {
  const currentDate = await getCurrentDateFromServer();
  return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
};

export const formatDateVN = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
};

export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default { getCurrentDateFromServer, getMonthStartDate, getMonthEndDate, formatDateVN, formatDateISO };