import { z } from "zod";

export const bookAppointmentSchema = z.object({
  providerId: z.string().uuid("Invalid provider ID"),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  visitReason: z.string().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500),
});

export const rescheduleAppointmentSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

export type BookAppointmentData = z.infer<typeof bookAppointmentSchema>;
export type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentData = z.infer<typeof rescheduleAppointmentSchema>;
