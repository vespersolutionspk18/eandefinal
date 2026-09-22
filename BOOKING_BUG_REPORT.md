# `/book-estimate` — bug audit

Date: 2026-09-22
Scope: read the whole booking implementation, then verify it live
(`tsc --noEmit`, `eslint`, `vitest run`, `next build`, and a `next start`
smoke test of both API routes).

## Verification baseline (all green)

| check | result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | 5 errors — **all pre-existing** in `app/components/{GTag,Gallery,LeadForm,ServiceGallery}.tsx`, none in booking code |
| `npx vitest run` | 83 passed / 6 files (incl. 11 live Neon integration tests) |
| `TZ=Australia/Sydney vitest run` | still green — the suite is not host-timezone dependent |
| `npx next build` | success, 24 routes; `/book-estimate` dynamic, both API routes `ƒ` |

Live API probes (all correct):

* Fri / Sat / 20:00 start / 08:00 start / off-grid 15:30 / wrong offset `-08:00`
  / beyond horizon / inside the 2-hour notice / past → **400**
* Tuesday 19:00 (ends 20:00) → **201**
* same slot again → **409** `slot_taken` with the exact required copy
* booked slots disappear from `GET /api/booking/availability`
* oversized body → **413**, 7th request in a minute → **429**
* `?service=bathroom` pre-selects "Bathroom Remodeling" in the SSR markup

So the security/scheduling core is sound. The items below are the real
defects found.

---

## HIGH

### 1. `BOOKING_STORE=memory` is documented but does not work

`app/api/booking/route.ts:65` and `app/api/booking/availability/route.ts:49`
both call `ensureBookingSchema()` unconditionally. `ensureBookingSchema()`
(`app/lib/booking/migrate.ts:90`) rejects immediately when `DATABASE_URL` is
unset — even though `repository.server.ts` explicitly supports the in-memory
store.

Reproduced: started the server with `DATABASE_URL= BOOKING_STORE=memory` →
both endpoints return `503 {"code":"not_configured"}`.

Fix: skip `ensureBookingSchema()` when `process.env.BOOKING_STORE === 'memory'`.
(Either drop the feature from `.env.example`/`repository.server.ts`, or make the
routes honour it.)

### 2. The booking rate limit is too tight and counts failures

`app/lib/booking/rate-limit.ts:67` — 6 requests / 60 s / IP on `POST /api/booking`.
Every retry counts, including 409 conflicts and 400 validation errors.
Reproduced: 1 success + 5 conflicts, then `429`.

Meta traffic is mobile, and mobile carriers share egress IPs (CGNAT), so one
visitor's retries can lock out unrelated visitors on the same IP — and a
customer who hits two conflicts then retries is told to "wait a moment" on a
paid-ad landing page.

Suggested: raise the window budget (e.g. 10–15/min) and/or only count requests
that actually created a booking, plus fingerprint on something softer than a
bare IP.

---

## MEDIUM

### 3. Empty / failed availability is a dead end (no BACK button)

`app/book-estimate/components/ScheduleStep.tsx:108-127` — both the
"couldn't load the available times" branch and the "no open appointment times
in the next N days" branch render only a CTA (TRY AGAIN / CALL). There is no
way back to Step 1, so a visitor who lands on a fully-booked horizon is stuck.

### 4. `DayStrip` re-scrolls on every render

`app/book-estimate/components/DayStrip.tsx:30-36` — the ref is an inline arrow
function, so React detaches/re-attaches it on **every** commit and
`scrollIntoView` fires every time `ScheduleStep` re-renders — i.e. every time
the visitor taps a time slot. Hold the callback in `useRef`, or move the scroll
into a `useEffect` keyed on the active date.

### 5. `referrer` and `landing_page` are never persisted

`BookingFlow.tsx:102-114` computes `referrerHost`, but `submitBooking()` never
sends it, so `booking-service.ts:193-195` always receives
`referrerHost: null`. `landing_page` is never set anywhere either. Both keys are
allowed by `ATTRIBUTION_KEYS` and both columns exist in
`bookings.attribution`, so they are permanently empty.

Fix: add `referrerHost?: string` to `BookingRequestPayload`, send it from
`BookingFlow`, and set `landing_page` server-side from the request path.

### 6. Project type silently defaults to "Kitchen Remodeling"

`CustomerDetailsStep.tsx:111` and `BookingFlow.tsx:94` fall back to
`serviceTypes[0]?.id` (`kitchen`). The select therefore always has a value, so
the "Choose a project type" error is unreachable, and ad traffic without
`?service=` is recorded as *Kitchen Remodeling* regardless of the ad. Add an
explicit empty `<option>` and require a choice.

### 7. Booking horizon is off by one between UI and API

`getHorizonEndDateKey()` = today + `bookingHorizonDays` (today + 30), and
`evaluateSlotRequest` accepts anything up to that; `computeAvailability` only
returns 30 dates (today … today + 29). The last day the API would accept is
never offered. Pick one definition.

### 8. `scroll-snap-type` is on the wrong element

`app/globals.css:4923` puts `scroll-snap-type: x mandatory` on `.bk-days` (the
flex row) instead of the scroll container `.bk-days-scroll` (line 4912), so the
`scroll-snap-align: center` on `.bk-day` does nothing.

### 9. Idempotency key returns PII

`booking-service.ts:187-190` — a request carrying a known `requestId` returns
the full name, phone and address of that booking with no other proof of
ownership. Practically safe (UUIDv4, unguessable) but the header
`x-booking-request-id` is trusted blindly. Consider binding the key to the
visitor (cookie/session) or returning a minimal confirmation.

---

## LOW

### 10. `BOOKING_SETUP.md` is missing the two required TODO sections

The file ends at §6 (216 lines). Required but absent:

* `Google Calendar Integration — TODO` — referenced by name in
  `google-auth.ts`, `google-calendar-provider.ts` and `.env.example`
* `Meta Ads Integration — TODO` — referenced by name in `tracking.ts`
* required future environment variables
* exact files/modules involved

### 11. Dead / duplicated code

`SLOT_TAKEN_MESSAGE` (`types.ts:91`) duplicates `SLOT_TAKEN_REASON`
(`slots.ts:90`); `formatFullDateLabel`, `BOOKING_SERVICE_TYPE_LABELS`,
`describeAttribution`, `execute()` (`db.ts:85`), `migrationPlan()`
(`schema.ts:88`) and the `*ForTests` setters are never used.

### 12. No internal link to `/book-estimate`

`sitemap.ts:13` lists it, but no header, CTA band, footer or sticky bar links
to it — only ad traffic can reach the page. Probably intentional; worth a
decision.

### 13. `.env.example` advertises `GOOGLE_WEBHOOK_TOKEN`

No push-notification/webhook route exists, so the variable is inert.

### 14. Availability never re-polls while Step 2 is open

If a visitor idles on the date picker past the 2-hour notice window, the early
slots silently go invalid and they only learn on CONFIRM (400 `slot_unavailable`
→ generic notice + refresh). Consider a refresh when the tab regains focus.

### 15. Stale leftover row in the live database

`bookings` contains one row: `full_name = 'Testing'`,
`slot_key = 2026-09-22T17:00:00.000Z` (10:00 AM PDT today), `status = confirmed`.
It blocks that slot. Delete it:

```sql
DELETE FROM bookings WHERE full_name = 'Testing';
```

---

## Not bugs (verified working)

* DST: IANA `America/Los_Angeles` everywhere via `Intl`; no fixed offsets;
  DST-gap local times are dropped; tests assert the offset flips.
* Double booking: partial unique index on `slot_key` +
  `ON CONFLICT … DO NOTHING`, EXCLUDE/gist overlap backstop, request-id
  idempotency. Verified live: 6 concurrent attempts → 1 booking, 5 × 409.
* No secrets in the client bundle — no `'use client'` file imports `db`,
  `postgres-repository`, `google-auth` or any `*.server` module.
* Attribution (utm_*, fbclid) survives the flow via session storage and is
  stored on the row.
* Server ignores client-supplied duration / end time / weekday / timezone.
