// ============================================================================
// BOOKING RULE TESTS — the server-side acceptance criteria
// ----------------------------------------------------------------------------
//  1. Sunday accepted          2. Thursday accepted
//  3. Friday rejected          4. Saturday rejected
//  5. Before 9 AM rejected     6. Ending after 8 PM rejected
//  7. 7–8 PM accepted          8. Past times rejected
//  9. Inside minimum notice rejected   10. Beyond horizon rejected
// 11. Already-booked slot rejected
//
// Every check runs through `evaluateSlotRequest` / `computeAvailability`, the
// same functions the API uses — never a simplified copy.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { BOOKING_CONFIG, type BookingConfig } from '@/app/lib/booking/config';
import {
  computeAvailability,
  evaluateSlotRequest,
  getSlotWindow,
  parseRequestedStart,
  type BusyRange,
} from '@/app/lib/booking/slots';

/** Sunday, September 27 2026, 9:00 AM in Los Angeles (PDT). */
const NOW = new Date('2026-09-27T16:00:00Z');

function evaluate(
  startIso: string,
  extra: { now?: Date; busyRanges?: BusyRange[]; config?: BookingConfig } = {},
) {
  return evaluateSlotRequest({
    start: new Date(startIso),
    now: extra.now ?? NOW,
    config: extra.config ?? BOOKING_CONFIG,
    busyRanges: extra.busyRanges ?? [],
  });
}

describe('the appointment grid', () => {
  it('starts at 9:00 AM and its final start is 7:00 PM so it ends by 8:00 PM', () => {
    const window = getSlotWindow(BOOKING_CONFIG);
    expect(window.starts[0]).toBe(9 * 60);
    expect(window.starts[window.starts.length - 1]).toBe(19 * 60);
    expect(window.starts).toHaveLength(11);
    // 20:00 never appears as a start time.
    expect(window.starts).not.toContain(20 * 60);
  });
});

describe('allowed weekdays', () => {
  it('accepts Sunday (1)', () => {
    expect(evaluate('2026-09-27T13:00:00-07:00').ok).toBe(true);
  });

  it('accepts Thursday (2)', () => {
    const result = evaluate('2026-10-01T09:00:00-07:00');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.end.toISOString()).toBe('2026-10-01T17:00:00.000Z'); // 10:00 AM PDT
    }
  });

  it('rejects Friday (3)', () => {
    const result = evaluate('2026-10-02T09:00:00-07:00');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('slot_unavailable');
      expect(result.message).toContain('Thursday');
    }
  });

  it('rejects Saturday (4)', () => {
    expect(evaluate('2026-10-03T09:00:00-07:00').ok).toBe(false);
  });
});

describe('business hours', () => {
  it('rejects a start before 9:00 AM (5)', () => {
    expect(evaluate('2026-10-01T08:00:00-07:00').ok).toBe(false);
  });

  it('rejects 9:30 AM because starts must sit on the grid', () => {
    expect(evaluate('2026-10-01T09:30:00-07:00').ok).toBe(false);
  });

  it('accepts 7:00 PM–8:00 PM for a 60 minute appointment (7)', () => {
    const result = evaluate('2026-10-01T19:00:00-07:00');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.end.toISOString()).toBe('2026-10-02T03:00:00.000Z'); // 8:00 PM PDT
      expect(result.localEnd).toBe('2026-10-01T20:00:00-07:00');
    }
  });

  it('rejects an appointment that would end after 8:00 PM (6)', () => {
    // With 90-minute appointments a 7:00 PM start would run until 8:30 PM.
    const config: BookingConfig = {
      ...BOOKING_CONFIG,
      appointmentDurationMinutes: 90,
      slotIntervalMinutes: 30,
    };
    expect(evaluate('2026-10-01T19:00:00-07:00', { config }).ok).toBe(false);
    // 6:30 PM is the latest start that still fits.
    expect(evaluate('2026-10-01T18:30:00-07:00', { config }).ok).toBe(true);
  });
});

describe('time window rules', () => {
  it('rejects a past appointment (8)', () => {
    // Thursday September 24 2026 at 3:00 PM — before `NOW`.
    const result = evaluate('2026-09-24T15:00:00-07:00');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('slot_unavailable');
      expect(result.message).toContain('passed');
    }
  });

  it('rejects anything inside the minimum notice window (9)', () => {
    // now = 9:00 AM, notice = 120 minutes → the first allowed start is 11:00 AM.
    expect(evaluate('2026-09-27T10:00:00-07:00').ok).toBe(false);
    expect(evaluate('2026-09-27T11:00:00-07:00').ok).toBe(true); // exactly at the boundary
  });

  it('rejects a date beyond the 30 day horizon (10)', () => {
    expect(evaluate('2026-10-26T09:00:00-07:00').ok).toBe(true); // 29 days out — last offered day
    expect(evaluate('2026-10-27T09:00:00-07:00').ok).toBe(false); // 30 days out — past the horizon
  });

  it('rejects an already-booked slot (11)', () => {
    const busyRanges: BusyRange[] = [
      { start: new Date('2026-10-01T16:00:00Z'), end: new Date('2026-10-01T17:00:00Z') }, // 9:00 AM PDT
    ];
    const result = evaluate('2026-10-01T09:00:00-07:00', { busyRanges });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('slot_taken');
      expect(result.message).toBe('That time was just booked. Please choose another available time.');
    }
    // The neighbouring hour is still fine.
    expect(evaluate('2026-10-01T10:00:00-07:00', { busyRanges }).ok).toBe(true);
  });
});

describe('parseRequestedStart', () => {
  it('accepts an offset-qualified instant in the booking zone', () => {
    const parsed = parseRequestedStart('2026-09-29T15:00:00-07:00');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.start.toISOString()).toBe('2026-09-29T22:00:00.000Z');
  });

  it('rejects a wrong offset instead of silently shifting the appointment', () => {
    // September is PDT (-07:00), so a -08:00 payload must not be accepted.
    expect(parseRequestedStart('2026-09-29T15:00:00-08:00').ok).toBe(false);
    // UTC is never the booking-zone offset either.
    expect(parseRequestedStart('2026-09-29T22:00:00Z').ok).toBe(false);
  });

  it('rejects local strings, dates and junk', () => {
    expect(parseRequestedStart('2026-09-29T15:00:00').ok).toBe(false);
    expect(parseRequestedStart('2026-09-29').ok).toBe(false);
    expect(parseRequestedStart('').ok).toBe(false);
    expect(parseRequestedStart(undefined).ok).toBe(false);
    expect(parseRequestedStart({ start: '2026-09-29T15:00:00-07:00' }).ok).toBe(false);
  });
});

describe('computeAvailability', () => {
  const availability = computeAvailability({ now: NOW, config: BOOKING_CONFIG });

  it('never offers Friday or Saturday', () => {
    const weekdays = new Set(availability.map((day) => day.weekday));
    expect(weekdays.has(5)).toBe(false);
    expect(weekdays.has(6)).toBe(false);
    expect([...weekdays].every((weekday) => weekday >= 0 && weekday <= 4)).toBe(true);
  });

  it('offers no time inside the notice window and nothing in the past', () => {
    for (const day of availability) {
      for (const slot of day.slots) {
        expect(new Date(slot.start).getTime()).toBeGreaterThanOrEqual(
          NOW.getTime() + BOOKING_CONFIG.minimumNoticeMinutes * 60_000,
        );
      }
    }
  });

  it('reports days in Pacific time with the correct DST offset', () => {
    const thursday = availability.find((day) => day.date === '2026-10-01');
    expect(thursday).toBeDefined();
    expect(thursday?.slots[0].start).toBe('2026-10-01T09:00:00-07:00');
    expect(thursday?.slots[thursday.slots.length - 1].start).toBe('2026-10-01T19:00:00-07:00');
  });

  it('is limited to the booking horizon', () => {
    expect(availability[0].date).toBe('2026-09-27');
    const lastDate = availability[availability.length - 1].date;
    expect(lastDate <= '2026-10-27').toBe(true);
  });

  it('keeps a day with no availability in the list so the UI can say "full"', () => {
    const fullyBooked = computeAvailability({
      now: NOW,
      config: BOOKING_CONFIG,
      busyRanges: [{ start: new Date('2026-10-01T00:00:00Z'), end: new Date('2026-10-03T00:00:00Z') }],
    });
    const thursday = fullyBooked.find((day) => day.date === '2026-10-01');
    expect(thursday).toBeDefined();
    expect(thursday?.slots).toEqual([]);
  });

  it('switches UTC offset across the DST boundary instead of using a fixed one', () => {
    const dst = computeAvailability({ now: new Date('2026-03-04T20:00:00Z'), config: BOOKING_CONFIG });
    const before = dst.find((day) => day.date === '2026-03-05');
    const after = dst.find((day) => day.date === '2026-03-12');
    expect(before?.slots[0].start).toBe('2026-03-05T09:00:00-08:00'); // PST
    expect(after?.slots[0].start).toBe('2026-03-12T09:00:00-07:00'); // PDT
  });

  it('accepts a bounded request window via from/days', () => {
    const short = computeAvailability({ now: NOW, config: BOOKING_CONFIG, fromDateKey: '2026-10-01', days: 2 });
    expect(short.map((day) => day.date)).toEqual(['2026-10-01']);
  });

  it('clamps attempts to escape the horizon', () => {
    const escaped = computeAvailability({ now: NOW, config: BOOKING_CONFIG, days: 500 });
    expect(escaped.length).toBeLessThanOrEqual(30);
    const backdated = computeAvailability({ now: NOW, config: BOOKING_CONFIG, fromDateKey: '2020-01-01' });
    expect(backdated[0].date).toBe('2026-09-27');
  });
});


