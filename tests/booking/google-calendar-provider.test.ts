// ============================================================================
// GOOGLE CALENDAR PROVIDER TESTS (no credentials, no network)
// ----------------------------------------------------------------------------
// The provider is the boundary for the Google integration, so its request and
// response mapping is tested with a stubbed `fetch`: freeBusy (inbound) and
// events.insert / events.delete (outbound).
// ============================================================================

import { describe, expect, it } from 'vitest';
import { buildCalendarEventDraft } from '@/app/lib/booking/calendar-event';
import { CalendarProviderError } from '@/app/lib/booking/calendar-provider';
import { GoogleCalendarProvider } from '@/app/lib/booking/google-calendar-provider';

const CALENDAR_ID = 'booking@group.calendar.google.com';
const TOKEN = 'test-access-token';

type Call = { url: string; init: RequestInit };

function stubFetch(reply: { status?: number; body?: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const status = reply.status ?? 200;
    // 204/304 responses must not carry a body.
    const payload = status === 204 || status === 304 ? null : JSON.stringify(reply.body ?? {});
    return new Response(payload, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

function makeProvider(reply: { status?: number; body?: unknown }, extraCalendarIds: string[] = []) {
  const { calls, fetchImpl } = stubFetch(reply);
  const provider = new GoogleCalendarProvider({
    calendarId: CALENDAR_ID,
    getAccessToken: async () => TOKEN,
    extraCalendarIds,
    fetchImpl,
  });
  return { provider, calls };
}

const PAYLOAD = {
  bookingId: 'internal-id-not-used-in-event-body',
  serviceType: 'Kitchen Remodeling',
  fullName: 'John Smith',
  phone: '+18055551234',
  address: '123 Main Street, Santa Barbara, CA',
  start: new Date('2026-09-29T22:00:00Z'), // 3:00 PM PDT
  end: new Date('2026-09-29T23:00:00Z'),
  timezone: 'America/Los_Angeles',
  source: 'meta',
  campaign: 'kitchen-remodeling',
};

describe('event draft', () => {
  it('builds the title, location and description exactly as specified', () => {
    const draft = buildCalendarEventDraft(PAYLOAD);
    expect(draft.summary).toBe('Kitchen Remodeling Estimate \u2014 John Smith');
    expect(draft.location).toBe('123 Main Street, Santa Barbara, CA');
    expect(draft.description).toBe(
      [
        'Customer: John Smith',
        'Phone: +1 805 555 1234',
        'Address: 123 Main Street, Santa Barbara, CA',
        'Service: Kitchen Remodeling',
        '',
        'Source: Meta',
        'Campaign: kitchen-remodeling',
      ].join('\n'),
    );
    expect(draft.start).toEqual({ dateTime: '2026-09-29T15:00:00-07:00', timeZone: 'America/Los_Angeles' });
    expect(draft.end).toEqual({ dateTime: '2026-09-29T16:00:00-07:00', timeZone: 'America/Los_Angeles' });
  });

  it('falls back to "Direct" and omits an empty campaign line', () => {
    const draft = buildCalendarEventDraft({ ...PAYLOAD, source: null, campaign: null });
    expect(draft.description.endsWith('Source: Direct')).toBe(true);
    expect(draft.description).not.toContain('Campaign:');
  });
});

describe('GoogleCalendarProvider.getBusyRanges (inbound)', () => {
  it('calls freeBusy for the booking calendar and any extra calendars', async () => {
    const { provider, calls } = makeProvider(
      {
        body: {
          calendars: { [CALENDAR_ID]: { busy: [{ start: '2026-09-29T18:00:00Z', end: '2026-09-29T19:00:00Z' }] } },
        },
      },
      ['personal@example.com'],
    );

    const ranges = await provider.getBusyRanges(
      new Date('2026-09-28T00:00:00Z'),
      new Date('2026-10-02T00:00:00Z'),
    );

    expect(calls[0].url).toBe('https://www.googleapis.com/calendar/v3/freeBusy');
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);

    const body = JSON.parse(String(calls[0].init.body)) as {
      timeMin: string;
      timeMax: string;
      items: Array<{ id: string }>;
    };
    expect(body.timeMin).toBe('2026-09-28T00:00:00.000Z');
    expect(body.timeMax).toBe('2026-10-02T00:00:00.000Z');
    expect(body.items.map((item) => item.id)).toEqual([CALENDAR_ID, 'personal@example.com']);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.toISOString()).toBe('2026-09-29T18:00:00.000Z');
    expect(ranges[0].end.toISOString()).toBe('2026-09-29T19:00:00.000Z');
  });

  it('merges busy periods from every calendar and ignores malformed entries', async () => {
    const { provider } = makeProvider(
      {
        body: {
          calendars: {
            [CALENDAR_ID]: { busy: [{ start: '2026-09-29T18:00:00Z', end: '2026-09-29T19:00:00Z' }] },
            'personal@example.com': {
              busy: [
                { start: '2026-09-30T16:00:00Z', end: '2026-09-30T17:00:00Z' },
                { start: 'not-a-date', end: '2026-09-30T18:00:00Z' },
              ],
            },
          },
        },
      },
      ['personal@example.com'],
    );

    const ranges = await provider.getBusyRanges(
      new Date('2026-09-28T00:00:00Z'),
      new Date('2026-10-02T00:00:00Z'),
    );
    expect(ranges.map((range) => range.start.toISOString())).toEqual([
      '2026-09-29T18:00:00.000Z',
      '2026-09-30T16:00:00.000Z',
    ]);
  });

  it('throws a retryable error when Google is unavailable', async () => {
    const { provider } = makeProvider({ status: 503, body: { error: 'backend down' } });
    await expect(
      provider.getBusyRanges(new Date('2026-09-28T00:00:00Z'), new Date('2026-10-02T00:00:00Z')),
    ).rejects.toBeInstanceOf(CalendarProviderError);
  });
});

describe('GoogleCalendarProvider.createBookingEvent (outbound)', () => {
  it('inserts the appointment on the booking calendar and returns the event id', async () => {
    const { provider, calls } = makeProvider({
      body: { id: 'evt_abc', htmlLink: 'https://calendar.google.com/evt_abc' },
    });

    const result = await provider.createBookingEvent(PAYLOAD);

    expect(calls[0].url).toBe(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    );
    expect(calls[0].init.method).toBe('POST');

    const body = JSON.parse(String(calls[0].init.body)) as Record<string, unknown>;
    expect(body.summary).toBe('Kitchen Remodeling Estimate \u2014 John Smith');
    expect(body.location).toBe('123 Main Street, Santa Barbara, CA');
    expect(String(body.description)).toContain('Phone: +1 805 555 1234');
    expect(body.start).toEqual({ dateTime: '2026-09-29T15:00:00-07:00', timeZone: 'America/Los_Angeles' });
    // Internal ids are never written into the event.
    expect(JSON.stringify(body)).not.toContain('internal-id-not-used-in-event-body');

    expect(result).toEqual({
      provider: 'google',
      eventId: 'evt_abc',
      htmlLink: 'https://calendar.google.com/evt_abc',
    });
  });

  it('surfaces an error for a rejected insert', async () => {
    const { provider } = makeProvider({ status: 400, body: { error: { message: 'bad request' } } });
    await expect(provider.createBookingEvent(PAYLOAD)).rejects.toMatchObject({ name: 'CalendarProviderError' });
  });
});

describe('GoogleCalendarProvider.cancelBookingEvent (outbound)', () => {
  it('deletes the event and treats an already-deleted event as success', async () => {
    const ok = makeProvider({ status: 204, body: {} });
    await expect(ok.provider.cancelBookingEvent('evt_abc')).resolves.toBeUndefined();
    expect(ok.calls[0].init.method).toBe('DELETE');

    const gone = makeProvider({ status: 404, body: {} });
    await expect(gone.provider.cancelBookingEvent('evt_abc')).resolves.toBeUndefined();
  });

  it('throws when the delete fails for another reason', async () => {
    const failing = makeProvider({ status: 500, body: {} });
    await expect(failing.provider.cancelBookingEvent('evt_abc')).rejects.toBeInstanceOf(CalendarProviderError);
  });
});

describe('credentials', () => {
  it('does not invent Google credentials when the env is empty', async () => {
    const { readGoogleConfigFromEnv } = await import('@/app/lib/booking/google-auth');
    const saved = {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      calendar: process.env.GOOGLE_CALENDAR_ID,
    };
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    delete process.env.GOOGLE_CALENDAR_ID;
    expect(readGoogleConfigFromEnv()).toBeNull();

    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'booking@example.iam.gserviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----';
    process.env.GOOGLE_CALENDAR_ID = CALENDAR_ID;

    const config = readGoogleConfigFromEnv();
    expect(config?.calendarId).toBe(CALENDAR_ID);
    expect(config?.privateKey).toContain('\n'); // escaped newlines are normalized

    if (saved.email === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = saved.email;
    if (saved.key === undefined) delete process.env.GOOGLE_PRIVATE_KEY;
    else process.env.GOOGLE_PRIVATE_KEY = saved.key;
    if (saved.calendar === undefined) delete process.env.GOOGLE_CALENDAR_ID;
    else process.env.GOOGLE_CALENDAR_ID = saved.calendar;
  });
});

