// ============================================================================
// IN-MEMORY BOOKING REPOSITORY
// ----------------------------------------------------------------------------
// Used by unit tests (fast, deterministic) and by local dev when
// `BOOKING_STORE=memory` is set so the booking flow can be exercised without a
// database. It mirrors the Postgres guarantees — one active booking per slot,
// idempotent request ids, no overlaps — by serialising writes through a queue,
// which is the in-process equivalent of the database constraints.
// ============================================================================

import { randomUUID } from 'node:crypto';
import {
  SlotTakenError,
  type BookingRecord,
  type BookingRepository,
  type BookingStatus,
  type NewBooking,
} from './repository';

function toRecord(booking: NewBooking, status: BookingStatus): BookingRecord {
  const now = new Date();
  return {
    id: randomUUID(),
    fullName: booking.fullName,
    phone: booking.phone,
    address: booking.address,
    serviceType: booking.serviceType,
    startTime: booking.startTime,
    endTime: booking.endTime,
    slotKey: booking.slotKey,
    timezone: booking.timezone,
    status,
    googleEventId: null,
    source: booking.source ?? null,
    campaign: booking.campaign ?? null,
    attribution: booking.attribution ?? {},
    requestId: booking.requestId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export class MemoryBookingRepository implements BookingRepository {
  readonly name = 'memory';

  private readonly bookings: BookingRecord[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  private runExclusive<T>(task: () => T | Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async listActiveInRange(range: { from: Date; to: Date }): Promise<BookingRecord[]> {
    return this.bookings
      .filter(
        (b) =>
          b.status !== 'cancelled' &&
          b.startTime.getTime() < range.to.getTime() &&
          b.endTime.getTime() > range.from.getTime(),
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async findById(id: string): Promise<BookingRecord | null> {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  async findByRequestId(requestId: string): Promise<BookingRecord | null> {
    return this.bookings.find((b) => b.requestId === requestId) ?? null;
  }

  create(booking: NewBooking): Promise<BookingRecord> {
    return this.runExclusive(() => {
      if (booking.requestId) {
        const existing = this.bookings.find((b) => b.requestId === booking.requestId);
        if (existing) return existing;
      }

      const clash = this.bookings.some(
        (b) =>
          b.status !== 'cancelled' &&
          (b.slotKey === booking.slotKey ||
            (b.startTime.getTime() < booking.endTime.getTime() && b.endTime.getTime() > booking.startTime.getTime())),
      );
      if (clash) throw new SlotTakenError(booking.slotKey);

      const record = toRecord(booking, booking.status ?? 'confirmed');
      this.bookings.push(record);
      return record;
    });
  }

  cancel(id: string): Promise<BookingRecord | null> {
    return this.runExclusive(() => {
      const record = this.bookings.find((b) => b.id === id);
      if (!record) return null;
      record.status = 'cancelled';
      record.updatedAt = new Date();
      return record;
    });
  }

  setGoogleEventId(id: string, googleEventId: string | null): Promise<void> {
    return this.runExclusive(() => {
      const record = this.bookings.find((b) => b.id === id);
      if (record) {
        record.googleEventId = googleEventId;
        record.updatedAt = new Date();
      }
    });
  }

  /** Test helper. */
  clear(): void {
    this.bookings.length = 0;
  }

  /** Test helper. */
  snapshot(): readonly BookingRecord[] {
    return [...this.bookings];
  }
}
