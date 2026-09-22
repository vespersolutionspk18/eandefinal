// ============================================================================
// BOOKING SERVICE FACTORY (server-side)
// ----------------------------------------------------------------------------
// Wires the repository (Postgres) and the calendar provider (local + Google when
// configured) into one service instance per process.
// ============================================================================

import { BookingService } from './booking-service';
import { getCalendarProvider } from './calendar-provider.server';
import { getBookingRepository } from './repository.server';

let cached: BookingService | null = null;

export function getBookingService(): BookingService {
  if (!cached) cached = new BookingService(getBookingRepository(), getCalendarProvider());
  return cached;
}

/** Test helper. */
export function setBookingServiceForTests(service: BookingService | null): void {
  cached = service;
}
