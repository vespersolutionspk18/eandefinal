// ============================================================================
// TIME ZONE / DST TESTS (rules 13 + 14 from the booking spec)
// ----------------------------------------------------------------------------
// These tests exist to prove that scheduling is IANA-time-zone aware and that
// nothing in the system uses a fixed UTC offset: the same wall-clock slot must
// resolve to different UTC instants in winter and in summer.
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  addDaysToDateKey,
  dateKeyInTimeZone,
  diffInDays,
  formatDayLabel,
  formatDayParts,
  formatTimeLabel,
  getTimeZoneOffsetMs,
  isValidDateKey,
  minutesOfDayInTimeZone,
  toZonedIsoString,
  utcOffsetString,
  weekdayOfDateKey,
  zonedTimeToUtc,
} from '@/app/lib/booking/time';

const TZ = 'America/Los_Angeles';

describe('America/Los_Angeles offsets', () => {
  it('is PST (-08:00) in January and PDT (-07:00) in July', () => {
    expect(utcOffsetString(new Date('2026-01-15T20:00:00Z'), TZ)).toBe('-08:00');
    expect(utcOffsetString(new Date('2026-07-15T20:00:00Z'), TZ)).toBe('-07:00');
  });

  it('is never a fixed offset (DST is not hard-coded)', () => {
    const winter = getTimeZoneOffsetMs(new Date('2026-01-15T20:00:00Z'), TZ);
    const summer = getTimeZoneOffsetMs(new Date('2026-07-15T20:00:00Z'), TZ);
    expect(winter).toBe(-8 * 60 * 60 * 1000);
    expect(summer).toBe(-7 * 60 * 60 * 1000);
    expect(winter).not.toBe(summer);
  });

  it('switches offset on the 2026 spring-forward date (March 8)', () => {
    expect(utcOffsetString(new Date('2026-03-07T20:00:00Z'), TZ)).toBe('-08:00');
    expect(utcOffsetString(new Date('2026-03-09T20:00:00Z'), TZ)).toBe('-07:00');
  });
});

describe('zonedTimeToUtc', () => {
  it('maps 9:00 AM local to 17:00 UTC in winter and 16:00 UTC in summer', () => {
    const winter = zonedTimeToUtc({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 }, TZ);
    const summer = zonedTimeToUtc({ year: 2026, month: 7, day: 15, hour: 9, minute: 0 }, TZ);
    expect(winter?.toISOString()).toBe('2026-01-15T17:00:00.000Z');
    expect(summer?.toISOString()).toBe('2026-07-15T16:00:00.000Z');
  });

  it('returns null for a local time that does not exist (DST gap)', () => {
    expect(zonedTimeToUtc({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, TZ)).toBeNull();
  });

  it('round-trips every appointment slot of a summer and a winter day', () => {
    for (const dateKey of ['2026-01-15', '2026-07-15']) {
      for (const hour of [9, 12, 15, 19]) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const instant = zonedTimeToUtc({ year, month, day, hour, minute: 0 }, TZ);
        expect(instant, `${dateKey} ${hour}:00`).not.toBeNull();
        expect(dateKeyInTimeZone(instant as Date, TZ)).toBe(dateKey);
        expect(minutesOfDayInTimeZone(instant as Date, TZ)).toBe(hour * 60);
      }
    }
  });
});

describe('date keys', () => {
  it('resolves the calendar date in the booking zone, not UTC', () => {
    // 06:30 UTC on Sept 28 is still Sept 27 in Los Angeles.
    expect(dateKeyInTimeZone(new Date('2026-09-28T06:30:00Z'), TZ)).toBe('2026-09-27');
    expect(dateKeyInTimeZone(new Date('2026-09-28T08:00:00Z'), TZ)).toBe('2026-09-28');
  });

  it('knows weekdays (0 = Sunday)', () => {
    expect(weekdayOfDateKey('2026-09-27')).toBe(0); // Sunday
    expect(weekdayOfDateKey('2026-10-01')).toBe(4); // Thursday
    expect(weekdayOfDateKey('2026-10-02')).toBe(5); // Friday
    expect(weekdayOfDateKey('2026-10-03')).toBe(6); // Saturday
  });

  it('adds days across a DST transition without drifting', () => {
    expect(addDaysToDateKey('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysToDateKey('2026-03-08', 1)).toBe('2026-03-09');
    expect(diffInDays('2026-03-07', '2026-03-09')).toBe(2);
  });

  it('rejects impossible dates', () => {
    expect(isValidDateKey('2026-02-31')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('not-a-date')).toBe(false);
    expect(isValidDateKey('2026-02-28')).toBe(true);
  });
});

describe('formatting', () => {
  it('renders slot labels and day labels the way the confirmation screen shows them', () => {
    const start = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 15, minute: 0 }, TZ) as Date;
    expect(formatTimeLabel(start, TZ)).toBe('3:00 PM');
    expect(toZonedIsoString(start, TZ)).toBe('2026-09-29T15:00:00-07:00');
    expect(formatDayLabel('2026-09-29')).toBe('Tuesday, September 29');
    expect(formatDayParts('2026-09-29')).toEqual({ weekday: 'Tue', month: 'Sep', day: '29' });
  });

  it('uses the winter offset for a winter slot', () => {
    const start = zonedTimeToUtc({ year: 2026, month: 12, day: 15, hour: 19, minute: 0 }, TZ) as Date;
    expect(toZonedIsoString(start, TZ)).toBe('2026-12-15T19:00:00-08:00');
  });
});
