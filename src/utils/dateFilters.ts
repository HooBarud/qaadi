import { TimeFilter, DateRange } from "../types";

export type DateRangePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all";

/**
 * Safely parse a date string (YYYY-MM-DD or ISO timestamp) into year, month (0-indexed), date
 * without timezone boundary shift bugs.
 */
function parseLocalDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1,
      day: parseInt(match[3], 10),
    };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

/**
 * Check if a date string falls inside the selected filter.
 */
export function isDateInFilter(dateStr: string, filter: TimeFilter, customRange?: DateRange): boolean {
  if (!dateStr) return false;
  if (filter === "all") return true;

  const parts = parseLocalDateParts(dateStr);
  if (!parts) return false;

  const itemDate = new Date(parts.year, parts.month, parts.day, 12, 0, 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const startOfToday = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
  const endOfToday = new Date(currentYear, currentMonth, currentDay, 23, 59, 59, 999);

  if (filter === "today") {
    return itemDate >= startOfToday && itemDate <= endOfToday;
  }

  if (filter === "week") {
    // Week starting from Monday
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentYear, currentMonth, currentDay + diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return itemDate >= monday && itemDate <= sunday;
  }

  if (filter === "month") {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return itemDate >= firstDayOfMonth && itemDate <= lastDayOfMonth;
  }

  if (filter === "3months") {
    // Current month and preceding 2 months (3 full calendar months)
    const startOfThreeMonths = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0, 0);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return itemDate >= startOfThreeMonths && itemDate <= endOfCurrentMonth;
  }

  if (filter === "6months") {
    // Current month and preceding 5 months (6 full calendar months)
    const startOfSixMonths = new Date(currentYear, currentMonth - 5, 1, 0, 0, 0, 0);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return itemDate >= startOfSixMonths && itemDate <= endOfCurrentMonth;
  }

  if (filter === "year") {
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    return itemDate >= startOfYear && itemDate <= endOfYear;
  }

  if (filter === "custom" && customRange?.startDate && customRange?.endDate) {
    const startParts = parseLocalDateParts(customRange.startDate);
    const endParts = parseLocalDateParts(customRange.endDate);
    if (!startParts || !endParts) return true;

    const start = new Date(startParts.year, startParts.month, startParts.day, 0, 0, 0, 0);
    const end = new Date(endParts.year, endParts.month, endParts.day, 23, 59, 59, 999);
    return itemDate >= start && itemDate <= end;
  }

  return true;
}

export function filterByDateRange<T extends { date: string }>(items: T[], preset: DateRangePreset): T[] {
  let tf: TimeFilter = "all";
  if (preset === "today") tf = "today";
  else if (preset === "this_week") tf = "week";
  else if (preset === "this_month") tf = "month";
  else if (preset === "last_3_months") tf = "3months";
  else if (preset === "last_6_months") tf = "6months";
  else if (preset === "this_year") tf = "year";

  return items.filter((item) => isDateInFilter(item.date, tf));
}

export function formatTimeFilterLabel(filter: TimeFilter): string {
  switch (filter) {
    case "today":
      return "Maanta (Today)";
    case "week":
      return "Toddobaadkan (This Week)";
    case "month":
      return "Bishan (This Month)";
    case "3months":
      return "3 Bilood (3 Months)";
    case "6months":
      return "6 Bilood (6 Months)";
    case "year":
      return "Sannadkan (This Year)";
    case "all":
      return "Dhammaan (All Time)";
    case "custom":
      return "Custom (Taariikh Cayiman)";
  }
}
