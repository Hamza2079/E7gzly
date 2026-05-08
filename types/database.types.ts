export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _archived_appointments: {
        Row: {
          appointment_date: string
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          end_time: string
          id: string
          patient_id: string
          provider_id: string
          rescheduled_from: string | null
          start_time: string
          status: string
          updated_at: string | null
          visit_reason: string | null
        }
        Insert: {
          appointment_date: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          patient_id: string
          provider_id: string
          rescheduled_from?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          visit_reason?: string | null
        }
        Update: {
          appointment_date?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          patient_id?: string
          provider_id?: string
          rescheduled_from?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "_archived_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      _archived_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          provider_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          provider_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          provider_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          provider_id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          provider_id: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          provider_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          day_of_week: number
          end_time: string
          grace_period: number
          id: string
          is_active: boolean
          max_active: number
          provider_id: string
          queue_window: number
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          grace_period?: number
          id?: string
          is_active?: boolean
          max_active?: number
          provider_id: string
          queue_window?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          grace_period?: number
          id?: string
          is_active?: boolean
          max_active?: number
          provider_id?: string
          queue_window?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_favorites: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          provider_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_favorites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          bio: string | null
          city: string
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee: number
          created_at: string | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          license_number: string
          longitude: number | null
          rating_avg: number | null
          rejection_reason: string | null
          slot_duration: number | null
          specialty_id: string
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          city: string
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee: number
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_number: string
          longitude?: number | null
          rating_avg?: number | null
          rejection_reason?: string | null
          slot_duration?: number | null
          specialty_id: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          city?: string
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee?: number
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_number?: string
          longitude?: number | null
          rating_avg?: number | null
          rejection_reason?: string | null
          slot_duration?: number | null
          specialty_id?: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_day_limits: {
        Row: {
          advance_days: number
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean
          max_reservations: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          advance_days?: number
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean
          max_reservations?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          advance_days?: number
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          max_reservations?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_day_limits_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_entries: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          defer_count: number
          grace_deadline: string | null
          id: string
          is_checked_in: boolean
          joined_at: string
          last_ready_at: string | null
          notified_at: string | null
          patient_eta: string | null
          patient_id: string
          patient_message: string | null
          queue_id: string
          queue_number: number
          reinserted_from: string | null
          source: string
          status: string
          travel_category: string
          travel_updated_at: string | null
          visit_reason: string | null
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          defer_count?: number
          grace_deadline?: string | null
          id?: string
          is_checked_in?: boolean
          joined_at?: string
          last_ready_at?: string | null
          notified_at?: string | null
          patient_eta?: string | null
          patient_id: string
          patient_message?: string | null
          queue_id: string
          queue_number: number
          reinserted_from?: string | null
          source?: string
          status?: string
          travel_category?: string
          travel_updated_at?: string | null
          visit_reason?: string | null
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          defer_count?: number
          grace_deadline?: string | null
          id?: string
          is_checked_in?: boolean
          joined_at?: string
          last_ready_at?: string | null
          notified_at?: string | null
          patient_eta?: string | null
          patient_id?: string
          patient_message?: string | null
          queue_id?: string
          queue_number?: number
          reinserted_from?: string | null
          source?: string
          status?: string
          travel_category?: string
          travel_updated_at?: string | null
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_reinserted_from_fkey"
            columns: ["reinserted_from"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_entry_services: {
        Row: {
          assigned_at: string
          assigned_by: string
          entry_id: string
          id: string
          price_override: number | null
          quantity: number
          service_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          entry_id: string
          id?: string
          price_override?: number | null
          quantity?: number
          service_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          entry_id?: string
          id?: string
          price_override?: number | null
          quantity?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entry_services_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entry_services_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entry_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_history: {
        Row: {
          avg_consultation: number | null
          avg_wait_time: number | null
          created_at: string
          id: string
          queue_id: string
          total_cancelled: number
          total_no_shows: number
          total_patients: number
          total_served: number
        }
        Insert: {
          avg_consultation?: number | null
          avg_wait_time?: number | null
          created_at?: string
          id?: string
          queue_id: string
          total_cancelled?: number
          total_no_shows?: number
          total_patients?: number
          total_served?: number
        }
        Update: {
          avg_consultation?: number | null
          avg_wait_time?: number | null
          created_at?: string
          id?: string
          queue_id?: string
          total_cancelled?: number
          total_no_shows?: number
          total_patients?: number
          total_served?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: true
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_reservations: {
        Row: {
          cancelled_at: string | null
          converted_entry_id: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          provider_id: string
          reservation_number: number
          reserved_date: string
          status: string
          updated_at: string
          visit_reason: string | null
        }
        Insert: {
          cancelled_at?: string | null
          converted_entry_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          provider_id: string
          reservation_number: number
          reserved_date: string
          status?: string
          updated_at?: string
          visit_reason?: string | null
        }
        Update: {
          cancelled_at?: string | null
          converted_entry_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          reservation_number?: number
          reserved_date?: string
          status?: string
          updated_at?: string
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_reservations_converted_entry_id_fkey"
            columns: ["converted_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_reservations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_reservations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          admin_override: boolean
          avg_duration: number
          break_until: string | null
          closed_at: string | null
          created_at: string
          current_number: number
          current_serving: number | null
          date: string
          delay_minutes: number
          doctor_message: string | null
          id: string
          paused_at: string | null
          provider_id: string
          schedule_id: string | null
          session_expires_at: string | null
          session_token: string | null
          started_at: string
          status: string
        }
        Insert: {
          admin_override?: boolean
          avg_duration?: number
          break_until?: string | null
          closed_at?: string | null
          created_at?: string
          current_number?: number
          current_serving?: number | null
          date: string
          delay_minutes?: number
          doctor_message?: string | null
          id?: string
          paused_at?: string | null
          provider_id: string
          schedule_id?: string | null
          session_expires_at?: string | null
          session_token?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          admin_override?: boolean
          avg_duration?: number
          break_until?: string | null
          closed_at?: string | null
          created_at?: string
          current_number?: number
          current_serving?: number | null
          date?: string
          delay_minutes?: number
          doctor_message?: string | null
          id?: string
          paused_at?: string | null
          provider_id?: string
          schedule_id?: string | null
          session_expires_at?: string | null
          session_token?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queues_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "doctor_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          patient_id: string
          provider_id: string | null
          provider_response: string | null
          queue_entry_id: string | null
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          patient_id: string
          provider_id?: string | null
          provider_response?: string | null
          queue_entry_id?: string | null
          rating: number
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          patient_id?: string
          provider_id?: string | null
          provider_response?: string | null
          queue_entry_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "_archived_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_queue_entry_id_fkey"
            columns: ["queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          estimated_duration: number
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          price: number
          provider_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_duration?: number
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          price?: number
          provider_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_duration?: number
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          price?: number
          provider_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          profile_completed: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          gender?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      visit_notes: {
        Row: {
          chief_complaint: string | null
          created_at: string
          entry_id: string
          follow_up_instructions: string | null
          id: string
          internal_notes: string | null
          patient_id: string
          prescription: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          chief_complaint?: string | null
          created_at?: string
          entry_id: string
          follow_up_instructions?: string | null
          id?: string
          internal_notes?: string | null
          patient_id: string
          prescription?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          chief_complaint?: string | null
          created_at?: string
          entry_id?: string
          follow_up_instructions?: string | null
          id?: string
          internal_notes?: string | null
          patient_id?: string
          prescription?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      patient_visit_summaries: {
        Row: {
          created_at: string | null
          entry_id: string | null
          follow_up_instructions: string | null
          id: string | null
          patient_id: string | null
          prescription: string | null
          provider_id: string | null
          services: Json | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_queue_owner: { Args: { p_queue_id: string }; Returns: boolean }
      remaining_work_minutes: {
        Args: { p_provider_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
