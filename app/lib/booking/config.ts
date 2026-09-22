// ============================================================================
// BOOKING CONFIGURATION — single source of truth for all scheduling rules.
// ----------------------------------------------------------------------------
// Change business hours, allowed days, appointment length, notice window or the
// booking horizon HERE. Nothing in the booking flow (UI, API, services, tests)
// hard-codes these values.
//
//  * `timezone` is an IANA time zone, so daylight saving time is handled
//    automatically (never a fixed UTC offset).
//  * `allowedWeekdays` uses JavaScript semantics: 0 = Sunday … 6 = Saturday.
//    0–4 = Sunday through Thursday (bookings are closed Friday and Saturday).
//  * The last possible appointment start is
//      closingTime − appointmentDurationMinutes
//    so with 09:00–20:00 and 60 minute appointments the final start is 19:00.
// ============================================================================

export type BookingConfig = {
  /** IANA time zone all business scheduling happens in. */
  timezone: string;
  /** Weekdays (0 = Sunday) that accept appointments. */
  allowedWeekdays: readonly number[];
  /** First appointment start time of the day, local wall clock, "HH:MM". */
  openingTime: string;
  /** The day is over at this local time; appointments must end by then. */
  closingTime: string;
  /** Length of a single estimate appointment, in minutes. */
  appointmentDurationMinutes: number;
  /** Grid the appointment starts are aligned to, in minutes. */
  slotIntervalMinutes: number;
  /** How many days into the future appointments may be booked. */
  bookingHorizonDays: number;
  /** Earliest lead time: appointments inside this window are never offered. */
  minimumNoticeMinutes: number;
};

export const BOOKING_CONFIG = {
  timezone: 'America/Los_Angeles',
  allowedWeekdays: [0, 1, 2, 3, 4],
  openingTime: '09:00',
  closingTime: '20:00',
  appointmentDurationMinutes: 60,
  slotIntervalMinutes: 60,
  bookingHorizonDays: 30,
  minimumNoticeMinutes: 120,
} satisfies BookingConfig;

/** Human label shown next to the slot picker ("Times shown in Pacific Time"). */
export const BOOKING_TIMEZONE_LABEL = 'Pacific Time';

/** Start of the horizon window is always "today" in the booking time zone. */

/** Converts "HH:MM" into minutes past local midnight. */
export function timeToMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid time string: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** True when the weekday (0 = Sunday) accepts appointments. */
export function isWeekdayAllowed(weekday: number, config: BookingConfig = BOOKING_CONFIG): boolean {
  return config.allowedWeekdays.includes(weekday);
}

// ---------------------------------------------------------------------------
// Service / project types offered in Step 1 of the booking flow. These mirror
// the service categories used across the site (`app/lib/services.ts`):
// bathroom, kitchen, whole-home, ADU, landscaping.
// `id` doubles as the `?service=` slug used by ad landing links, e.g.
//   /book-estimate?service=kitchen
// ---------------------------------------------------------------------------
export const BOOKING_SERVICE_TYPES = [
  { id: 'kitchen', label: 'Kitchen Remodeling', href: '/kitchen-remodeling' },
  { id: 'bathroom', label: 'Bathroom Remodeling', href: '/bathroom-remodeling' },
  { id: 'whole-home', label: 'Whole-Home Remodeling', href: '/whole-home-remodeling' },
  { id: 'adu', label: 'ADU / Garage Conversion', href: '/adu-garage-conversion' },
  { id: 'landscaping', label: 'Landscaping', href: '/landscaping' },
  { id: 'other', label: 'Other', href: null },
] as const;

export type BookingServiceType = (typeof BOOKING_SERVICE_TYPES)[number];
export type BookingServiceTypeId = BookingServiceType['id'];
export type BookingServiceTypeLabel = BookingServiceType['label'];

export const BOOKING_SERVICE_TYPE_LABELS: readonly string[] = BOOKING_SERVICE_TYPES.map((s) => s.label);

/** Resolves a service type from its id (`kitchen`) or label (`Kitchen Remodeling`). */
export function resolveServiceType(value: string | null | undefined): BookingServiceType | null {
  if (!value) return null;
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    BOOKING_SERVICE_TYPES.find((s) => s.id === needle) ??
    BOOKING_SERVICE_TYPES.find((s) => s.label.toLowerCase() === needle) ??
    null
  );
}
