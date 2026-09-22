// ============================================================================
// REPOSITORY FACTORY (server-side)
// ----------------------------------------------------------------------------
// `BOOKING_STORE=memory` swaps in the in-memory repository for local work
// without a database; anything else uses Postgres.
// ============================================================================

import type { BookingRepository } from './repository';
import { MemoryBookingRepository } from './memory-repository';
import { postgresBookingRepository } from './postgres-repository';
import { isDatabaseConfigured } from './db';

let cached: BookingRepository | null = null;

/**
 * True when the API is running on the in-memory store. The route handlers use
 * this to skip the Postgres schema check, so `BOOKING_STORE=memory` really does
 * work without a `DATABASE_URL` (as documented in .env.example).
 */
export function isMemoryBookingStore(): boolean {
  return (process.env.BOOKING_STORE ?? '').trim().toLowerCase() === 'memory';
}

export function getBookingRepository(): BookingRepository {
  if (cached) return cached;

  if (isMemoryBookingStore()) {
    cached = new MemoryBookingRepository();
    return cached;
  }

  if (!isDatabaseConfigured()) {
    throw new Error(
      'DATABASE_URL is not set. Configure Postgres or run with BOOKING_STORE=memory for local development.',
    );
  }

  cached = postgresBookingRepository;
  return cached;
}

/** Test helper. */
export function setBookingRepositoryForTests(repository: BookingRepository | null): void {
  cached = repository;
}
