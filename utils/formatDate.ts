import { format, parseISO, isToday, isTomorrow, isPast, addMinutes } from "date-fns";

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string, pattern = "MMM d, yyyy"): string {
  return format(parseISO(dateStr), pattern);
}

/**
 * Format time (HH:mm) for display.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Get a friendly date label (Today, Tomorrow, or formatted date).
 */
export function friendlyDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

/**
 * Check if a date+time is in the past.
 */
export function isAppointmentPast(dateStr: string, timeStr: string): boolean {
  const dateTime = parseISO(`${dateStr}T${timeStr}`);
  return isPast(dateTime);
}

/**
 * Calculate end time given a start time and duration in minutes.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date(2000, 0, 1, hours, minutes);
  const end = addMinutes(start, durationMinutes);
  return format(end, "HH:mm");
}
