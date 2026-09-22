// ============================================================================
// BOOKING ANALYTICS / META TRACKING HOOKS (browser side)
// ----------------------------------------------------------------------------
// One place where the booking funnel reports events. Today they go to the
// existing Google Ads / GA4 (`trackConversion` → dataLayer + gtag + the
// `ee:<event>` DOM event) and to `fbq` when a Meta Pixel is present.
//
// Nothing here calls Meta's API directly and no pixel id is invented: if the
// pixel is not installed, `fbq` is simply absent and the calls are skipped.
// The Conversions API is intentionally server-side and lives behind
// `META_CAPI_ACCESS_TOKEN` — see BOOKING_SETUP.md → "Meta Ads Integration — TODO".
//
// This is THE place to attach the Meta `Schedule` conversion: see
// `trackBookingConfirmed()`.
// ============================================================================

import { trackConversion } from '@/app/lib/analytics';
import type { BookingConfirmation } from './types';
import type { BookingAttribution } from './attribution';
import { deriveCampaign, deriveSource } from './attribution';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /** Optional hook so the pixel can be wired without touching components. */
    eeTrackScheduleConversion?: (payload: Record<string, unknown>) => void;
  }
}

export const BOOKING_EVENTS = {
  pageView: 'booking_page_view',
  stepView: 'booking_step_view',
  slotSelected: 'booking_slot_selected',
  conflict: 'booking_conflict',
  error: 'booking_error',
  confirmed: 'booking_confirmed',
} as const;

/** Standard Meta pixel events this flow maps onto. */
export const META_EVENTS = {
  viewContent: 'ViewContent',
  lead: 'Lead',
  schedule: 'Schedule',
} as const;

export type BookingStepName = 'details' | 'schedule' | 'confirmed';

function track(eventName: string, detail: Record<string, unknown>): void {
  trackConversion(eventName, detail);
}

/** Step 2 entry / page view — the `ViewContent` equivalent for the ad funnel. */
export function trackBookingView(attribution: BookingAttribution): void {
  const detail = {
    source: deriveSource(attribution),
    campaign: deriveCampaign(attribution),
    page: typeof window === 'undefined' ? undefined : window.location.pathname,
  };
  track(BOOKING_EVENTS.pageView, detail);
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', META_EVENTS.viewContent, { content_name: 'Book Estimate' });
  }
}

export function trackBookingStep(step: BookingStepName, detail: Record<string, unknown> = {}): void {
  track(BOOKING_EVENTS.stepView, { step, ...detail });
}

/** Someone picked a time (usually a strong intent signal in ad reporting). */
export function trackBookingSlotSelected(detail: Record<string, unknown>): void {
  track(BOOKING_EVENTS.slotSelected, detail);
}

/** HTTP 409 — the slot was claimed by somebody else first. */
export function trackBookingConflict(detail: Record<string, unknown> = {}): void {
  track(BOOKING_EVENTS.conflict, detail);
}

export function trackBookingError(code: string, detail: Record<string, unknown> = {}): void {
  track(BOOKING_EVENTS.error, { code, ...detail });
}

/** Payload shared by the browser event and (later) the server-side CAPI call. */
export function buildSchedulePayload(
  booking: BookingConfirmation,
  attribution: BookingAttribution,
): Record<string, unknown> {
  return {
    service: booking.serviceType,
    appointment_start: booking.start,
    appointment_end: booking.end,
    timezone: booking.timezone,
    source: deriveSource(attribution),
    campaign: deriveCampaign(attribution),
    value: 0,
    currency: 'USD',
  };
}

/**
 * A booking was confirmed.
 * → dataLayer / gtag / `ee:booking_confirmed`
 * → Meta pixel `Schedule` (only if the pixel is installed)
 * → `window.eeTrackScheduleConversion` for any additional wiring
 * Server-side Conversions API is a separate, later step (documented TODO).
 */
export function trackBookingConfirmed(booking: BookingConfirmation, attribution: BookingAttribution): void {
  const payload = buildSchedulePayload(booking, attribution);
  track(BOOKING_EVENTS.confirmed, payload);

  if (typeof window === 'undefined') return;

  if (typeof window.fbq === 'function') {
    window.fbq('track', META_EVENTS.schedule, payload);
  }

  if (typeof window.eeTrackScheduleConversion === 'function') {
    window.eeTrackScheduleConversion(payload);
  }
}
