// ============================================================
// Database Types — Auto-generate from Supabase CLI in production:
//   npx supabase gen types typescript --linked > types/database.types.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          date_of_birth: string | null;
          gender: "male" | "female" | "other" | null;
          avatar_url: string | null;
          role: "patient" | "provider" | "admin";
          email_verified: boolean;
          is_active: boolean;
          auth_provider: string;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: "male" | "female" | "other" | null;
          avatar_url?: string | null;
          role?: "patient" | "provider" | "admin";
          email_verified?: boolean;
          is_active?: boolean;
          auth_provider?: string;
          profile_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          specialty_id: string;
          license_number: string;
          bio: string | null;
          years_of_experience: number;
          consultation_fee: number;
          clinic_name: string | null;
          clinic_address: string | null;
          city: string;
          latitude: number | null;
          longitude: number | null;
          rating_avg: number;
          total_reviews: number;
          slot_duration: number;
          is_verified: boolean;
          verification_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          specialty_id: string;
          license_number: string;
          bio?: string | null;
          years_of_experience?: number;
          consultation_fee?: number;
          clinic_name?: string | null;
          clinic_address?: string | null;
          city: string;
          latitude?: number | null;
          longitude?: number | null;
          slot_duration?: number;
          is_verified?: boolean;
          verification_status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["providers"]["Row"]>;
      };
      specialties: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["specialties"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["specialties"]["Insert"]>;
      };
      doctor_schedules: {
        Row: {
          id: string;
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start: string | null;
          break_end: string | null;
          max_active: number;
          queue_window: number;
          grace_period: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start?: string | null;
          break_end?: string | null;
          max_active?: number;
          queue_window?: number;
          grace_period?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_schedules"]["Row"]>;
      };
      queues: {
        Row: {
          id: string;
          provider_id: string;
          schedule_id: string | null;
          date: string;
          status: "open" | "paused" | "closed" | "completed";
          current_number: number;
          current_serving: number | null;
          avg_duration: number;
          admin_override: boolean;
          started_at: string;
          paused_at: string | null;
          closed_at: string | null;
          break_until: string | null;
          delay_minutes: number;
          doctor_message: string | null;
          created_at: string;
        };
        Insert: {
          provider_id: string;
          date: string;
          schedule_id?: string | null;
          status?: "open" | "paused" | "closed" | "completed";
          current_number?: number;
          current_serving?: number | null;
          avg_duration?: number;
          admin_override?: boolean;
          started_at?: string;
          paused_at?: string | null;
          closed_at?: string | null;
          break_until?: string | null;
          delay_minutes?: number;
          doctor_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["queues"]["Insert"]>;
      };
      queue_entries: {
        Row: {
          id: string;
          queue_id: string;
          patient_id: string;
          queue_number: number;
          status: "waiting" | "called" | "in_progress" | "completed" | "no_show" | "cancelled";
          joined_at: string;
          called_at: string | null;
          grace_deadline: string | null;
          completed_at: string | null;
          visit_reason: string | null;
          travel_category: "here" | "nearby" | "medium" | "far" | "very_far";
          notified_at: string | null;
          source: "app" | "walk_in" | "reinserted";
          reinserted_from: string | null;
          patient_eta: string | null;
          patient_message: string | null;
          is_checked_in: boolean;
          travel_updated_at: string | null;
          created_at: string;
        };
        Insert: {
          queue_id: string;
          patient_id: string;
          queue_number: number;
          status?: "waiting" | "called" | "in_progress" | "completed" | "no_show" | "cancelled";
          joined_at?: string;
          called_at?: string | null;
          grace_deadline?: string | null;
          completed_at?: string | null;
          visit_reason?: string | null;
          travel_category?: "here" | "nearby" | "medium" | "far" | "very_far";
          notified_at?: string | null;
          source?: "app" | "walk_in" | "reinserted";
          reinserted_from?: string | null;
          patient_eta?: string | null;
          patient_message?: string | null;
          is_checked_in?: boolean;
          travel_updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["queue_entries"]["Insert"]>;
      };
      queue_history: {
        Row: {
          id: string;
          queue_id: string;
          total_patients: number;
          total_served: number;
          total_no_shows: number;
          total_cancelled: number;
          avg_wait_time: number | null;
          avg_consultation: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["queue_history"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["queue_history"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          patient_id: string;
          provider_id: string;
          rating: number;
          comment: string | null;
          provider_response: string | null;
          is_visible: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_queue_owner: {
        Args: { p_queue_id: string };
        Returns: boolean;
      };
      remaining_work_minutes: {
        Args: { p_provider_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
}
