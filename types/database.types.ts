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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["providers"]["Row"], "id" | "rating_avg" | "total_reviews" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["providers"]["Insert"]>;
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
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          provider_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show";
          visit_reason: string | null;
          cancellation_reason: string | null;
          cancelled_by: "patient" | "provider" | "admin" | null;
          rescheduled_from: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      availability: {
        Row: {
          id: string;
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["availability"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["availability"]["Insert"]>;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
