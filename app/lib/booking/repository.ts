// ============================================================================
// BOOKING REPOSITORY CONTRACT
// ----------------------------------------------------------------------------
// The booking service depends on this interface, never on Postgres directly.
// `postgres-repository.ts` is the production implementation,
// `memory-repository.ts` is used by unit tests and local dev without a database.
// ============================================================================

import type { BookingAttribution } from './attribution';

export type BookingStatus = 'confirmed' | 'cancelled';

export type BookingRecord = {
  id: string;
  fullName: string;
  /** E.164, e.g. "+18055900908". */
  phone: string;
  address: string;
  serviceType: string;
  /** Appointment start (UTC). */
  startTime: Date;
  /** Appointment end (UTC). */
  endTime: Date;
  /** Slot identity: UTC ISO start instant, unique per active booking. */
  slotKey: string;
  timezone: string;
  status: BookingStatus;
  /** Google Calendar event id, filled in once the event exists. */
  googleEventId: string | null;
  source: string | null;
  campaign: string | null;
  attribution: BookingAttribution;
  requestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewBooking = {
  fullName: string;
  phone: string;
  address: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  slotKey: string;
  timezone: string;
  status?: BookingStatus;
  source?: string | null;
  campaign?: string | null;
  attribution?: BookingAttribution;
  requestId?: string | null;
};

export type BookingRange = { from: Date; to: Date };

export type BookingRepository = {
  /** Human-readable backend name, used in logs. */
  readonly name: string;

  /**
   * Active (non-cancelled) bookings overlapping `[from, to)`.
   * Used to build busy ranges for the availability engine.
   */
  listActiveInRange(range: BookingRange): Promise<BookingRecord[]>;

  /**
   * Atomically claims the slot and stores the booking.
   * Throws `SlotTakenError` when another booking already owns that slot.
   * Returns the existing booking when `requestId` was already used.
   */
  create(booking: NewBooking): Promise<BookingRecord>;

  findById(id: string): Promise<BookingRecord | null>;
  findByRequestId(requestId: string): Promise<BookingRecord | null>;
  /** Releases the slot. Returns null when the booking does not exist. */
  cancel(id: string): Promise<BookingRecord | null>;
  /** Stores the Google Calendar event id created after the slot was claimed. */
  setGoogleEventId(id: string, googleEventId: string | null): Promise<void>;
};

/** Thrown when a slot is already taken (mapped to HTTP 409). */
export class SlotTakenError extends Error {
  readonly slotKey: string;

  constructor(slotKey: string) {
    super(`The appointment slot ${slotKey} is already booked.`);
    this.name = 'SlotTakenError';
    this.slotKey = slotKey;
  }
}
