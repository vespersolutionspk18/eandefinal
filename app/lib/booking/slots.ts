// ============================================================================
// AVAILABILITY ENGINE (server-side source of truth)
// ----------------------------------------------------------------------------
// Pure functions: given "now", the central booking configuration and the busy
// ranges reported by the calendar provider, they produce the bookable slots.
// The browser only ever renders what these functions return — it can never make
// a slot valid by asking for it.
// ============================================================================

import { BOOKING_CONFIG, isWeekdayAllowed, timeToMinutes, type BookingConfig } from './config';
import {
  addDaysToDateKey,
  dateKeyAndMinutesToInstant,
  dateKeyInTimeZone,
  diffInDays,
  formatNoticeWindow,
  isValidDateKey,
  minutesOfDayInTimeZone,
  toZonedIsoString,
  utcOffsetString,
  weekdayOfDateKey,
} from './time';
import type { AvailabilityDay, AvailabilitySlot } from './types';

export type BusyRange = { start: Date; end: Date };
export type CalendarSlot = { start: Date; end: Date };

export type SlotWindow = {
  /** First allowed start, minutes past local midnight. */
  firstStartMinutes: number;
  /** Last allowed start, minutes past local midnight. */
  lastStartMinutes: number;
  /** Every allowed start offset from the opening time. */
  starts: number[];
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Sunday, Monday, Tuesday, Wednesday and Thursday" — derived from config. */
export function formatAllowedWeekdays(config: BookingConfig = BOOKING_CONFIG): string {
  const names = [...config.allowedWeekdays].sort((a, b) => a - b).map((day) => WEEKDAY_NAMES[day]);
  if (names.length === 0) return 'no days';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The appointment grid: every start time of the day that can hold a full
 * appointment before closing time. 09:00 → 20:00 with 60-minute appointments
 * and a 60-minute interval produces 09:00 … 19:00 (the last one ends at 20:00).
 */
export function getSlotWindow(config: BookingConfig = BOOKING_CONFIG): SlotWindow {
  const open = timeToMinutes(config.openingTime);
  const close = timeToMinutes(config.closingTime);
  const duration = config.appointmentDurationMinutes;
  const interval = config.slotIntervalMinutes;
  const starts: number[] = [];
  for (let start = open; start + duration <= close; start += interval) starts.push(start);
  return {
    firstStartMinutes: starts.length > 0 ? starts[0] : open,
    lastStartMinutes: starts.length > 0 ? starts[starts.length - 1] : close - duration,
    starts,
  };
}

/** All appointment instants for one calendar day (skips DST-gap times). */
export function generateDaySlots(dateKey: string, config: BookingConfig = BOOKING_CONFIG): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  for (const minutes of getSlotWindow(config).starts) {
    const start = dateKeyAndMinutesToInstant(dateKey, minutes, config.timezone);
    if (!start) continue; // local time does not exist (spring-forward)
    slots.push({ start, end: new Date(start.getTime() + config.appointmentDurationMinutes * 60_000) });
  }
  return slots;
}

export function rangesOverlap(range: BusyRange, start: Date, end: Date): boolean {
  return range.start.getTime() < end.getTime() && range.end.getTime() > start.getTime();
}

export function isSlotBusy(busyRanges: readonly BusyRange[], start: Date, end: Date): boolean {
  return busyRanges.some((range) => rangesOverlap(range, start, end));
}

/**
 * Horizon end date: the last calendar date that can be booked.
 *
 * `bookingHorizonDays` is the *number* of days offered (e.g. 30), so the last
 * date is today + (horizon - 1).  Both the UI and the API use the same end
 * date, so a slot the API accepts is always one the UI has offered.
 */
export function getHorizonEndDateKey(now: Date, config: BookingConfig = BOOKING_CONFIG): string {
  return addDaysToDateKey(dateKeyInTimeZone(now, config.timezone), config.bookingHorizonDays - 1);
}

export const SLOT_TAKEN_REASON = 'That time was just booked. Please choose another available time.';
const UNAVAILABLE_REASON = 'That time is not available.';

export type SlotRejectionCode = 'slot_unavailable' | 'slot_taken';

export type SlotEvaluation =
  | { ok: true; start: Date; end: Date; dateKey: string; localStart: string; localEnd: string }
  | { ok: false; code: SlotRejectionCode; message: string };

/**
 * Verifies the shape of a submitted start time BEFORE rule validation: it must
 * be an offset-qualified ISO instant (`2026-09-29T15:00:00-07:00`) and the
 * offset must match the booking time zone at that instant. This stops a client
 * from sending a wall-clock time with the wrong offset (for example a fixed
 * UTC-8 in summer) and silently getting a different appointment.
 */
export function parseRequestedStart(
  raw: unknown,
  config: BookingConfig = BOOKING_CONFIG,
): { ok: true; start: Date } | { ok: false; message: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, message: 'Choose an appointment time.' };
  }
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return { ok: false, message: 'Choose an appointment time.' };
  }

  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return { ok: false, message: 'Choose an appointment time.' };

  const submitted = value.endsWith('Z') ? '+00:00' : value.slice(-6);
  if (submitted !== utcOffsetString(start, config.timezone)) {
    return { ok: false, message: 'Choose an appointment time.' };
  }
  return { ok: true, start };
}

/**
 * Server-side validation of one requested appointment instant against every
 * business rule: grid alignment, allowed weekday, business hours, booking
 * horizon, minimum notice and existing reservations.
 */
export function evaluateSlotRequest(input: {
  start: Date;
  now: Date;
  config?: BookingConfig;
  busyRanges?: readonly BusyRange[];
}): SlotEvaluation {
  const config = input.config ?? BOOKING_CONFIG;
  const { start, now } = input;
  const busyRanges = input.busyRanges ?? [];

  if (Number.isNaN(start.getTime()) || start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0) {
    return { ok: false, code: 'slot_unavailable', message: UNAVAILABLE_REASON };
  }

  const dateKey = dateKeyInTimeZone(start, config.timezone);
  const weekday = weekdayOfDateKey(dateKey);

  if (!getSlotWindow(config).starts.includes(minutesOfDayInTimeZone(start, config.timezone))) {
    return { ok: false, code: 'slot_unavailable', message: UNAVAILABLE_REASON };
  }

  if (!isWeekdayAllowed(weekday, config)) {
    return {
      ok: false,
      code: 'slot_unavailable',
      message: `Estimate appointments are available ${formatAllowedWeekdays(config)}.`,
    };
  }

  if (start.getTime() < now.getTime()) {
    return { ok: false, code: 'slot_unavailable', message: 'That time has already passed.' };
  }

  if (diffInDays(dateKey, getHorizonEndDateKey(now, config)) < 0) {
    return {
      ok: false,
      code: 'slot_unavailable',
      message: `Appointments can be booked up to ${config.bookingHorizonDays} days ahead.`,
    };
  }

  if (start.getTime() < now.getTime() + config.minimumNoticeMinutes * 60_000) {
    return {
      ok: false,
      code: 'slot_unavailable',
      message: `Appointments need at least ${formatNoticeWindow(config.minimumNoticeMinutes)} notice.`,
    };
  }

  const end = new Date(start.getTime() + config.appointmentDurationMinutes * 60_000);
  if (isSlotBusy(busyRanges, start, end)) {
    return { ok: false, code: 'slot_taken', message: SLOT_TAKEN_REASON };
  }

  return {
    ok: true,
    start,
    end,
    dateKey,
    localStart: toZonedIsoString(start, config.timezone),
    localEnd: toZonedIsoString(end, config.timezone),
  };
}

export type AvailabilityInput = {
  now: Date;
  config?: BookingConfig;
  busyRanges?: readonly BusyRange[];
  /** First date to report (defaults to today in the booking time zone). */
  fromDateKey?: string;
  /** How many days to report (clamped to the booking horizon). */
  days?: number;
};

/**
 * Builds the availability window. Only allowed weekdays are returned, and a day
 * is kept even when it has no slots left so the UI can say "no times available"
 * instead of showing a misleading gap. Friday and Saturday are never returned.
 */
export function computeAvailability(input: AvailabilityInput): AvailabilityDay[] {
  const config = input.config ?? BOOKING_CONFIG;
  const { now } = input;
  const busyRanges = input.busyRanges ?? [];

  const todayKey = dateKeyInTimeZone(now, config.timezone);
  const horizonEndKey = getHorizonEndDateKey(now, config);
  const requestedFrom = input.fromDateKey && isValidDateKey(input.fromDateKey) ? input.fromDateKey : todayKey;
  const startKey = requestedFrom < todayKey ? todayKey : requestedFrom;

  const requestedDays = Math.min(
    Math.max(Math.trunc(input.days ?? config.bookingHorizonDays), 1),
    config.bookingHorizonDays,
  );
  const daysAvailable = diffInDays(startKey, horizonEndKey) + 1;
  const totalDays = Math.max(0, Math.min(requestedDays, daysAvailable));
  const earliestAllowed = now.getTime() + config.minimumNoticeMinutes * 60_000;

  const days: AvailabilityDay[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const dateKey = addDaysToDateKey(startKey, offset);
    const weekday = weekdayOfDateKey(dateKey);
    if (!isWeekdayAllowed(weekday, config)) continue;

    const slots: AvailabilitySlot[] = [];
    for (const slot of generateDaySlots(dateKey, config)) {
      if (slot.start.getTime() < earliestAllowed) continue;
      if (isSlotBusy(busyRanges, slot.start, slot.end)) continue;
      slots.push({
        start: toZonedIsoString(slot.start, config.timezone),
        end: toZonedIsoString(slot.end, config.timezone),
      });
    }

    days.push({ date: dateKey, weekday, slots });
  }
  return days;
}

