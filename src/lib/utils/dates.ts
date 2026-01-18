import {
  format,
  formatDistanceToNow,
  addDays,
  differenceInDays,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function calculateEndDate(startDate: string | Date, durationDays: number): Date {
  const d = typeof startDate === "string" ? parseISO(startDate) : startDate;
  return addDays(d, durationDays);
}

export function daysUntilExpiration(endDate: string | Date): number {
  const d = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return differenceInDays(d, new Date());
}

export function isExpired(endDate: string | Date): boolean {
  const d = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return isBefore(d, startOfDay(new Date()));
}

export function isExpiringSoon(endDate: string | Date, daysThreshold: number = 7): boolean {
  const d = typeof endDate === "string" ? parseISO(endDate) : endDate;
  const now = new Date();
  const threshold = addDays(now, daysThreshold);
  return isAfter(d, now) && isBefore(d, threshold);
}

export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

export function getDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}
