// ============================================================================
// CALENDAR PROVIDER ABSTRACTION
// ----------------------------------------------------------------------------
// Everything the booking flow needs from a scheduling backend:
//
//   getBusyRanges(start, end)      → read  (blocks slots in the website UI)
//   createBookingEvent(booking)    → write (puts the appointment on the calendar)
//   cancelBookingEvent(eventId)    → write (removes it again)
//
// `LocalCalendarProvider` implements this with our own Postgres rows (works
// today, no Google credentials). `GoogleCalendarProvider` implements the same
// interface against Google Calendar and is enabled purely by configuration, so
// swapping providers changes nothing in the UI, the API or the booking service.
// ============================================================================

import type { BusyRange } from './slots';

/** Everything needed to describe the appointment to a calendar backend. */
export type CalendarEventPayload = {
  bookingId: string;
  serviceType: string;
  fullName: string;
  /** E.164, e.g. "+18055900908". */
  phone: string;
  address: string;
  start: Date;
  end: Date;
  timezone: string;
  source: string | null;
  campaign: string | null;
};

export type CalendarEventResult = {
  /** Provider name, e.g. "local" or "google". */
  provider: string;
  /** Event id to store on the booking (null when the provider has no event ids). */
  eventId: string | null;
  /** Optional link for internal use. Never rendered to the customer. */
  htmlLink: string | null;
};

export interface CalendarProvider {
  readonly name: string;
  /** Busy periods that must not be offered to customers. */
  getBusyRanges(start: Date, end: Date): Promise<BusyRange[]>;
  /** Called AFTER the slot has been claimed in the database. */
  createBookingEvent(payload: CalendarEventPayload): Promise<CalendarEventResult>;
  /** Removes an event again (cancellation / compensation). */
  cancelBookingEvent?(eventId: string): Promise<void>;
}

export class CalendarProviderError extends Error {
  readonly retryable: boolean;

  constructor(message: string, options: { retryable?: boolean; cause?: unknown } = {}) {
    super(message);
    this.name = 'CalendarProviderError';
    this.retryable = options.retryable ?? false;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}
