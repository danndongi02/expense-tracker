import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateShort(date: Date): string {
  return format(date, "MMM d");
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMM yyyy");
}

export function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function formatWeekKey(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function formatDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: now,
  };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getLastNMonths(n: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(subMonths(now, n - 1)),
    end: now,
  };
}

export function isInDateRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  return isWithinInterval(date, { start, end });
}

export { parseISO, format, startOfMonth, endOfMonth, startOfWeek, subMonths };
