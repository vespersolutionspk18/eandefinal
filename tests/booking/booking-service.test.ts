// ============================================================================
// BOOKING SERVICE TESTS
// ----------------------------------------------------------------------------
// Exercises the whole server-side path with the in-memory repository and the
// local calendar provider: validation, availability re-check, the atomic claim,
// idempotency, compensation when the calendar write fails, and the race between
// two visitors clicking CONFIRM at the same moment.
// ============================================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { BookingService } from '@/app/lib/booking/booking-service';
import { LocalCalendarProvider } from '@/app/lib/booking/local-calendar-provider';
import { MemoryBookingRepository } from '@/app/lib/booking/memory-repository';
import { CalendarProviderError, type CalendarProvider } from '@/app/lib/booking/calendar-provider';

const NOW = new Date('2026-09-27T16:00:00Z'); // Sunday 9:00 AM PDT
const THURSDAY_9AM = '2026-10-01T09:00:00-07:00';
const THURSDAY_10AM = '2026-10-01T10:00:00-07:00';

const CUSTOMER = {
  fullName: 'John Smith',
  phone: '(805) 555-1234',
  address: '123 Main Street, Santa Barbara, CA',
  serviceType: 'Kitchen Remodeling',
};

function makeService(
  repository: MemoryBookingRepository = new MemoryBookingRepository(),
  calendar?: CalendarProvider,
) {
  const calendarProvider = calendar ?? new LocalCalendarProvider(repository);
  return { service: new BookingService(repository, calendarProvider), repository };
}

/** A provider that fails on demand, to test compensation + fail-closed paths. */
class FailingProvider implements CalendarProvider {
  readonly name = 'failing';

  constructor(private readonly mode: 'busy' | 'write') {}

  async getBusyRanges() {
    if (this.mode === 'busy') throw new CalendarProviderError('freeBusy exploded', { retryable: true });
    return [];
  }

  async createBookingEvent() {
    if (this.mode === 'write') throw new CalendarProviderError('insert exploded', { retryable: true });
    return { provider: this.name, eventId: null, htmlLink: null };
  }
}

describe('BookingService.createBooking', () => {
  let repository: MemoryBookingRepository;
  let service: BookingService;

  beforeEach(() => {
    repository = new MemoryBookingRepository();
    service = makeService(repository).service;
  });

  it('books a valid slot, normalizes the phone and stores the attribution', async () => {
    const result = await service.createBooking(
      {
        ...CUSTOMER,
        startTime: THURSDAY_9AM,
        source: 'meta',
        campaign: 'kitchen-remodeling',
        attribution: {
          utm_source: 'meta',
          utm_campaign: 'kitchen-remodeling',
          fbclid: 'click-1',
          junk: 'ignored',
        },
      },
      { now: NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.status).toBe(201);
    expect(result.booking).toMatchObject({
      status: 'confirmed',
      start: '2026-10-01T09:00:00-07:00',
      end: '2026-10-01T10:00:00-07:00',
      timezone: 'America/Los_Angeles',
      fullName: 'John Smith',
      phone: '+18055551234',
      address: '123 Main Street, Santa Barbara, CA',
      serviceType: 'Kitchen Remodeling',
    });
    // The confirmation must not leak database identifiers.
    expect(Object.keys(result.booking)).not.toContain('id');
    expect(result.booking).not.toHaveProperty('googleEventId');

    expect(result.record.source).toBe('meta');
    expect(result.record.campaign).toBe('kitchen-remodeling');
    expect(result.record.attribution.fbclid).toBe('click-1');
    expect(result.record.attribution).not.toHaveProperty('junk');
    expect(result.record.slotKey).toBe('2026-10-01T16:00:00.000Z');
  });

  it('rejects a second booking of the same slot with HTTP 409', async () => {
    await service.createBooking({ ...CUSTOMER, startTime: THURSDAY_9AM }, { now: NOW });
    const second = await service.createBooking(
      { ...CUSTOMER, fullName: 'Jane Doe', startTime: THURSDAY_9AM },
      { now: NOW },
    );

    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.status).toBe(409);
    expect(second.code).toBe('slot_taken');
    expect(second.message).toBe('That time was just booked. Please choose another available time.');
  });

  it('lets only one of several simultaneous attempts win the same slot', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        service.createBooking(
          { ...CUSTOMER, fullName: `Visitor ${index}`, startTime: THURSDAY_10AM },
          { now: NOW },
        ),
      ),
    );

    const winners = attempts.filter((result) => result.ok);
    const losers = attempts.filter((result) => !result.ok);
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(5);
    for (const loser of losers) if (!loser.ok) expect(loser.status).toBe(409);
    expect(repository.snapshot().filter((booking) => booking.status === 'confirmed')).toHaveLength(1);
  });

  it('is idempotent: a retried request returns the original booking', async () => {
    const first = await service.createBooking(
      { ...CUSTOMER, startTime: THURSDAY_9AM, requestId: 'req-12345678' },
      { now: NOW, requestId: 'req-12345678' },
    );
    const retry = await service.createBooking(
      { ...CUSTOMER, startTime: THURSDAY_9AM, requestId: 'req-12345678' },
      { now: NOW, requestId: 'req-12345678' },
    );

    expect(first.ok && retry.ok).toBe(true);
    expect(repository.snapshot()).toHaveLength(1);
    if (first.ok && retry.ok) expect(retry.status).toBe(200);
  });

  it('rejects a Friday, an out-of-hours start and a stale date', async () => {
    const friday = await service.createBooking({ ...CUSTOMER, startTime: '2026-10-02T09:00:00-07:00' }, { now: NOW });
    const early = await service.createBooking({ ...CUSTOMER, startTime: '2026-10-01T08:00:00-07:00' }, { now: NOW });
    const past = await service.createBooking({ ...CUSTOMER, startTime: '2026-09-20T09:00:00-07:00' }, { now: NOW });

    for (const result of [friday, early, past]) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect([400, 409]).toContain(result.status);
        expect(result.fields?.startTime ?? result.message).toBeTruthy();
      }
    }
    expect(repository.snapshot()).toHaveLength(0);
  });

  it('ignores client-supplied duration, end time, timezone and status', async () => {
    const result = await service.createBooking(
      {
        ...CUSTOMER,
        startTime: THURSDAY_9AM,
        endTime: '2026-10-01T23:00:00-07:00',
        durationMinutes: 480,
        timezone: 'UTC',
        status: 'vip',
      },
      { now: NOW },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.end).toBe('2026-10-01T10:00:00-07:00'); // exactly 60 minutes
      expect(result.booking.timezone).toBe('America/Los_Angeles');
      expect(result.record.endTime.getTime() - result.record.startTime.getTime()).toBe(60 * 60 * 1000);
      expect(result.record.status).toBe('confirmed');
    }
  });

  it('returns field errors for bad customer data', async () => {
    const result = await service.createBooking(
      { fullName: 'X', phone: '123', address: '', serviceType: '' },
      { now: NOW },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.code).toBe('validation_error');
      expect(Object.keys(result.fields ?? {}).sort()).toEqual(['address', 'fullName', 'phone', 'serviceType']);
    }
  });

  it('fails closed when availability cannot be verified, storing nothing', async () => {
    const broken = makeService(new MemoryBookingRepository(), new FailingProvider('busy'));
    const result = await broken.service.createBooking({ ...CUSTOMER, startTime: THURSDAY_9AM }, { now: NOW });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
    expect(broken.repository.snapshot()).toHaveLength(0);
  });

  it('releases the claimed slot when the calendar event cannot be created', async () => {
    const failing = makeService(new MemoryBookingRepository(), new FailingProvider('write'));
    const result = await failing.service.createBooking({ ...CUSTOMER, startTime: THURSDAY_9AM }, { now: NOW });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(502);
    const rows = failing.repository.snapshot();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('cancelled'); // slot released, never silently held
    expect(rows.filter((row) => row.status === 'confirmed')).toHaveLength(0);
  });

  it('stores the Google event id when the provider returns one', async () => {
    const provider: CalendarProvider = {
      name: 'google',
      async getBusyRanges() {
        return [];
      },
      async createBookingEvent() {
        return { provider: 'google', eventId: 'evt_123', htmlLink: 'https://calendar.google.com/evt_123' };
      },
    };
    const { service: withGoogle } = makeService(new MemoryBookingRepository(), provider);
    const result = await withGoogle.createBooking({ ...CUSTOMER, startTime: THURSDAY_9AM }, { now: NOW });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.googleEventId).toBe('evt_123');
  });
});

describe('BookingService.getAvailability', () => {
  it('hides slots that are already booked and keeps the rest', async () => {
    const { service } = makeService();
    await service.createBooking({ ...CUSTOMER, startTime: THURSDAY_9AM }, { now: NOW });

    const availability = await service.getAvailability({ now: NOW });
    const thursday = availability.dates.find((day) => day.date === '2026-10-01');
    expect(thursday?.slots.map((slot) => slot.start)).not.toContain(THURSDAY_9AM);
    expect(thursday?.slots.map((slot) => slot.start)).toContain(THURSDAY_10AM);
    expect(availability.timezone).toBe('America/Los_Angeles');
    expect(availability.durationMinutes).toBe(60);
  });

  it('degrades to local bookings when the calendar provider is down', async () => {
    const { service } = makeService(new MemoryBookingRepository(), new FailingProvider('busy'));
    const availability = await service.getAvailability({ now: NOW });
    expect(availability.dates.length).toBeGreaterThan(0);
  });

  it('never advertises a booked slot on the last evening of the horizon', async () => {
    // The horizon offers 30 days starting from "today" (2026-09-27), so the last
    // bookable date is 2026-10-26. Its 19:00 PDT slot is 02:00Z on the FOLLOWING
    // day, so a UTC-midnight window end used to miss it and offer it as free.
    const { service } = makeService();
    const LAST_DAY = '2026-10-26';
    const LAST_SLOT = `${LAST_DAY}T19:00:00-07:00`;

    const booked = await service.createBooking({ ...CUSTOMER, startTime: LAST_SLOT }, { now: NOW });
    expect(booked.ok).toBe(true);

    // A window that reaches the very last day of the horizon.
    const availability = await service.getAvailability({ now: NOW, fromDateKey: '2026-09-28', days: 30 });
    const finalDay = availability.dates.find((day) => day.date === LAST_DAY);
    expect(finalDay).toBeDefined();
    expect(finalDay?.slots.map((slot) => slot.start)).not.toContain(LAST_SLOT);
    // …while the rest of that evening is still offered.
    expect(finalDay?.slots.map((slot) => slot.start)).toContain(`${LAST_DAY}T18:00:00-07:00`);
  });
});

