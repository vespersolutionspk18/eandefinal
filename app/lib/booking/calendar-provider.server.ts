// ============================================================================
// CALENDAR PROVIDER FACTORY (server-side)
// ----------------------------------------------------------------------------
// Default: local provider — the Postgres bookings are the calendar, so the
// booking flow works end to end with no Google credentials.
//
// With GOOGLE_CALENDAR_ID + GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
// set, Google Calendar is added as a busy-range source (so Google-busy time
// disappears from the website) and becomes the event writer.
// ============================================================================

import { CompositeCalendarProvider } from './composite-calendar-provider';
import { GoogleCalendarProvider } from './google-calendar-provider';
import { LocalCalendarProvider } from './local-calendar-provider';
import { createServiceAccountTokenProvider, readGoogleConfigFromEnv } from './google-auth';
import { getBookingRepository } from './repository.server';
import type { CalendarProvider } from './calendar-provider';

let cached: CalendarProvider | null = null;

export function getCalendarProvider(): CalendarProvider {
  if (cached) return cached;

  const local = new LocalCalendarProvider(getBookingRepository());
  const googleConfig = readGoogleConfigFromEnv();

  if (!googleConfig) {
    cached = new CompositeCalendarProvider([local], local);
    return cached;
  }

  const extraCalendarIds = (process.env.GOOGLE_EXTRA_CALENDAR_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const google = new GoogleCalendarProvider({
    calendarId: googleConfig.calendarId,
    getAccessToken: createServiceAccountTokenProvider(googleConfig),
    extraCalendarIds,
  });

  cached = new CompositeCalendarProvider([local, google], google);
  return cached;
}

/** Test helper. */
export function setCalendarProviderForTests(provider: CalendarProvider | null): void {
  cached = provider;
}
