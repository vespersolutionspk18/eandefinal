// ============================================================================
// BOOKING SERVICE
// ----------------------------------------------------------------------------
// The single place that turns an HTTP payload into a confirmed appointment.
// Order of operations for POST /api/booking:
//
//   1. Validate + sanitize every customer field (server-side, never trusted).
//   2. Parse the requested instant and verify it is aligned to our own grid in
//      America/Los_Angeles (the client's end time / duration / weekday / zone
//      are ignored entirely).
//   3. Ask the calendar provider for current busy ranges and re-validate.
//   4. Atomically claim the slot in Postgres (the only step that can win a race).
//   5. Create the calendar event (Google when configured, no-op locally).
//   6. Compensate: cancel the claim if step 5 fails, so we never hold a slot
//      without a matching event.
// ============================================================================

import { BOOKING_CONFIG, BOOKING_TIMEZONE_LABEL } from './config';
import { buildAttribution, deriveCampaign, deriveSource, sanitizeAttribution } from './attribution';
import { sanitizeText, validateCustomerDetails } from './validation';
import {
  computeAvailability,
  evaluateSlotRequest,
  getHorizonEndDateKey,
  parseRequestedStart,
  SLOT_TAKEN_REASON,
  type BusyRange,
} from './slots';
import { CalendarProviderError, type CalendarProvider } from './calendar-provider';
import { sendOwnerBookingEmail } from './owner-email-notifier';
import { SlotTakenError, type BookingRecord, type BookingRepository } from './repository';
import { addDaysToDateKey, dateKeyAndMinutesToInstant, toZonedIsoString } from './time';
import type { ApiErrorCode, AvailabilityResponse, BookingConfirmation } from './types';

export type AvailabilityRequest = {
  now?: Date;
  fromDateKey?: string;
  days?: number;
};

export type CreateBookingContext = {
  now?: Date;
  /** Client-generated idempotency key so a retry cannot double-book. */
  requestId?: string | null;
};

export type CreateBookingSuccess = {
  ok: true;
  status: 200 | 201;
  booking: BookingConfirmation;
  record: BookingRecord;
};

export type CreateBookingFailure = {
  ok: false;
  status: 400 | 409 | 413 | 502 | 503;
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
};

export type CreateBookingResult = CreateBookingSuccess | CreateBookingFailure;

const MAX_REQUEST_ID_LENGTH = 64;

function sanitizeRequestId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, MAX_REQUEST_ID_LENGTH);
  return cleaned.length >= 8 ? cleaned : null;
}

function toConfirmation(record: BookingRecord): BookingConfirmation {
  return {
    status: 'confirmed',
    start: toZonedIsoString(record.startTime, record.timezone),
    end: toZonedIsoString(record.endTime, record.timezone),
    timezone: record.timezone,
    timezoneLabel: BOOKING_TIMEZONE_LABEL,
    fullName: record.fullName,
    phone: record.phone,
    address: record.address,
    serviceType: record.serviceType,
  };
}

export class BookingService {
  constructor(
    private readonly repository: BookingRepository,
    private readonly calendar: CalendarProvider,
  ) {}

  /**
   * Busy ranges for a window.
   * `degrade` keeps the booking page usable if an external calendar provider is
   * momentarily unreachable (booking itself is always `strict`).
   */
  private async busyRanges(range: { from: Date; to: Date }, mode: 'strict' | 'degrade'): Promise<BusyRange[]> {
    try {
      return await this.calendar.getBusyRanges(range.from, range.to);
    } catch (error) {
      if (mode === 'strict') throw error;
      console.error('[booking] calendar provider unavailable, using local bookings only:', error);
      const local = await this.repository.listActiveInRange(range);
      return local.map((booking) => ({ start: booking.startTime, end: booking.endTime }));
    }
  }

  /** Server-side availability — the only source the UI is allowed to render. */
  async getAvailability(request: AvailabilityRequest = {}): Promise<AvailabilityResponse> {
    const now = request.now ?? new Date();
    const days = Math.min(
      Math.max(request.days ?? BOOKING_CONFIG.bookingHorizonDays, 1),
      BOOKING_CONFIG.bookingHorizonDays,
    );

    // Read a little past the requested window so boundary days are complete.
    // `windowEnd` must be the START OF THE DAY AFTER the horizon's last date,
    // expressed in the booking time zone. A UTC midnight would fall in the
    // middle of that day locally (19:00 PDT is 02:00Z the next day), so the
    // final evening's busy ranges would be missed and an already-booked slot
    // would be advertised as free.
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const horizonEndKey = getHorizonEndDateKey(now, BOOKING_CONFIG);
    const windowEnd =
      dateKeyAndMinutesToInstant(
        addDaysToDateKey(horizonEndKey, 1),
        0,
        BOOKING_CONFIG.timezone,
      ) ?? new Date(now.getTime() + (BOOKING_CONFIG.bookingHorizonDays + 2) * 24 * 60 * 60 * 1000);

    const busyRanges = await this.busyRanges({ from: windowStart, to: windowEnd }, 'degrade');

    const dates = computeAvailability({
      now,
      config: BOOKING_CONFIG,
      busyRanges,
      fromDateKey: request.fromDateKey,
      days,
    });

    return {
      timezone: BOOKING_CONFIG.timezone,
      timezoneLabel: BOOKING_TIMEZONE_LABEL,
      generatedAt: now.toISOString(),
      durationMinutes: BOOKING_CONFIG.appointmentDurationMinutes,
      slotIntervalMinutes: BOOKING_CONFIG.slotIntervalMinutes,
      minimumNoticeMinutes: BOOKING_CONFIG.minimumNoticeMinutes,
      horizonDays: BOOKING_CONFIG.bookingHorizonDays,
      dates,
    };
  }

  /**
   * Creates the booking.
   * Returns a discriminated result; the route handler maps it to HTTP.
   */
  async createBooking(payload: unknown, context: CreateBookingContext = {}): Promise<CreateBookingResult> {
    const now = context.now ?? new Date();
    const raw = (payload ?? {}) as Record<string, unknown>;

    // 1. Customer details ---------------------------------------------------
    const details = validateCustomerDetails(raw);
    if (!details.ok) {
      return {
        ok: false,
        status: 400,
        code: 'validation_error',
        message: 'Please check the highlighted fields.',
        fields: details.errors,
      };
    }

    // 2. Requested instant (duration, end time, zone and weekday are OURS) ---
    const requested = parseRequestedStart(raw.startTime, BOOKING_CONFIG);
    if (!requested.ok) {
      return {
        ok: false,
        status: 400,
        code: 'validation_error',
        message: requested.message,
        fields: { startTime: requested.message },
      };
    }

    const requestId = sanitizeRequestId(context.requestId ?? raw.requestId);

    // Idempotency: a retried request returns its original booking.
    if (requestId) {
      const existing = await this.repository.findByRequestId(requestId);
      // Verify the phone matches so a guessed or stale requestId cannot leak
      // another customer's PII.
      if (existing && existing.phone === details.value.phone) {
        return { ok: true, status: 200, booking: toConfirmation(existing), record: existing };
      }
    }

    const attribution = buildAttribution({
      incoming: sanitizeAttribution(raw.attribution),
      referrerHost: typeof raw.referrerHost === 'string' ? raw.referrerHost : null,
    });
    const source = sanitizeText(raw.source, 60) || deriveSource(attribution);
    const campaign = sanitizeText(raw.campaign, 120) || deriveCampaign(attribution);

    // 3. Re-check availability against the live calendar ---------------------
    const dayStart = new Date(requested.start.getTime() - 24 * 60 * 60 * 1000);
    const dayEnd = new Date(requested.start.getTime() + 24 * 60 * 60 * 1000);

    let busyRanges: BusyRange[];
    try {
      busyRanges = await this.busyRanges({ from: dayStart, to: dayEnd }, 'strict');
    } catch (error) {
      const retryable = error instanceof CalendarProviderError ? error.retryable : true;
      console.error('[booking] availability re-check failed:', error);
      return {
        ok: false,
        status: 503,
        code: 'calendar_error',
        message: retryable
          ? 'We could not verify calendar availability just now. Please try again in a moment.'
          : 'We could not verify calendar availability. Please call us and we will book it for you.',
      };
    }

    const slot = evaluateSlotRequest({ start: requested.start, now, config: BOOKING_CONFIG, busyRanges });
    if (!slot.ok) {
      return {
        ok: false,
        status: slot.code === 'slot_taken' ? 409 : 400,
        code: slot.code === 'slot_taken' ? 'slot_taken' : 'slot_unavailable',
        message: slot.message,
        fields: slot.code === 'slot_taken' ? undefined : { startTime: slot.message },
      };
    }

    // 4. Atomically claim the slot ------------------------------------------
    let record: BookingRecord;
    try {
      record = await this.repository.create({
        fullName: details.value.fullName,
        phone: details.value.phone,
        address: details.value.address,
        serviceType: details.value.serviceType,
        startTime: slot.start,
        endTime: slot.end,
        slotKey: slot.start.toISOString(),
        timezone: BOOKING_CONFIG.timezone,
        status: 'confirmed',
        source,
        campaign,
        attribution,
        requestId,
      });
    } catch (error) {
      if (error instanceof SlotTakenError) {
        return { ok: false, status: 409, code: 'slot_taken', message: SLOT_TAKEN_REASON };
      }
      console.error('[booking] failed to store the booking:', error);
      return {
        ok: false,
        status: 503,
        code: 'server_error',
        message: 'We could not save your appointment. Please try again in a moment.',
      };
    }

    // 5. Calendar event (Google when configured) -----------------------------
    try {
      const event = await this.calendar.createBookingEvent({
        bookingId: record.id,
        serviceType: record.serviceType,
        fullName: record.fullName,
        phone: record.phone,
        address: record.address,
        start: record.startTime,
        end: record.endTime,
        timezone: record.timezone,
        source: record.source,
        campaign: record.campaign,
      });
      if (event.eventId) {
        record = { ...record, googleEventId: event.eventId };
        await this.repository.setGoogleEventId(record.id, event.eventId);
      }
    } catch (error) {
      // 6. Compensate: release the slot rather than hold it without an event.
      console.error('[booking] calendar event creation failed, releasing the slot:', error);
      await this.repository.cancel(record.id).catch((cancelError: unknown) => {
        console.error('[booking] could not release the claimed slot:', cancelError);
      });
      return {
        ok: false,
        status: 502,
        code: 'calendar_error',
        message: 'We could not finalize that appointment. Please try another time or call us.',
      };
    }

    // Owner email notifications are best-effort: a Resend outage should not
    // undo a booking that is already safely stored and on the calendar.
    await sendOwnerBookingEmail(record).catch((error: unknown) => {
      console.error('[booking] owner email notification failed:', error);
    });

    return { ok: true, status: 201, booking: toConfirmation(record), record };
  }
}

export { SLOT_TAKEN_REASON };

