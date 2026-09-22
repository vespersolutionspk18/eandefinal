// ============================================================================
// SCHEMA MIGRATION (runtime)
// ----------------------------------------------------------------------------
// `ensureBookingSchema()` is called by the booking route handlers. It is
// idempotent and memoized, so the first request after a deploy creates the
// table/indexes/constraints if they are missing and every later request is a
// no-op. `scripts/db-migrate.mjs` runs exactly the same statements from CI or a
// terminal.
// ============================================================================

import { errorCode, isDatabaseConfigured, queryOne, queryRows } from './db';
import {
  BOOKING_BASE_STATEMENTS,
  BOOKING_EXTENSION_STATEMENT,
  BOOKING_OVERLAP_CONSTRAINT,
  BOOKING_OVERLAP_STATEMENT,
  PG_ERROR,
} from './schema';

export type MigrationReport = {
  applied: string[];
  warnings: string[];
};

function label(statement: string): string {
  return statement.split('\n')[0].replace(/\s+/g, ' ').trim();
}

function isAlreadyThere(code: string | undefined): boolean {
  return code === PG_ERROR.DUPLICATE_TABLE || code === PG_ERROR.DUPLICATE_OBJECT;
}

/** btree_gist / EXCLUDE not being available must not stop the booking API. */
function isOptionalConstraintFailure(code: string | undefined): boolean {
  return (
    code === PG_ERROR.UNDEFINED_OBJECT ||
    code === PG_ERROR.FEATURE_NOT_SUPPORTED ||
    code === undefined
  );
}

export async function runBookingMigrations(): Promise<MigrationReport> {
  const report: MigrationReport = { applied: [], warnings: [] };

  for (const statement of BOOKING_BASE_STATEMENTS) {
    try {
      await queryRows(statement);
      report.applied.push(label(statement));
    } catch (error) {
      const code = errorCode(error);
      if (isAlreadyThere(code)) continue; // IF NOT EXISTS should cover this already
      throw error;
    }
  }

  const existing = await queryOne<{ present: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = $1) AS present',
    [BOOKING_OVERLAP_CONSTRAINT],
  );

  if (!existing?.present) {
    try {
      await queryRows(BOOKING_EXTENSION_STATEMENT);
    } catch (error) {
      report.warnings.push(`btree_gist unavailable: ${String(errorCode(error))}`);
    }

    try {
      await queryRows(BOOKING_OVERLAP_STATEMENT);
      report.applied.push(label(BOOKING_OVERLAP_STATEMENT));
    } catch (error) {
      const code = errorCode(error);
      if (!isOptionalConstraintFailure(code)) throw error;
      report.warnings.push(
        `Optional overlap constraint (${BOOKING_OVERLAP_CONSTRAINT}) not installed (${String(code ?? 'unknown error')}). ` +
          'The partial unique index on slot_key still prevents double booking.',
      );
    }
  }

  return report;
}

let schemaReady: Promise<MigrationReport> | null = null;

/**
 * Memoized schema check used by the API routes.
 * Throws when DATABASE_URL is missing — callers translate that to a 503.
 */
export function ensureBookingSchema(): Promise<MigrationReport> {
  if (!isDatabaseConfigured()) {
    return Promise.reject(new Error('DATABASE_URL is not set.'));
  }
  if (!schemaReady) {
    schemaReady = runBookingMigrations().catch((error: unknown) => {
      schemaReady = null; // allow the next request to retry
      throw error;
    });
  }
  return schemaReady;
}

/** Test helper. */
export function resetBookingSchemaCacheForTests(): void {
  schemaReady = null;
}
