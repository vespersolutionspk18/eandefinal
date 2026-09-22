// ============================================================================
// GET /api/booking/availability
// ----------------------------------------------------------------------------
// Returns the bookable slots for the next `horizon` days, calculated entirely
// server-side from the central booking configuration, the existing bookings and
// whatever the calendar provider reports as busy.
//
// ?from=YYYY-MM-DD  optional first date to report
// ?days=30          optional window length (clamped to the booking horizon)
// ============================================================================

import { NextResponse } from 'next/server';
import { getBookingService } from '@/app/lib/booking/booking-service.server';
import { BOOKING_CONFIG } from '@/app/lib/booking/config';
import { ensureBookingSchema } from '@/app/lib/booking/migrate';
import { isMemoryBookingStore } from '@/app/lib/booking/repository.server';
import { availabilityRateLimiter, clientKeyFromRequest } from '@/app/lib/booking/rate-limit';
import { isValidDateKey } from '@/app/lib/booking/time';
import type { ApiErrorBody, AvailabilityResponse } from '@/app/lib/booking/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function errorResponse(status: number, code: ApiErrorBody['error']['code'], message: string) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status, headers: NO_STORE });
}

export async function GET(request: Request): Promise<NextResponse<AvailabilityResponse | ApiErrorBody>> {
  const limit = availabilityRateLimiter.check(clientKeyFromRequest(request));
  if (!limit.ok) {
    return NextResponse.json<ApiErrorBody>(
      { error: { code: 'rate_limited', message: 'Too many requests. Please try again shortly.' } },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const daysParam = url.searchParams.get('days');

  const fromDateKey = from && isValidDateKey(from) ? from : undefined;
  const parsedDays = daysParam ? Number.parseInt(daysParam, 10) : Number.NaN;
  const days = Number.isFinite(parsedDays)
    ? Math.min(Math.max(parsedDays, 1), BOOKING_CONFIG.bookingHorizonDays)
    : undefined;

  // `BOOKING_STORE=memory` runs without Postgres, so there is no schema to check.
  if (!isMemoryBookingStore()) {
    try {
      await ensureBookingSchema();
    } catch (error) {
      console.error('[booking] database unavailable:', error);
      return errorResponse(503, 'not_configured', 'Booking is temporarily unavailable. Please try again shortly.');
    }
  }

  try {
    const availability = await getBookingService().getAvailability({ fromDateKey, days });
    return NextResponse.json(availability, { headers: NO_STORE });
  } catch (error) {
    console.error('[booking] availability failed:', error);
    return errorResponse(503, 'server_error', 'We could not load available times. Please try again.');
  }
}
