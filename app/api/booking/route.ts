// ============================================================================
// POST /api/booking
// ----------------------------------------------------------------------------
// Creates the appointment. Everything is validated and recalculated here:
// the browser's duration, end time, weekday, timezone and "availability" are
// all ignored. The slot is claimed atomically in Postgres, so two visitors can
// never hold the same appointment; the loser gets HTTP 409.
//
// Request  (see BookingRequestPayload)
//   { fullName, phone, address, serviceType, startTime, source?, campaign?,
//     attribution?, requestId? }
// Response
//   201 { booking: { status, start, end, timezone, fullName, phone, address, serviceType } }
//   400 { error: { code: 'validation_error' | 'slot_unavailable', fields } }
//   409 { error: { code: 'slot_taken' } }
// ============================================================================

import { NextResponse } from 'next/server';
import { getBookingService } from '@/app/lib/booking/booking-service.server';
import { ensureBookingSchema } from '@/app/lib/booking/migrate';
import { isMemoryBookingStore } from '@/app/lib/booking/repository.server';
import { bookingRateLimiter, clientKeyFromRequest } from '@/app/lib/booking/rate-limit';
import type { ApiErrorBody, BookingSuccessBody } from '@/app/lib/booking/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const MAX_BODY_BYTES = 8 * 1024;

function errorResponse(status: number, code: ApiErrorBody['error']['code'], message: string, fields?: Record<string, string>) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, fields } }, { status, headers: NO_STORE });
}

export async function POST(request: Request): Promise<NextResponse<BookingSuccessBody | ApiErrorBody>> {
  const limit = bookingRateLimiter.check(clientKeyFromRequest(request));
  if (!limit.ok) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'rate_limited',
          message: 'Too many booking attempts. Please wait a moment and try again.',
        },
      },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return errorResponse(413, 'validation_error', 'That request was too large.');
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, 'validation_error', 'We could not read that request. Please try again.');
  }

  if (!payload || typeof payload !== 'object') {
    return errorResponse(400, 'validation_error', 'Please fill in your details and choose a time.');
  }

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
    const result = await getBookingService().createBooking(payload, {
      requestId: request.headers.get('x-booking-request-id'),
    });

    if (!result.ok) {
      return errorResponse(result.status, result.code, result.message, result.fields);
    }
    return NextResponse.json<BookingSuccessBody>({ booking: result.booking }, { status: result.status, headers: NO_STORE });
  } catch (error) {
    console.error('[booking] unexpected failure:', error);
    return errorResponse(500, 'server_error', 'Something went wrong. Please try again or call us.');
  }
}
