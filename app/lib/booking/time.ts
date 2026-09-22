// ============================================================================
// TIMEZONE-AWARE DATE/TIME HELPERS
// ----------------------------------------------------------------------------
// All booking rules are evaluated in the IANA time zone from BOOKING_CONFIG
// (America/Los_Angeles). Everything here is built on `Intl.DateTimeFormat`,
// which is timezone + daylight-saving aware in both Node and the browser, so
// there is no manual (and fragile) fixed-offset arithmetic anywhere.
//
// Isomorphic on purpose: the server (availability engine, booking service) and
// the client (slot labels) import the same functions and get identical results.
// ============================================================================

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type ZonedParts = {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday, as observed in the time zone. */
  weekday: number;
};

export type DateKeyParts = { year: number; month: number; day: number };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function cachedFormatter(key: string, build: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const created = build();
  formatterCache.set(key, created);
  return created;
}

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  return cachedFormatter(`parts:${timeZone}`, () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );
}

export function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

/** Breaks an instant into wall-clock parts as observed in `timeZone`. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') lookup[part.type] = part.value;
  }
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
    weekday: WEEKDAY_INDEX[lookup.weekday ?? 'Sun'] ?? 0,
  };
}

/**
 * Offset of `timeZone` at `date`, in milliseconds
 * (America/Los_Angeles → -28_800_000 for PST, -25_200_000 for PDT).
 */
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const instant = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
  return asIfUtc - instant;
}

/**
 * Converts a local wall-clock time in `timeZone` into a UTC instant.
 * Returns `null` for times that do not exist (the spring-forward DST gap) so
 * callers can reject them instead of silently shifting the appointment.
 * Ambiguous times (the fall-back hour) resolve to the first occurrence.
 */
export function zonedTimeToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date | null {
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const firstGuess = new Date(asIfUtc - getTimeZoneOffsetMs(new Date(asIfUtc), timeZone));
  const refined = new Date(asIfUtc - getTimeZoneOffsetMs(firstGuess, timeZone));

  const check = getZonedParts(refined, timeZone);
  if (
    check.year !== parts.year ||
    check.month !== parts.month ||
    check.day !== parts.day ||
    check.hour !== parts.hour ||
    check.minute !== parts.minute
  ) {
    return null; // nonexistent local time (DST gap)
  }
  return refined;
}

/** `"2026-09-29"` — the calendar date as observed in `timeZone`. */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Minutes past local midnight for an instant, in `timeZone`. */
export function minutesOfDayInTimeZone(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function parseDateKey(key: string): DateKeyParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function dateKeyFromUtcDate(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** UTC midnight representation of a calendar date (safe for weekday math). */
export function dateKeyToUtcDate(key: string): Date {
  const parsed = parseDateKey(key);
  if (!parsed) throw new Error(`Invalid date key: ${key}`);
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const parsed = parseDateKey(key);
  if (!parsed) return false;
  // Rejects impossible calendar dates such as 2026-02-31.
  return dateKeyFromUtcDate(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))) === key;
}

export function addDaysToDateKey(key: string, days: number): string {
  return dateKeyFromUtcDate(new Date(dateKeyToUtcDate(key).getTime() + days * MS_PER_DAY));
}

export function diffInDays(fromKey: string, toKey: string): number {
  return Math.round((dateKeyToUtcDate(toKey).getTime() - dateKeyToUtcDate(fromKey).getTime()) / MS_PER_DAY);
}

/** 0 = Sunday … 6 = Saturday for a calendar date key. */
export function weekdayOfDateKey(key: string): number {
  return dateKeyToUtcDate(key).getUTCDay();
}

/** `"-07:00"` / `"-08:00"` for the given instant in `timeZone`. */
export function utcOffsetString(date: Date, timeZone: string): string {
  const offsetMs = getTimeZoneOffsetMs(date, timeZone);
  const sign = offsetMs < 0 ? '-' : '+';
  const totalMinutes = Math.abs(Math.round(offsetMs / MS_PER_MINUTE));
  return `${sign}${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/**
 * Instant as an offset-qualified ISO string in `timeZone`, e.g.
 * `"2026-09-29T15:00:00-07:00"`. This is the wire format used by the
 * availability API and by booking payloads.
 */
export function toZonedIsoString(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${utcOffsetString(date, timeZone)}`;
}

/** Always-UTC ISO string, used for database storage. */
export function toUtcIsoString(date: Date): string {
  return date.toISOString();
}

/** Combines a date key + minutes past midnight into an instant, or null in a DST gap. */
export function dateKeyAndMinutesToInstant(
  dateKey: string,
  minutesPastMidnight: number,
  timeZone: string,
): Date | null {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  if (minutesPastMidnight < 0 || minutesPastMidnight > 23 * 60 + 59) return null;
  return zonedTimeToUtc(
    {
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      hour: Math.floor(minutesPastMidnight / 60),
      minute: minutesPastMidnight % 60,
    },
    timeZone,
  );
}

/** `"3:00 PM"` for an instant, rendered in `timeZone`. */
export function formatTimeLabel(date: Date, timeZone: string): string {
  const formatter = cachedFormatter(`time:${timeZone}`, () =>
    new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }),
  );
  return formatter.format(date).replace(/\u202f/g, ' ');
}

/** `"3:00 PM – 4:00 PM"`. */
export function formatTimeRange(start: Date, end: Date, timeZone: string): string {
  return `${formatTimeLabel(start, timeZone)} \u2013 ${formatTimeLabel(end, timeZone)}`;
}

/** `"Tuesday, September 29"` for a calendar date key. */
export function formatDayLabel(key: string): string {
  const formatter = cachedFormatter('dayLabel', () =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }),
  );
  return formatter.format(dateKeyToUtcDate(key));
}

/** `"Tuesday, September 29, 2026"`. */
export function formatFullDateLabel(key: string): string {
  const formatter = cachedFormatter('fullDayLabel', () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  );
  return formatter.format(dateKeyToUtcDate(key));
}

/** Compact label pieces used by the mobile day carousel. */
export function formatDayParts(key: string): { weekday: string; month: string; day: string } {
  const date = dateKeyToUtcDate(key);
  const weekday = cachedFormatter('wdShort', () =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }),
  ).format(date);
  const month = cachedFormatter('moShort', () =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }),
  ).format(date);
  return { weekday, month, day: String(date.getUTCDate()) };
}

/** `"2 hours"` / `"30 minutes"` — used in validation copy. */
export function formatNoticeWindow(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${minutes} minutes`;
}

