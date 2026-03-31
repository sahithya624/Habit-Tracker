import { endOfWeek, format, startOfWeek, subDays } from "date-fns";

export const formatDate = (date, fmt = "MMM d, yyyy") => format(new Date(date), fmt);

export const getTodayISO = () => format(new Date(), "yyyy-MM-dd");

export const getLastNDaysISO = (days) => {
  const end = new Date();
  const start = subDays(end, days - 1);
  return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") };
};

export const getCurrentWeekRange = () => {
  const now = new Date();
  return {
    weekStart: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    weekEnd: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
};
