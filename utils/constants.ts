// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = "E7gzly";
export const APP_DESCRIPTION = "Book medical appointments online — fast, easy, reliable.";

export const APPOINTMENT_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  NO_SHOW: "no_show",
} as const;

export const SLOT_DURATIONS = [15, 20, 30, 45, 60] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
  no_show: "bg-gray-100 text-gray-800",
};
