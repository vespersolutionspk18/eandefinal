// ============================================================================
// POSTGRES INTEGRATION TESTS (run against the real database when DATABASE_URL
// is set; skipped automatically otherwise)
// ----------------------------------------------------------------------------
// Proves the guarantees the in-memory tests cannot:
//   * the partial unique index on slot_key makes the claim atomic,
//   * simultaneous inserts cannot both win the same slot,
//   * the EXCLUDE constraint rejects ANY overlap, not just identical starts,
//   * cancelling releases the slot,
//   * jsonb attribution and timestamptz round-trip correctly.
//
// Every test row uses a far-future 2098/2099 slot (with `now` injected) and is
// deleted again, so nothing here can touch a real customer appointment.
// ============================================================================

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BookingService } from '@/app/lib/booking/booking-service';
import { LocalCalendarProvider } from '@/app/lib/booking/local-calendar-provider';
import { computeAvailability } from '@/app/lib/booking/slots';
import { isDatabaseConfigured, queryRows } from '@/app/lib/booking/db';
import { ensureBookingSchema, resetBookingSchemaCacheForTests } from '@/app/lib/booking/migrate';
import { PostgresBookingRepository } from '@/app/lib/booking/postgres-repository';
import { SlotTakenError } from '@/app/lib/booking/repository';

const describeWithDatabase = isDatabaseConfigured() ? describe : describe.skip;

/** Injected "now" so the 2099 slots below sit inside the booking horizon. */
const NOW = new Date('2098-12-28T16:00:00Z');

const availability = computeAvailability({ now: NOW });
const sampleDay = availability.find((day) => day.slots.length >= 4) ?? availability[0];
const SLOT_A = sampleDay.slots[0]?.start;
const SLOT_B = sampleDay.slots[1]?.start;
const SLOT_C = sampleDay.slots[2]?.start;
const SLOT_D = sampleDay.slots[3]?.start;
/** A slot on a different day, so it is untouched by the tests above. */
const SLOT_E = availability[1]?.slots[0]?.start;
const SLOT_F = availability[1]?.slots[1]?.start;
const SLOT_G = availability[1]?.slots[2]?.start;

const CUSTOMER = {
  fullName: 'Postgres Test',
  phone: '(805) 555-0199',
  address: '123 Main Street, Santa Barbara, CA',
  serviceType: 'Kitchen Remodeling',
};

function bookingInput(slotStart: string, overrides: Record<string, unknown> = {}) {
  const startTime = new Date(slotStart);
  return {
    ...CUSTOMER,
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    slotKey: startTime.toISOString(),
    timezone: 'America/Los_Angeles',
    ...overrides,
  };
}

async function cleanup(): Promise<void> {
  // Scoped to rows this suite creates (test customer name / request-id prefix),
  // so it is impossible to delete a real customer appointment — and it is
  // repeatable across runs.
  await queryRows(`DELETE FROM bookings WHERE full_name = $1 OR request_id LIKE $2`, [
    CUSTOMER.fullName,
    'pg-%',
  ]);
}

describeWithDatabase('PostgresBookingRepository (live database)', () => {
  const repository = new PostgresBookingRepository();

  beforeAll(async () => {
    resetBookingSchemaCacheForTests();
    await ensureBookingSchema();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('created the table, the slot index and the overlap constraint', async () => {
    const constraints = await queryRows<{ conname: string }>(
      `SELECT conname FROM pg_constraint WHERE conrelid = 'bookings'::regclass`,
    );
    const names = constraints.map((row) => row.conname);
    expect(names).toContain('bookings_no_overlap');
    expect(names).toContain('bookings_status_check');

    const indexes = await queryRows<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'bookings'`,
    );
    expect(indexes.map((row) => row.indexname)).toContain('bookings_active_slot_key_uniq');
  });

  it('stores and reads back a booking including jsonb attribution', async () => {
    const created = await repository.create(
      bookingInput(SLOT_A, {
        source: 'meta',
        campaign: 'kitchen-remodeling',
        attribution: { utm_source: 'meta', fbclid: 'pg-click' },
        requestId: 'pg-test-request-a',
      }),
    );

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.startTime.toISOString()).toBe(new Date(SLOT_A).toISOString());
    expect(created.status).toBe('confirmed');
    expect(created.attribution).toEqual({ utm_source: 'meta', fbclid: 'pg-click' });

    const fetched = await repository.findById(created.id);
    expect(fetched?.source).toBe('meta');
    expect(fetched?.requestId).toBe('pg-test-request-a');
    expect((await repository.findByRequestId('pg-test-request-a'))?.id).toBe(created.id);
  });

  it('refuses a second booking for the same slot', async () => {
    await expect(repository.create(bookingInput(SLOT_A))).rejects.toBeInstanceOf(SlotTakenError);
  });

  it('lets exactly one of several simultaneous inserts win', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) =>
        repository.create(bookingInput(SLOT_B, { fullName: `Racer ${index}`, requestId: `pg-race-${index}` })),
      ),
    );

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    const rejected = attempts.filter((attempt) => attempt.status === 'rejected');
    expect(rejected).toHaveLength(7);
    for (const attempt of rejected) {
      if (attempt.status === 'rejected') expect(attempt.reason).toBeInstanceOf(SlotTakenError);
    }

    const rows = await queryRows<{ count: string }>(
      `SELECT count(*)::text AS count FROM bookings WHERE slot_key = $1 AND status <> 'cancelled'`,
      [new Date(SLOT_B).toISOString()],
    );
    expect(rows[0].count).toBe('1');
  });

  it('rejects an overlap that is not an identical start (EXCLUDE backstop)', async () => {
    // SLOT_C is booked 09:00–10:00; a 09:30–10:30 attempt has a different
    // slot_key, so only the exclusion constraint can catch it.
    await repository.create(bookingInput(SLOT_C));
    const overlapping = new Date(new Date(SLOT_C).getTime() + 30 * 60 * 1000);
    await expect(
      repository.create({
        ...bookingInput(SLOT_D),
        startTime: overlapping,
        endTime: new Date(overlapping.getTime() + 60 * 60 * 1000),
        slotKey: overlapping.toISOString(),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it('returns the same booking for a repeated request id (idempotency)', async () => {
    const first = await repository.create(bookingInput(SLOT_D, { requestId: 'pg-idempotent-1' }));
    const second = await repository.create(bookingInput(SLOT_D, { requestId: 'pg-idempotent-1' }));
    expect(second.id).toBe(first.id);

    const rows = await queryRows<{ count: string }>(
      `SELECT count(*)::text AS count FROM bookings WHERE request_id = 'pg-idempotent-1'`,
    );
    expect(rows[0].count).toBe('1');
  });

  it('returns the same booking when a request id is reused, instead of a conflict', async () => {
    // A retry that races past the service's up-front lookup trips
    // `bookings_request_id_uniq` — a DIFFERENT conflict target than the
    // ON CONFLICT clause, so Postgres raises it as an error. It is still the
    // customer's own request, so it must resolve to the booking that won
    // rather than "That time was just booked".
    const requestId = 'pg-idem-reuse-1';
    const first = await repository.create(bookingInput(SLOT_E, { requestId }));
    const retry = await repository.create(bookingInput(SLOT_F, { requestId }));

    expect(retry.id).toBe(first.id);
    expect(retry.slotKey).toBe(first.slotKey);

    const rows = await queryRows<{ count: string }>(
      `SELECT count(*)::text AS count FROM bookings WHERE request_id = $1`,
      [requestId],
    );
    expect(rows[0].count).toBe('1');
  });

  it('resolves simultaneous retries of one request id to a single booking', async () => {
    // The same thing under real concurrency (a double-click on CONFIRM).
    const requestId = 'pg-idem-race-1';
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () => repository.create(bookingInput(SLOT_G, { requestId }))),
    );

    expect(attempts.every((attempt) => attempt.status === 'fulfilled')).toBe(true);
    const ids = new Set(
      attempts.map((attempt) => (attempt.status === 'fulfilled' ? attempt.value.id : null)),
    );
    expect(ids.size).toBe(1);
  });

  it('releases the slot when a booking is cancelled', async () => {
    const taken = await repository.findByRequestId('pg-test-request-a');
    expect(taken).not.toBeNull();

    const cancelled = await repository.cancel((taken as { id: string }).id);
    expect(cancelled?.status).toBe('cancelled');

    const reclaimed = await repository.create(bookingInput(SLOT_A, { requestId: 'pg-cancel-2' }));
    expect(reclaimed.status).toBe('confirmed');
    await repository.cancel(reclaimed.id);
  });

  it('lists only active bookings inside the requested range', async () => {
    const rangeStart = new Date(new Date(SLOT_B).getTime() - 12 * 60 * 60 * 1000);
    const rangeEnd = new Date(new Date(SLOT_B).getTime() + 12 * 60 * 60 * 1000);
    const rows = await repository.listActiveInRange({ from: rangeStart, to: rangeEnd });
    expect(rows.some((row) => row.slotKey === new Date(SLOT_B).toISOString())).toBe(true);
    expect(rows.every((row) => row.status === 'confirmed')).toBe(true);
  });

  it('books end to end through the service and hides the slot afterwards', async () => {
    const serviceRepo = new PostgresBookingRepository();
    const service = new BookingService(serviceRepo, new LocalCalendarProvider(serviceRepo));

    // SLOT_D is already taken by the idempotency test above.
    const conflict = await service.createBooking({ ...CUSTOMER, startTime: SLOT_D }, { now: NOW });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.status).toBe(409);

    const available = await service.getAvailability({ now: NOW, fromDateKey: sampleDay.date, days: 1 });
    const day = available.dates.find((candidate) => candidate.date === sampleDay.date);
    expect(day?.slots.map((slot) => slot.start)).not.toContain(SLOT_D);
  });
});

