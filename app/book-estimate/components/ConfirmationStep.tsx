'use client';

import { PHONE_DISPLAY, PHONE_NUMBER } from '@/app/lib/analytics';
import { formatPhoneDisplay } from '@/app/lib/booking/validation';
import { formatDayLabel, formatTimeRange } from '@/app/lib/booking/time';
import type { BookingConfirmation } from '@/app/lib/booking/types';

type Props = {
  booking: BookingConfirmation;
  timezoneLabel: string;
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z" />
    </svg>
  );
}

/**
 * STEP 3: confirmation.
 * Shows the appointment back to the customer in plain language. No database id,
 * no technical detail, no external calendar link.
 */
export default function ConfirmationStep({ booking, timezoneLabel }: Props) {
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  // `booking.start` is an offset-qualified instant in the booking time zone, so
  // its first ten characters are the correct local calendar date.
  const dateKey = booking.start.slice(0, 10);

  return (
    <div aria-live="polite" className="bk-confirm" role="status">
      <span aria-hidden="true" className="bk-check">
        <CheckIcon />
      </span>
      <h2 className="bk-heading bk-heading-center">
        Your in-house consultation session has been booked.
      </h2>
      <p className="bk-lede bk-lede-center">
        We&apos;ve added your visit to the calendar. We&apos;ll see you at your property on the
        date and time above.
      </p>

      <dl className="bk-details">
        <div className="bk-detail">
          <dt>Date</dt>
          <dd>{formatDayLabel(dateKey)}</dd>
        </div>
        <div className="bk-detail">
          <dt>Time</dt>
          <dd>
            {formatTimeRange(start, end, booking.timezone)}{' '}
            <span className="bk-tz">({timezoneLabel})</span>
          </dd>
        </div>
        <div className="bk-detail">
          <dt>Name</dt>
          <dd>{booking.fullName}</dd>
        </div>
        <div className="bk-detail">
          <dt>Phone</dt>
          <dd>{formatPhoneDisplay(booking.phone)}</dd>
        </div>
        <div className="bk-detail">
          <dt>Property Address</dt>
          <dd>{booking.address}</dd>
        </div>
        <div className="bk-detail">
          <dt>Project Type</dt>
          <dd>{booking.serviceType}</dd>
        </div>
      </dl>

      <div className="bk-actions">
        <a className="btn btn-call bk-cta" href={`tel:${PHONE_NUMBER}`}>
          CALL {PHONE_DISPLAY}
        </a>
      </div>
      <p className="bk-note">A member of our team will confirm the visit before the appointment.</p>
    </div>
  );
}
