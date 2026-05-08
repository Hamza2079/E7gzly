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

// ============================================================
// Feature 1 — Future Reservations
// ============================================================

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "converted"
  | "cancelled"
  | "no_show";

export interface QueueDayLimit {
  id: string;
  providerId: string;
  dayOfWeek: number;
  maxReservations: number;
  advanceDays: number;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  providerId: string;
  patientId: string;
  reservedDate: string;     // "YYYY-MM-DD"
  reservationNumber: number;
  status: ReservationStatus;
  visitReason?: string;
  notes?: string;
  convertedEntryId?: string;
  cancelledAt?: string;
  createdAt: string;
  // Joined
  patient?: User;
}

/** What a patient sees when browsing upcoming available days */
export interface DayAvailability {
  date: string;             // "YYYY-MM-DD"
  dayOfWeek: number;
  scheduleStart: string;    // "09:00"
  scheduleEnd: string;      // "17:00"
  reservationCount: number;
  maxReservations: number;
  isFull: boolean;
  crowdLevel: "low" | "moderate" | "high" | "full";
  myReservation?: Reservation; // set if the current user already reserved this day
}

// ============================================================
// Feature 2 — Doctor Services & Billing
// ============================================================

export interface Service {
  id: string;
  providerId: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  estimatedDuration: number; // minutes
  isActive: boolean;
  sortOrder: number;
}

export interface EntryService {
  id: string;
  entryId: string;
  serviceId: string;
  quantity: number;
  priceOverride?: number;
  assignedAt: string;
  assignedBy: string;
  // Resolved from join
  service?: Service;
  effectivePrice: number;  // priceOverride ?? service.price
  subtotal: number;        // effectivePrice * quantity
}

// ============================================================
// Feature 3 — Visit Notes (Internal + Patient Summary)
// ============================================================

/** Full note — only accessible by the provider */
export interface VisitNote {
  id: string;
  entryId: string;
  patientId: string;
  providerId: string;
  chiefComplaint?: string;
  internalNotes?: string;
  prescription?: string;
  followUpInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

/** Patient-visible summary — served via patient_visit_summaries view */
export interface PatientVisitSummary {
  id: string;
  entryId: string;
  patientId: string;
  providerId: string;
  prescription?: string;
  followUpInstructions?: string;
  createdAt: string;
  services: Array<{
    nameAr: string;
    nameEn?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalAmount: number;
}

