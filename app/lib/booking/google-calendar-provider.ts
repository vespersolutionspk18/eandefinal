// ============================================================================
// GOOGLE CALENDAR PROVIDER
// ----------------------------------------------------------------------------
// Implements CalendarProvider against the Google Calendar REST API, in BOTH
// directions:
//
//   INBOUND  getBusyRanges(start, end)
//            → POST /calendar/v3/freeBusy, merging the busy periods of the
//              booking calendar (and any extra calendars you add, e.g. a
//              personal one) so Google-busy time never shows as bookable on the
//              website. Called when building availability AND again immediately
//              before a slot is claimed.
//
//   OUTBOUND createBookingEvent(booking)
//            → POST /calendar/v3/calendars/{id}/events with the title, location
//              and description from `calendar-event.ts`. The returned event id
//              is stored on the booking row (`google_event_id`).
//            cancelBookingEvent(eventId) → DELETE the event again.
//
// The provider is enabled only when the Google environment variables are set
// (`calendar-provider.server.ts`). Until then the local provider handles
// everything and no Google call is attempted — nothing here fakes the API.
//
// Everything is injectable (fetch + access token) so the request/response
// mapping is unit tested without any credentials.
// ============================================================================

import { buildCalendarEventDraft } from './calendar-event';
import {
  CalendarProviderError,
  type CalendarEventPayload,
  type CalendarEventResult,
  type CalendarProvider,
} from './calendar-provider';
import type { AccessTokenProvider } from './google-auth';
import type { BusyRange } from './slots';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export type GoogleCalendarProviderOptions = {
  calendarId: string;
  getAccessToken: AccessTokenProvider;
  /** Additional calendars whose busy time should also block slots. */
  extraCalendarIds?: string[];
  fetchImpl?: typeof fetch;
};

type FreeBusyResponse = {
  calendars?: Record<string, { busy?: Array<{ start: string; end: string }>; errors?: Array<{ reason?: string }> }>;
};

type GoogleEvent = { id?: string; htmlLink?: string };

export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = 'google';

  private readonly calendarId: string;
  private readonly getAccessToken: AccessTokenProvider;
  private readonly extraCalendarIds: string[];
  private readonly fetchImpl: typeof fetch;

  constructor(options: GoogleCalendarProviderOptions) {
    this.calendarId = options.calendarId;
    this.getAccessToken = options.getAccessToken;
    this.extraCalendarIds = options.extraCalendarIds ?? [];
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private get calendarIds(): string[] {
    return [this.calendarId, ...this.extraCalendarIds];
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const token = await this.getAccessToken();
    return this.fetchImpl(`${CALENDAR_API}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /** INBOUND: busy periods across the booking calendar + any extra calendars. */
  async getBusyRanges(start: Date, end: Date): Promise<BusyRange[]> {
    const response = await this.request('/freeBusy', {
      method: 'POST',
      body: JSON.stringify({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: this.calendarIds.map((id) => ({ id })),
      }),
    });

    if (!response.ok) {
      throw new CalendarProviderError(
        `Google freeBusy failed (${response.status}): ${await readErrorBody(response)}`,
        { retryable: isRetryable(response.status) },
      );
    }

    const payload = (await response.json()) as FreeBusyResponse;
    const ranges: BusyRange[] = [];
    for (const calendar of Object.values(payload.calendars ?? {})) {
      for (const busy of calendar.busy ?? []) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        if (Number.isNaN(busyStart.getTime()) || Number.isNaN(busyEnd.getTime())) continue;
        ranges.push({ start: busyStart, end: busyEnd });
      }
    }
    return ranges;
  }

  /** OUTBOUND: creates the appointment after the database claimed the slot. */
  async createBookingEvent(payload: CalendarEventPayload): Promise<CalendarEventResult> {
    const draft = buildCalendarEventDraft(payload);
    const response = await this.request(`/calendars/${encodeURIComponent(this.calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify({
        summary: draft.summary,
        location: draft.location,
        description: draft.description,
        start: draft.start,
        end: draft.end,
        // An internal appointment block, not a customer invitation: the booking
        // form deliberately does not collect an email address.
        reminders: { useDefault: true },
      }),
    });

    if (!response.ok) {
      throw new CalendarProviderError(
        `Google event insert failed (${response.status}): ${await readErrorBody(response)}`,
        { retryable: isRetryable(response.status) },
      );
    }

    const event = (await response.json()) as GoogleEvent;
    return { provider: this.name, eventId: event.id ?? null, htmlLink: event.htmlLink ?? null };
  }

  /** OUTBOUND: removes the appointment again (cancellation / compensation). */
  async cancelBookingEvent(eventId: string): Promise<void> {
    const response = await this.request(
      `/calendars/${encodeURIComponent(this.calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    );
    // 404/410 means it is already gone — which is the state we want.
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw new CalendarProviderError(
        `Google event delete failed (${response.status}): ${await readErrorBody(response)}`,
        { retryable: isRetryable(response.status) },
      );
    }
  }
}

/** Internal helper for the two write methods below. */

async function readErrorBody(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  return text.slice(0, 200);
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

