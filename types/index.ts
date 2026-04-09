// ============================================================
// Domain Types — Application-level types used across the codebase
// ============================================================

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  avatarUrl?: string;
  role: "patient" | "provider" | "admin";
  emailVerified: boolean;
  isActive: boolean;
}

export interface Provider {
  id: string;
  userId: string;
  specialtyId: string;
  specialtyName?: string;
  licenseNumber: string;
  bio?: string;
  yearsOfExperience: number;
  consultationFee: number;
  clinicName?: string;
  clinicAddress?: string;
  city: string;
  ratingAvg: number;
  totalReviews: number;
  slotDuration: number;
  isVerified: boolean;
  user?: User;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  visitReason?: string;
  cancellationReason?: string;
  cancelledBy?: "patient" | "provider" | "admin";
  patient?: User;
  provider?: Provider;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  rating: number;
  comment?: string;
  providerResponse?: string;
  createdAt: string;
  patient?: User;
}

export interface Specialty {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
