// ============================================================================
// POSTGRES BOOKING REPOSITORY (raw SQL, no ORM)
// ----------------------------------------------------------------------------
// The slot claim is one statement:
//
//   INSERT … ON CONFLICT (slot_key) WHERE status <> 'cancelled' DO NOTHING
//     RETURNING …
//
// Two simultaneous requests for the same slot cannot both succeed: Postgres
// serialises them on the partial unique index and the loser gets zero rows,
// which the service turns into HTTP 409. There is no read-then-write window to
// lose a race in, and no dependence on the frontend telling the truth.
// ============================================================================

import { sanitizeAttribution, type BookingAttribution } from './attribution';
import { errorCode, queryOne, queryRows } from './db';
import { PG_ERROR } from './schema';
import {
  SlotTakenError,
  type BookingRecord,
  type BookingRepository,
  type BookingStatus,
  type NewBooking,
} from './repository';

type BookingRow = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  service_type: string;
  start_time_iso: string;
  end_time_iso: string;
  slot_key: string;
  timezone: string;
  status: string;
  google_event_id: string | null;
  source: string | null;
  campaign: string | null;
  attribution: unknown;
  request_id: string | null;
  created_at_iso: string;
  updated_at_iso: string;
};

/**
 * Deterministic ISO output for timestamps (independent of how the driver
 * decodes timestamptz), plus the snake_case columns of the table.
 */
const SELECT_COLUMNS = `
  id, full_name, phone, address, service_type, slot_key, timezone, status,
  google_event_id, source, campaign, attribution, request_id,
  to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS start_time_iso,
  to_char(end_time   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS end_time_iso,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at_iso,
  to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at_iso`;

function toAttribution(value: unknown): BookingAttribution {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return sanitizeAttribution(JSON.parse(value) as Record<string, unknown>);
    } catch {
      return {};
    }
  }
  return sanitizeAttribution(value);
}

function mapRow(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    serviceType: row.service_type,
    startTime: new Date(row.start_time_iso),
    endTime: new Date(row.end_time_iso),
    slotKey: row.slot_key,
    timezone: row.timezone,
    status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
    googleEventId: row.google_event_id,
    source: row.source,
    campaign: row.campaign,
    attribution: toAttribution(row.attribution),
    requestId: row.request_id,
    createdAt: new Date(row.created_at_iso),
    updatedAt: new Date(row.updated_at_iso),
  };
}

/** Both codes mean "that slot is gone" for our purposes. */
const CONFLICT_CODES: readonly string[] = [PG_ERROR.UNIQUE_VIOLATION, PG_ERROR.EXCLUSION_VIOLATION];

export class PostgresBookingRepository implements BookingRepository {
  readonly name = 'postgres';

  async listActiveInRange(range: { from: Date; to: Date }): Promise<BookingRecord[]> {
    const rows = await queryRows<BookingRow>(
      `SELECT ${SELECT_COLUMNS} FROM bookings
        WHERE status <> 'cancelled' AND start_time < $2::timestamptz AND end_time > $1::timestamptz
        ORDER BY start_time`,
      [range.from.toISOString(), range.to.toISOString()],
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<BookingRecord | null> {
    const row = await queryOne<BookingRow>(`SELECT ${SELECT_COLUMNS} FROM bookings WHERE id = $1::uuid`, [id]);
    return row ? mapRow(row) : null;
  }

  async findByRequestId(requestId: string): Promise<BookingRecord | null> {
    const row = await queryOne<BookingRow>(`SELECT ${SELECT_COLUMNS} FROM bookings WHERE request_id = $1`, [
      requestId,
    ]);
    return row ? mapRow(row) : null;
  }

  async create(booking: NewBooking): Promise<BookingRecord> {
    const status: BookingStatus = booking.status ?? 'confirmed';
    try {
      const rows = await queryRows<BookingRow>(
        `INSERT INTO bookings (
           full_name, phone, address, service_type, start_time, end_time, slot_key, timezone, status,
           source, campaign, attribution, request_id
         ) VALUES (
           $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10, $11, $12::jsonb, $13
         )
         ON CONFLICT (slot_key) WHERE status <> 'cancelled' DO NOTHING
         RETURNING ${SELECT_COLUMNS}`,
        [
          booking.fullName,
          booking.phone,
          booking.address,
          booking.serviceType,
          booking.startTime.toISOString(),
          booking.endTime.toISOString(),
          booking.slotKey,
          booking.timezone,
          status,
          booking.source ?? null,
          booking.campaign ?? null,
          JSON.stringify(booking.attribution ?? {}),
          booking.requestId ?? null,
        ],
      );

      if (rows.length > 0) return mapRow(rows[0]);

      // The slot is gone. If this is a retry of a request we already stored,
      // return that booking instead of an error (idempotent double-click).
      if (booking.requestId) {
        const existing = await this.findByRequestId(booking.requestId);
        if (existing) return existing;
      }
      throw new SlotTakenError(booking.slotKey);
    } catch (error) {
      if (CONFLICT_CODES.includes(errorCode(error) ?? '')) {
        // A simultaneous retry carrying the SAME requestId won the insert and
        // tripped `bookings_request_id_uniq`. That is a different conflict
        // target than the ON CONFLICT clause above, so Postgres raises it as an
        // error instead of returning no rows — but it is our own request, not
        // somebody else's booking. Return the booking that won, otherwise a
        // double-click would report "That time was just booked" against itself.
        if (booking.requestId) {
          const existing = await this.findByRequestId(booking.requestId);
          if (existing) return existing;
        }
        // Backstop: the EXCLUDE constraint caught an overlap that was not an
        // exact slot_key match.
        throw new SlotTakenError(booking.slotKey);
      }
      throw error;
    }
  }

  async cancel(id: string): Promise<BookingRecord | null> {
    const row = await queryOne<BookingRow>(
      `UPDATE bookings SET status = 'cancelled', updated_at = now()
        WHERE id = $1::uuid RETURNING ${SELECT_COLUMNS}`,
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async setGoogleEventId(id: string, googleEventId: string | null): Promise<void> {
    await queryRows(
      `UPDATE bookings
          SET google_event_id = $2,
              google_synced_at = CASE WHEN $2 IS NULL THEN NULL ELSE now() END,
              updated_at = now()
        WHERE id = $1::uuid`,
      [id, googleEventId],
    );
  }
}

export const postgresBookingRepository = new PostgresBookingRepository();

