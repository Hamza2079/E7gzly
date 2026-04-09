import { supabase } from "@/lib/supabase/client";

/**
 * Appointment service — CRUD operations for appointments.
 */
export const appointmentService = {
  async getAppointments(userId: string, role: "patient" | "provider", status?: string) {
    const column = role === "patient" ? "patient_id" : "provider_id";
    let query = supabase
      .from("appointments")
      .select("*, providers(*, users(*), specialties(*))")
      .eq(column, userId)
      .order("appointment_date", { ascending: true });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getAppointmentById(id: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, providers(*, users(*)), users(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async bookAppointment(payload: {
    patientId: string;
    providerId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    visitReason?: string;
  }) {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: payload.patientId,
        provider_id: payload.providerId,
        appointment_date: payload.appointmentDate,
        start_time: payload.startTime,
        end_time: payload.endTime,
        status: "confirmed",
        visit_reason: payload.visitReason || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelAppointment(id: string, reason: string, cancelledBy: "patient" | "provider") {
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeAppointment(id: string) {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
