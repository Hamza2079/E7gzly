import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Receptionist link stays valid while the day's queue is still in progress — closing the queue must not revoke it (only explicit end-session or expiry does). */
export function receptionistQueueAllowsOperations(status: string | null | undefined): boolean {
  return status === "open" || status === "closed" || status === "paused"
}
