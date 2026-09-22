// ============================================================================
// PUBLIC BOOKING CONTRACT TYPES
// ----------------------------------------------------------------------------
// Shared by the API routes (server) and the booking UI (client). These are the
// only shapes that cross the network boundary.
// ============================================================================

import type { BookingServiceTypeId } from './config';

export type { BookingServiceTypeId };

/** A bookable appointment. `start`/`end` are offset-qualified ISO strings. */
export type AvailabilitySlot = {
  start: string;
  end: string;
};

/** One calendar day of the booking window. */
export type AvailabilityDay = {
  /** `"2026-09-27"` in the booking time zone. */
  date: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  slots: AvailabilitySlot[];
};

/** Response body of `GET /api/booking/availability`. */
export type AvailabilityResponse = {
  timezone: string;
  timezoneLabel: string;
  generatedAt: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  horizonDays: number;
  dates: AvailabilityDay[];
};

/** Everything the customer needs to see on the confirmation screen. */
export type BookingConfirmation = {
  status: 'confirmed';
  start: string;
  end: string;
  timezone: string;
  timezoneLabel: string;
  fullName: string;
  phone: string;
  address: string;
  serviceType: string;
};

/** Keys the client is allowed to send. Everything else is ignored. */
export type BookingRequestPayload = {
  fullName: string;
  phone: string;
  address: string;
  serviceType: BookingServiceTypeId | string;
  /** Offset-qualified ISO instant, e.g. `"2026-09-29T15:00:00-07:00"`. */
  startTime: string;
  /** Attribution / ad markers (optional). */
  source?: string;
  campaign?: string;
  attribution?: Record<string, string>;
  /** Idempotency key so a retried request cannot create a second booking. */
  requestId?: string;
};

export type ApiErrorCode =
  | 'validation_error'
  | 'slot_unavailable'
  | 'slot_taken'
  | 'rate_limited'
  | 'not_configured'
  | 'calendar_error'
  | 'server_error';

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Per-field messages for form feedback (`fullName`, `phone`, …, `startTime`). */
    fields?: Record<string, string>;
  };
};

export type BookingSuccessBody = {
  booking: BookingConfirmation;
};

/** Message shown when another visitor claims the slot first. */
export const SLOT_TAKEN_MESSAGE = 'That time was just booked. Please choose another available time.';
