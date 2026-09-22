// ============================================================================
// LOCAL CALENDAR PROVIDER (default — works with no Google credentials)
// ----------------------------------------------------------------------------
// Our own database is the calendar: busy ranges come from active bookings and
// the "event" created for a booking simply IS the booking row. Nothing here
// pretends to talk to Google; when the Google provider is configured it takes
// over the same interface and this one's busy ranges are merged with Google's.
// ============================================================================

import type { BookingRepository } from './repository';
import type { BusyRange } from './slots';
import type { CalendarEventPayload, CalendarEventResult, CalendarProvider } from './calendar-provider';

export class LocalCalendarProvider implements CalendarProvider {
  readonly name = 'local';

  constructor(private readonly repository: BookingRepository) {}

  async getBusyRanges(start: Date, end: Date): Promise<BusyRange[]> {
    const bookings = await this.repository.listActiveInRange({ from: start, to: end });
    return bookings.map((booking) => ({ start: booking.startTime, end: booking.endTime }));
  }

  async createBookingEvent(payload: CalendarEventPayload): Promise<CalendarEventResult> {
    // The booking row is the source of truth, so there is no external event to
    // create and no id to store yet. `google_event_id` stays null until the
    // Google provider is enabled.
    void payload;
    return { provider: this.name, eventId: null, htmlLink: null };
  }

  async cancelBookingEvent(): Promise<void> {
    // Nothing external to remove.
  }
}
