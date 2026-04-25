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
  isVerified: boolean;
  user?: User;
}

// ============================================================
// Queue System Types
// ============================================================

export interface DoctorSchedule {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakStart?: string;
  breakEnd?: string;
  maxActive: number;
  queueWindow: number;
  gracePeriod: number; // minutes
  isActive: boolean;
}

export type QueueStatus = "open" | "paused" | "closed" | "completed";

export interface Queue {
  id: string;
  providerId: string;
  scheduleId?: string;
  date: string;
  status: QueueStatus;
  currentNumber: number;
  currentServing?: number;
  avgDuration: number;
  adminOverride: boolean;
  startedAt: string;
  pausedAt?: string;
  closedAt?: string;
  breakUntil?: string;
  delayMinutes: number;
  doctorMessage?: string;
  sessionToken?: string;
  sessionExpiresAt?: string;
  // Joined relations
  provider?: Provider;
  schedule?: DoctorSchedule;
}

export type QueueEntryStatus =
  | "ready"
  | "not_ready"
  | "called"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

export type TravelCategory = "here" | "nearby" | "medium" | "far" | "very_far";

export const TRAVEL_DURATIONS: Record<TravelCategory, number> = {
  here: 0,
  nearby: 10,
  medium: 20,
  far: 40,
  very_far: 50,
};

export interface QueueEntry {
  id: string;
  queueId: string;
  patientId: string;
  queueNumber: number;
  status: QueueEntryStatus;
  joinedAt: string;
  calledAt?: string;
  graceDeadline?: string;
  completedAt?: string;
  visitReason?: string;
  travelCategory: TravelCategory;
  notifiedAt?: string;
  source: "app" | "walk_in" | "reception";
  reinsertedFrom?: string;
  patientEta?: string;
  patientMessage?: string;
  isPatientCheckedIn: boolean;
  lastReadyAt: string | null;
  deferCount: number;
  travelUpdatedAt?: string;
  // Joined relations
  patient?: User;
  queue?: Queue;
}

export interface QueueHistory {
  id: string;
  queueId: string;
  totalPatients: number;
  totalServed: number;
  totalNoShows: number;
  totalCancelled: number;
  avgWaitTime?: number;
  avgConsultation?: number;
  createdAt: string;
}

// ============================================================
// Computed / View Types (not stored, calculated at runtime)
// ============================================================

/** What the patient sees on the queue status page */
export interface QueueStatusView {
  queueId: string;
  status: QueueStatus;
  currentServing?: number;
  waitingCount: number;
  activeCount: number;
  maxActive: number;
  estimatedWait: number; // minutes
  remainingWorkMinutes: number;
  closesAt: string; // "17:00"
  breakEnd?: string; // "13:00" (if currently on break)
  canJoin: boolean;
  canJoinReason?: string; // why they can't join
  breakUntil?: string;
  delayMinutes: number;
  doctorMessage?: string;
}

/** What the patient sees on their ticket */
export interface QueueTicketView {
  entry: QueueEntry;
  position: number;
  estimatedWait: number;
  isInWindow: boolean;
  graceRemaining?: number; // seconds, only when status = 'called'
}

// ============================================================
// Shared Types
// ============================================================

export interface Specialty {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
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
