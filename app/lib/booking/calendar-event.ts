// ============================================================================
// CALENDAR EVENT CONTENT
// ----------------------------------------------------------------------------
// The exact wording of the appointment that appears on the calendar. Kept in
// one place so the local provider, the Google provider and the tests all
// describe the appointment identically.
// ============================================================================

import { formatPhoneSpaced } from './validation';
import { toZonedIsoString } from './time';
import type { CalendarEventPayload } from './calendar-provider';

export type CalendarEventDraft = {
  summary: string;
  location: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
};

/** `"meta"` → `"Meta"`, `null` → `"Direct"`. */
export function describeSourceLabel(source: string | null | undefined): string {
  const value = (source ?? '').trim();
  if (!value) return 'Direct';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Title:   `Kitchen Remodeling Estimate — John Smith`
 * Location: the customer's property address
 * Description:
 *   Customer: John Smith
 *   Phone: +1 805 555 1234
 *   Address: 123 Main Street, Santa Barbara, CA
 *   Service: Kitchen Remodeling
 *
 *   Source: Meta
 *   Campaign: kitchen-remodeling
 */
export function buildCalendarEventDraft(payload: CalendarEventPayload): CalendarEventDraft {
  const lines = [
    `Customer: ${payload.fullName}`,
    `Phone: ${formatPhoneSpaced(payload.phone)}`,
    `Address: ${payload.address}`,
    `Service: ${payload.serviceType}`,
    '',
    `Source: ${describeSourceLabel(payload.source)}`,
  ];
  if (payload.campaign) lines.push(`Campaign: ${payload.campaign}`);

  return {
    summary: `${payload.serviceType} Estimate \u2014 ${payload.fullName}`,
    location: payload.address,
    description: lines.join('\n'),
    start: { dateTime: toZonedIsoString(payload.start, payload.timezone), timeZone: payload.timezone },
    end: { dateTime: toZonedIsoString(payload.end, payload.timezone), timeZone: payload.timezone },
  };
}
