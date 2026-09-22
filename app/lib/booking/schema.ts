// ============================================================================
// BOOKING DATABASE SCHEMA (plain SQL — no ORM)
// ----------------------------------------------------------------------------
// This module is intentionally dependency-free: it is imported both by the app
// runtime (`migrate.ts`) and by `scripts/db-migrate.mjs`, which Node can load
// directly because there is nothing to resolve.
//
// Concurrency model — how double booking is made impossible:
//
//  1. `bookings_active_slot_key_uniq`
//     A PARTIAL unique index on `slot_key` (the UTC start instant) for every row
//     whose status is not 'cancelled'. The booking endpoint claims a slot with
//
//        INSERT … ON CONFLICT (slot_key) WHERE status <> 'cancelled' DO NOTHING
//
//     Postgres guarantees only one of two simultaneous inserts can win; the
//     loser gets zero rows back and the API answers HTTP 409. No read-then-write
//     race, no application-level lock, no transaction required.
//
//  2. `bookings_no_overlap`
//     An EXCLUDE constraint (btree_gist) that rejects ANY overlapping active
//     booking for the single appointment resource, even if a future change
//     introduces different durations. This is the backstop; it is optional so a
//     database without btree_gist still works (see migrationPlan()).
//
//  3. `bookings_request_id_uniq`
//     Idempotency: a retried/double-clicked request carries the same
//     `request_id`, so it can never create a second booking.
// ============================================================================

export const BOOKING_TABLE = 'bookings';
export const BOOKING_OVERLAP_CONSTRAINT = 'bookings_no_overlap';

/** Idempotent DDL, safe to run on every boot. */
export const BOOKING_BASE_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS ${BOOKING_TABLE} (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     full_name text NOT NULL,
     phone text NOT NULL,
     address text NOT NULL,
     service_type text NOT NULL,
     start_time timestamptz NOT NULL,
     end_time timestamptz NOT NULL,
     slot_key text NOT NULL,
     timezone text NOT NULL DEFAULT 'America/Los_Angeles',
     status text NOT NULL DEFAULT 'confirmed',
     google_event_id text,
     google_synced_at timestamptz,
     source text,
     campaign text,
     attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
     request_id text,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now(),
     CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'cancelled')),
     CONSTRAINT bookings_range_check CHECK (end_time > start_time)
   )`,

  // 1. The slot claim. One active booking per start instant.
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_key_uniq
     ON ${BOOKING_TABLE} (slot_key) WHERE status <> 'cancelled'`,

  // 3. Idempotency for retried requests.
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_request_id_uniq
     ON ${BOOKING_TABLE} (request_id) WHERE request_id IS NOT NULL`,

  // Availability queries always look at active bookings in a time range.
  `CREATE INDEX IF NOT EXISTS bookings_active_start_time_idx
     ON ${BOOKING_TABLE} (start_time) WHERE status <> 'cancelled'`,

  // Attribution reporting (e.g. "Meta leads this month").
  `CREATE INDEX IF NOT EXISTS bookings_source_idx ON ${BOOKING_TABLE} (source)`,
];

/** btree_gist powers the optional overlap constraint. */
export const BOOKING_EXTENSION_STATEMENT = 'CREATE EXTENSION IF NOT EXISTS btree_gist';

/** 2. Backstop: no two active bookings may overlap at all. */
export const BOOKING_OVERLAP_STATEMENT = `ALTER TABLE ${BOOKING_TABLE}
  ADD CONSTRAINT ${BOOKING_OVERLAP_CONSTRAINT}
  EXCLUDE USING gist (tstzrange(start_time, end_time) WITH &&) WHERE (status <> 'cancelled')`;

/**
 * The ordered migration plan.
 * `hasOverlapConstraint` is read from `pg_constraint` first so the ALTER only
 * runs once.
 */
export function migrationPlan(hasOverlapConstraint: boolean): readonly string[] {
  return hasOverlapConstraint
    ? BOOKING_BASE_STATEMENTS
    : [BOOKING_EXTENSION_STATEMENT, ...BOOKING_BASE_STATEMENTS, BOOKING_OVERLAP_STATEMENT];
}

/** Postgres error codes we translate into domain errors. */
export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  EXCLUSION_VIOLATION: '23P01',
  DUPLICATE_TABLE: '42P07',
  DUPLICATE_OBJECT: '42710',
  UNDEFINED_OBJECT: '42704',
  FEATURE_NOT_SUPPORTED: '0A000',
} as const;
