import { Calendar, Clock, User } from "lucide-react";
import type { Appointment } from "@/types";
import { formatDate, formatTime, friendlyDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/utils/constants";

interface AppointmentCardProps {
  appointment: Appointment;
  role: "patient" | "provider";
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export default function AppointmentCard({
  appointment,
  role,
  onCancel,
  onReschedule,
}: AppointmentCardProps) {
  const statusColor = STATUS_COLORS[appointment.status] || STATUS_COLORS.pending;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* Doctor / Patient name */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">
              {role === "patient"
                ? appointment.provider?.user?.fullName || "Doctor"
                : appointment.patient?.fullName || "Patient"}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{friendlyDate(appointment.appointmentDate)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", statusColor)}>
          {appointment.status.replace("_", " ")}
        </span>
      </div>

      {/* Visit reason */}
      {appointment.visitReason && (
        <p className="mt-3 text-sm text-gray-500">
          <span className="font-medium">Reason:</span> {appointment.visitReason}
        </p>
      )}

      {/* Actions */}
      {(appointment.status === "confirmed" || appointment.status === "pending") && (
        <div className="mt-4 flex gap-2">
          {onReschedule && (
            <button
              onClick={() => onReschedule(appointment.id)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reschedule
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
