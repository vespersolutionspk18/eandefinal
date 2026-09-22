// ============================================================================
// BOOKING API CLIENT (browser side)
// ----------------------------------------------------------------------------
// The only place the booking UI talks to the network. Always same-origin: the
// browser never sees the database, the Google credentials or the calendar id.
// ============================================================================

import type {
  ApiErrorBody,
  ApiErrorCode,
  AvailabilityResponse,
  BookingRequestPayload,
  BookingSuccessBody,
} from './types';

export type ApiFailure = {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
};

export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

const NETWORK_FAILURE: ApiFailure = {
  ok: false,
  status: 0,
  code: 'server_error',
  message: 'We could not reach the booking system. Please check your connection and try again.',
};

async function parseFailure(response: Response): Promise<ApiFailure> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }

  return {
    ok: false,
    status: response.status,
    code: body?.error?.code ?? (response.status === 429 ? 'rate_limited' : 'server_error'),
    message:
      body?.error?.message ??
      (response.status === 429
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'Something went wrong on our side. Please try again.'),
    fields: body?.error?.fields,
  };
}

/** `GET /api/booking/availability` */
export async function fetchAvailability(
  options: { fromDateKey?: string; days?: number; signal?: AbortSignal } = {},
): Promise<ApiResult<AvailabilityResponse>> {
  const params = new URLSearchParams();
  if (options.fromDateKey) params.set('from', options.fromDateKey);
  if (options.days) params.set('days', String(options.days));
  const query = params.toString();

  try {
    const response = await fetch(`/api/booking/availability${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: options.signal,
    });
    if (!response.ok) return parseFailure(response);
    return { ok: true, data: (await response.json()) as AvailabilityResponse };
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    return NETWORK_FAILURE;
  }
}

/** `POST /api/booking` */
export async function submitBooking(
  payload: BookingRequestPayload,
  options: { requestId?: string; signal?: AbortSignal } = {},
): Promise<ApiResult<BookingSuccessBody>> {
  try {
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.requestId ? { 'x-booking-request-id': options.requestId } : {}),
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    if (!response.ok) return parseFailure(response);
    return { ok: true, data: (await response.json()) as BookingSuccessBody };
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    return NETWORK_FAILURE;
  }
}
