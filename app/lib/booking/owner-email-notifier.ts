// ============================================================================
// OWNER EMAIL NOTIFICATIONS (server-side)
// ----------------------------------------------------------------------------
// Sends a simple internal email whenever a booking is confirmed. This uses the
// Resend HTTP API directly via `fetch`, so there is no extra package and no
// browser exposure of email credentials.
//
// Required env vars to enable:
//   RESEND_API_KEY
//   BOOKING_OWNER_EMAIL
//   BOOKING_EMAIL_FROM
//
// If any required env var is missing, the notifier is a no-op. Email is a
// convenience notification only: failures are logged by BookingService but do
// not cancel or roll back an already-confirmed appointment.
// ============================================================================

import type { BookingRecord } from './repository';
import { dateKeyInTimeZone, formatDayLabel, formatTimeRange } from './time';
import { formatPhoneDisplay } from './validation';

const RESEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails';

export type OwnerEmailSettings = {
  apiKey: string;
  ownerEmail: string;
  fromEmail: string;
  replyTo?: string;
};

export type OwnerEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export type OwnerEmailSendResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' };

function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Reads notification settings from env. Missing config means email is disabled. */
export function readOwnerEmailSettingsFromEnv(): OwnerEmailSettings | null {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const ownerEmail = cleanEnv(process.env.BOOKING_OWNER_EMAIL);
  const fromEmail = cleanEnv(process.env.BOOKING_EMAIL_FROM);
  const replyTo = cleanEnv(process.env.BOOKING_EMAIL_REPLY_TO);

  if (!apiKey || !ownerEmail || !fromEmail) return null;
  return { apiKey, ownerEmail, fromEmail, ...(replyTo ? { replyTo } : {}) };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sourceLine(booking: BookingRecord): string {
  const source = booking.source ? booking.source : 'direct';
  return booking.campaign ? `${source} / ${booking.campaign}` : source;
}

export function buildOwnerBookingEmail(booking: BookingRecord): OwnerEmailContent {
  const dateKey = dateKeyInTimeZone(booking.startTime, booking.timezone);
  const date = formatDayLabel(dateKey);
  const time = formatTimeRange(booking.startTime, booking.endTime, booking.timezone);
  const phone = formatPhoneDisplay(booking.phone);
  const source = sourceLine(booking);
  const subject = `New estimate booking — ${booking.serviceType} — ${booking.fullName}`;

  const textLines = [
    'A new estimate was booked from the website.',
    '',
    `Date: ${date}`,
    `Time: ${time}`,
    `Name: ${booking.fullName}`,
    `Phone: ${phone}`,
    `Property Address: ${booking.address}`,
    `Project Type: ${booking.serviceType}`,
    `Source: ${source}`,
  ];

  if (booking.googleEventId) textLines.push(`Google Event ID: ${booking.googleEventId}`);

  const rows = [
    ['Date', date],
    ['Time', time],
    ['Name', booking.fullName],
    ['Phone', phone],
    ['Property Address', booking.address],
    ['Project Type', booking.serviceType],
    ['Source', source],
    ...(booking.googleEventId ? [['Google Event ID', booking.googleEventId]] : []),
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5f6b72;font-weight:700;white-space:nowrap;">${escapeHtml(
          label,
        )}</td><td style="padding:6px 0;color:#102f37;font-weight:700;">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#102f37;line-height:1.5;">
      <h2 style="margin:0 0 12px;font-size:22px;">New estimate booking</h2>
      <p style="margin:0 0 16px;color:#5f6b72;">A customer booked an estimate from the website.</p>
      <table role="presentation" style="border-collapse:collapse;">${htmlRows}</table>
    </div>
  `.trim();

  return { subject, text: textLines.join('\n'), html };
}

export async function sendOwnerBookingEmail(
  booking: BookingRecord,
  options: {
    settings?: OwnerEmailSettings | null;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<OwnerEmailSendResult> {
  const settings = options.settings ?? readOwnerEmailSettingsFromEnv();
  if (!settings) return { sent: false, reason: 'not_configured' };

  const content = buildOwnerBookingEmail(booking);
  const response = await (options.fetchImpl ?? fetch)(RESEND_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: settings.fromEmail,
      to: [settings.ownerEmail],
      subject: content.subject,
      text: content.text,
      html: content.html,
      ...(settings.replyTo ? { reply_to: settings.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Owner email notification failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return { sent: true };
}
