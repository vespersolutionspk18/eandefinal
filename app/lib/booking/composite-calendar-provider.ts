// ============================================================================
// COMPOSITE CALENDAR PROVIDER
// ----------------------------------------------------------------------------
// This is what makes "both ways" work: busy time is the UNION of every source
// (our own bookings + Google Calendar, when configured), while writes go to the
// writer provider (Google when configured, otherwise the local no-op).
//
//   sources = [LocalCalendarProvider, GoogleCalendarProvider]
//   writer  = GoogleCalendarProvider
//
// Adding a second calendar later (a personal one, a second crew, an out-of-
// office feed) is just another entry in `sources`.
// ============================================================================

import type { CalendarEventPayload, CalendarEventResult, CalendarProvider } from './calendar-provider';
import type { BusyRange } from './slots';

export class CompositeCalendarProvider implements CalendarProvider {
  readonly name: string;

  constructor(
    private readonly sources: CalendarProvider[],
    private readonly writer: CalendarProvider,
  ) {
    this.name = writer.name;
  }

  async getBusyRanges(start: Date, end: Date): Promise<BusyRange[]> {
    const groups = await Promise.all(this.sources.map((source) => source.getBusyRanges(start, end)));
    return groups.flat();
  }

  createBookingEvent(payload: CalendarEventPayload): Promise<CalendarEventResult> {
    return this.writer.createBookingEvent(payload);
  }

  cancelBookingEvent(eventId: string): Promise<void> {
    if (!this.writer.cancelBookingEvent) return Promise.resolve();
    return this.writer.cancelBookingEvent(eventId);
  }
}
