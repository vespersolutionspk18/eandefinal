# Booking Setup — `/book-estimate`

Customer-facing appointment booking for `/book-estimate`, the landing page used by
paid Meta traffic. Everything happens on this website: no Calendly, no Google
Calendar redirect, no external booking page.

- **Public route:** `/book-estimate` (`app/book-estimate/page.tsx`)
- **API:** `GET /api/booking/availability`, `POST /api/booking`
- **Database:** PostgreSQL (Neon) accessed with raw SQL — no ORM
- **Time zone:** `America/Los_Angeles`, DST-safe (never a fixed UTC offset)

---

## 1. Architecture

```
Meta ad
  → /book-estimate                      (app/book-estimate/page.tsx)
  → BookingFlow (client)                (app/book-estimate/components/*)
       Step 1  CustomerDetailsStep      → shared validation (app/lib/booking/validation.ts)
       Step 2  ScheduleStep             → GET /api/booking/availability
       Step 3  ConfirmationStep
  → /api/booking/availability           (app/api/booking/availability/route.ts)
  → /api/booking                        (app/api/booking/route.ts)
  → BookingService                      (app/lib/booking/booking-service.ts)
       ├─ rule engine                   (app/lib/booking/slots.ts + config.ts + time.ts)
       ├─ CalendarProvider              (local today · Google when configured)
       └─ BookingRepository             (Postgres · memory for tests)
  → Postgres `bookings` table           (app/lib/booking/schema.ts)
```

Nothing in the browser decides whether a slot is bookable. The client renders
exactly what the server returns, and the server re-validates and re-checks the
calendar before it writes anything.

## 2. Booking configuration

**One file:** `app/lib/booking/config.ts`

```ts
export const BOOKING_CONFIG = {
  timezone: 'America/Los_Angeles',   // IANA — DST handled automatically
  allowedWeekdays: [0, 1, 2, 3, 4],  // Sun–Thu (0 = Sunday); Friday/Saturday closed
  openingTime: '09:00',
  closingTime: '20:00',
  appointmentDurationMinutes: 60,
  slotIntervalMinutes: 60,
  bookingHorizonDays: 30,
  minimumNoticeMinutes: 120,
};
```

The same file also holds `BOOKING_SERVICE_TYPES` (the Service / Project Type
options, aligned with the site's service pages and reused as `?service=` slugs).
Change business hours or the horizon there and every layer — UI copy, API,
validation, tests — follows.

Derived rule: the last appointment starts at `closingTime −
appointmentDurationMinutes`, so with 09:00–20:00 and 60-minute appointments the
last start is **7:00 PM** (ending 8:00 PM).

## 3. Database model

`app/lib/booking/schema.ts` holds all DDL as plain SQL.

`bookings`

| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | `gen_random_uuid()` |
| `full_name` | text | |
| `phone` | text | E.164, e.g. `+18055900908` |
| `address` | text | property address |
| `service_type` | text | e.g. `Kitchen Remodeling` |
| `start_time` / `end_time` | timestamptz | stored in UTC |
| `slot_key` | text | UTC ISO start instant — the uniqueness anchor |
| `timezone` | text | `America/Los_Angeles` |
| `status` | text | `confirmed` \| `cancelled` |
| `google_event_id` | text null | filled once Google Calendar is connected |
| `google_synced_at` | timestamptz null | |
| `source` / `campaign` | text null | e.g. `meta` / `kitchen-remodeling` |
| `attribution` | jsonb | utm_*, fbclid, gclid, referrer, landing_page |
| `request_id` | text null | idempotency key from the browser |
| `created_at` / `updated_at` | timestamptz | |

Security objects:

1. `bookings_active_slot_key_uniq` — **partial unique index** on `slot_key`
   `WHERE status <> 'cancelled'`.
2. `bookings_no_overlap` — `EXCLUDE USING gist (tstzrange(start_time, end_time)
   WITH &&) WHERE (status <> 'cancelled')` (btree_gist). Backstop that rejects any
   overlap, even between bookings with different start times.
3. `bookings_request_id_uniq` — unique `request_id` for idempotent retries.

Migrations are idempotent and run automatically on the first API request
(`app/lib/booking/migrate.ts`). To run them manually / from CI:

```bash
npm run db:migrate        # node scripts/db-migrate.mjs  (reads DATABASE_URL)
```

## 4. API

### `GET /api/booking/availability`

Optional `?from=YYYY-MM-DD`, `?days=30` (clamped to the horizon).

```json
{
  "timezone": "America/Los_Angeles",
  "timezoneLabel": "Pacific Time",
  "generatedAt": "2026-09-21T15:00:00.000Z",
  "durationMinutes": 60,
  "slotIntervalMinutes": 60,
  "minimumNoticeMinutes": 120,
  "horizonDays": 30,
  "dates": [
    { "date": "2026-09-27", "weekday": 0,
      "slots": [{ "start": "2026-09-27T11:00:00-07:00", "end": "2026-09-27T12:00:00-07:00" }] }
  ]
}
```

Only allowed weekdays are returned; a day with nothing left keeps an empty
`slots` array so the UI can show "Full" instead of hiding the gap. Friday and
Saturday are never returned. `Cache-Control: no-store`.

### `POST /api/booking`

```json
{
  "fullName": "John Smith",
  "phone": "+18055551234",
  "address": "123 Main Street, Santa Barbara, CA",
  "serviceType": "Kitchen Remodeling",
  "startTime": "2026-09-29T15:00:00-07:00",
  "source": "meta",
  "campaign": "kitchen-remodeling",
  "attribution": { "utm_source": "meta", "fbclid": "..." },
  "requestId": "8ac1…"
}
```

Server rules — client values for duration, end time, weekday, timezone and
"availability" are **ignored**:

| check | failure |
| --- | --- |
| field validation (name, US phone, address, service type) | `400 validation_error` + `fields` |
| offset-qualified ISO start matching the zone offset | `400 validation_error` |
| grid alignment, 9:00–20:00, Sun–Thu, horizon, minimum notice | `400 slot_unavailable` |
| live calendar re-check (existing bookings + Google busy) | `409 slot_taken` |
| atomic claim loses the race | `409 slot_taken` |
| calendar event could not be created (slot released again) | `502 calendar_error` |
| calendar could not be verified / database unavailable | `503` |
| too many attempts (6 per minute per IP) | `429 rate_limited` |

Success → `201 { "booking": { status, start, end, timezone, timezoneLabel,
fullName, phone, address, serviceType } }` — no ids, no technical fields.

## 5. How availability is calculated

`app/lib/booking/slots.ts` (pure functions, unit tested):

1. Start from `today` in `America/Los_Angeles`, walk the horizon, skip weekdays
   that are not in `allowedWeekdays`.
2. Build the day's grid from `openingTime` to `closingTime − duration`, stepping
   by `slotIntervalMinutes` (`generateDaySlots`). Local wall-clock times are
   converted with `Intl`-based helpers, so the UTC offset follows DST and
   non-existent DST-gap times are dropped.
3. Drop slots inside `minimumNoticeMinutes`, in the past, or overlapping a busy
   range reported by the calendar provider.
4. Return the remaining slots as offset-qualified ISO strings.

## 6. How double booking is prevented

Two independent layers; the second is what actually guarantees it.

1. **The service re-checks and validates** (`evaluateSlotRequest`) right before
   writing — cheap and produces good error messages. If the calendar provider
   cannot be reached, booking *fails closed* (`503`) rather than guessing.
2. **The database claims the slot atomically:**

   ```sql
   INSERT INTO bookings (…, slot_key, …) VALUES (…)
   ON CONFLICT (slot_key) WHERE status <> 'cancelled' DO NOTHING
   RETURNING …
   ```

   Postgres serialises concurrent inserts on the partial unique index; one
   request gets a row, the others get zero rows → `SlotTakenError` → `HTTP 409` →
   the UI shows *"That time was just booked. Please choose another available
   time."* and refreshes availability. The `EXCLUDE` constraint catches any
   overlap that is not an identical start.
3. **Idempotency:** the browser sends a `requestId` (body + `x-booking-request-id`
   header); a double click or a retried request returns the original booking
   instead of creating a second one (`bookings_request_id_uniq`).

   Note the two conflict targets are *not* the same thing. `ON CONFLICT` only
   covers `slot_key`, so when a retry carrying an **already-used `requestId`**
   loses the insert it trips `bookings_request_id_uniq` instead and Postgres
   raises `23505` rather than returning zero rows. `PostgresBookingRepository.create`
   therefore re-reads `findByRequestId()` inside its `catch` before concluding
   "slot taken" — otherwise a double-click would report *"That time was just
   booked"* against the customer's own request.

Verified against the live database: 8 simultaneous inserts for one slot produce
exactly 1 booking, and 8 simultaneous retries sharing one `requestId` all return
that same booking (`tests/booking/postgres.test.ts`).

> **Availability window:** `BookingService.getAvailability` reads busy ranges up
> to the start of the day *after* the horizon's last date, in
> `America/Los_Angeles` — not a UTC midnight. A UTC cutoff lands mid-day locally
> (19:00 PDT is 02:00Z the next day), which would hide the final evening's
> bookings and advertise them as free.

---

## 7. Google Calendar Integration — TODO

When `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`
are set, `calendar-provider.server.ts` automatically swaps in the Google provider:

```
LocalCalendarProvider (busy source)
GoogleCalendarProvider (busy source + event writer)
→ CompositeCalendarProvider
```

What needs to be implemented:

1. **Inbound** — `GoogleCalendarProvider.getBusyRanges()` calls the Google
   `freeBusy` API and merges busy periods from the booking calendar (and any
   `GOOGLE_EXTRA_CALENDAR_IDS`) so Google-busy time never appears on the website.
2. **Outbound** — `GoogleCalendarProvider.createBookingEvent()` inserts the
   appointment after the DB slot is claimed. The returned `event.id` is stored on
   the booking row (`google_event_id`).
3. **Cancellation** — `cancelBookingEvent()` removes the Google event when a
   booking is cancelled or when the calendar write fails and the slot is released.

The JWT token provider (`google-auth.ts`) already signs and exchanges the service
account key; the event draft builder (`calendar-event.ts`) already formats the
title, location and description exactly as specified.

Required environment variables:

| variable | purpose |
| --- | --- |
| `GOOGLE_CALENDAR_ID` | Calendar to read/write, e.g. `xxx@group.calendar.google.com` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account client email |
| `GOOGLE_PRIVATE_KEY` | PEM private key (literal `\n` sequences are normalised) |
| `GOOGLE_EXTRA_CALENDAR_IDS` | Optional extra calendars whose busy time blocks slots |

Files involved: `app/lib/booking/google-auth.ts`, `google-calendar-provider.ts`,
`calendar-event.ts`, `calendar-provider.server.ts`.

---

## 8. Meta Ads Integration — TODO

The booking flow already captures and stores attribution (`utm_source`,
`utm_campaign`, `fbclid`, …) on every booking row. The tracking hooks
(`app/lib/booking/tracking.ts`) fire browser-side events via:

* `dataLayer` / `gtag` — already wired to the site's existing GA4 setup
* `window.fbq` — fires `ViewContent` on page view and `Schedule` on confirmed
  booking **when a Meta Pixel is installed**
* `window.eeTrackScheduleConversion` — optional custom hook

What needs to be implemented:

1. **Install the Meta Pixel** — add the pixel base code to the site (e.g. in
   `app/layout.tsx` or via GTM). Once `window.fbq` exists, `tracking.ts` starts
   firing automatically.
2. **Server-side Conversions API** — create a server action or route that sends
   the `Schedule` event to Meta's CAPI using the stored attribution and booking
   data. Trigger it from `BookingService.createBooking()` on success.

Required environment variables:

| variable | purpose |
| --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Pixel ID for the browser base code |
| `META_CAPI_ACCESS_TOKEN` | Server-side CAPI token |
| `META_CAPI_TEST_EVENT_CODE` | Optional test event code for CAPI debugging |

Files involved: `app/lib/booking/tracking.ts`, `attribution.ts`,
`booking-service.ts` (attach CAPI call on successful booking).

