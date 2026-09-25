'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DayStrip from './DayStrip';
import SlotGrid from './SlotGrid';
import ConfirmationStep from './ConfirmationStep';
import { fetchAvailability, submitBooking } from '@/app/lib/booking/client-api';
import {
  buildAttribution,
  deriveCampaign,
  deriveSource,
  readStoredAttribution,
  storeAttribution,
  type BookingAttribution,
} from '@/app/lib/booking/attribution';
import { formatPhoneInput, validateCustomerDetails, type CustomerDetails } from '@/app/lib/booking/validation';
import {
  formatDayLabel,
  formatNoticeWindow,
  formatTimeRange,
} from '@/app/lib/booking/time';
import {
  trackBookingConfirmed,
  trackBookingConflict,
  trackBookingError,
  trackBookingSlotSelected,
  trackBookingView,
} from '@/app/lib/booking/tracking';
import { BOOKING_SERVICE_TYPES } from '@/app/lib/booking/config';
import type { AvailabilityResponse, BookingConfirmation } from '@/app/lib/booking/types';

export type ServiceOption = { id: string; label: string };

type FormField = 'fullName' | 'phone' | 'address';

type Props = {
  serviceTypes: ServiceOption[];
  timezoneLabel: string;
  durationMinutes: number;
  minimumNoticeMinutes: number;
  horizonDays: number;
  /** `?service=` from the ad link, resolved on the server before render. */
  defaultServiceId?: string;
};

type Notice = { tone: 'error' | 'info'; message: string };

const FALLBACK_SERVICE_ID = 'other';

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ScheduleSkeleton() {
  return (
    <div aria-hidden="true" className="bk-skeleton">
      <div className="bk-skel-days">
        {Array.from({ length: 5 }, (_, index) => (
          <span className="bk-skel bk-skel-day" key={index} />
        ))}
      </div>
      <div className="bk-skel-times">
        {Array.from({ length: 6 }, (_, index) => (
          <span className="bk-skel bk-skel-time" key={index} />
        ))}
      </div>
      <p className="bk-sr">Loading available times…</p>
    </div>
  );
}

/**
 * Booking funnel — single step.
 *
 * Layout, top to bottom:
 *   1. Date / time picker (server-provided slots only).
 *   2. Selected time summary.
 *   3. Contact fields: name, phone, property address.
 *   4. Submit.
 *
 * `serviceType` is required server-side but never asked of the visitor; it is
 * silently sourced from `?service=` (paid ads) or falls back to "other" so
 * organic traffic still books cleanly. The confirmation screen replaces the
 * form on success — that is the result, not a step.
 */
export default function BookingFlow({
  serviceTypes,
  timezoneLabel,
  durationMinutes,
  minimumNoticeMinutes,
  horizonDays,
  defaultServiceId,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField | 'serviceType', string>>>({});

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const requestIdRef = useRef<string | null>(null);
  const attributionRef = useRef<BookingAttribution>({});

  // Pick a service up-front: paid ads arrive with `?service=`, organic visitors
  // get the catch-all so the booking always submits cleanly.
  const serviceTypeId =
    (defaultServiceId && BOOKING_SERVICE_TYPES.some((s) => s.id === defaultServiceId) && defaultServiceId) ||
    FALLBACK_SERVICE_ID;

  // ---------------------------------------------------------------------------
  // On mount: capture ad attribution once. Only external systems are touched
  // (session storage, analytics) — nothing here triggers a re-render.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const search = window.location.search;
    const referrerHost = (() => {
      try {
        if (!document.referrer) return null;
        const host = new URL(document.referrer).hostname;
        return host && host !== window.location.hostname ? host : null;
      } catch {
        return null;
      }
    })();

    const merged = buildAttribution({ search, referrerHost, stored: readStoredAttribution() });
    merged.landing_page = window.location.pathname;
    attributionRef.current = merged;
    storeAttribution(merged);
    trackBookingView(merged);
  }, []);

  // Refresh availability when the visitor returns to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setAvailabilityVersion((v) => v + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // ---------------------------------------------------------------------------
  // Availability always comes from the server; the UI never decides what is
  // bookable. Re-fetched on mount and after a conflict.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchAvailability({ days: horizonDays, signal: controller.signal })
      .then((result) => {
        if (cancelled || controller.signal.aborted) return;
        if (result.ok) {
          setAvailability(result.data);
          setAvailabilityStatus('ready');
        } else {
          setAvailabilityStatus('error');
          setNotice({ tone: 'error', message: result.message });
        }
      })
      .catch(() => {
        /* aborted */
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [availabilityVersion, horizonDays]);

  const days = availability?.dates ?? [];
  const activeDate =
    selectedDate && days.some((day) => day.date === selectedDate)
      ? selectedDate
      : (days.find((day) => day.slots.length > 0) ?? days[0])?.date ?? null;
  const activeDay = days.find((day) => day.date === activeDate) ?? null;
  const totalSlots = days.reduce((sum, day) => sum + day.slots.length, 0);

  let selection: { day: (typeof days)[number]; slot: (typeof days)[number]['slots'][number] } | null = null;
  if (selectedStart && availability) {
    for (const day of availability.dates) {
      const slot = day.slots.find((candidate) => candidate.start === selectedStart);
      if (slot) {
        selection = { day, slot };
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    // Switching days invalidates the previously picked time.
    setSelectedStart(null);
    setNotice(null);
  }, []);

  const handleSelectSlot = useCallback((start: string) => {
    setSelectedStart(start);
    setNotice(null);
    trackBookingSlotSelected({ start });
  }, []);

  const handleRetryAvailability = useCallback(() => {
    setNotice(null);
    setAvailabilityVersion((value) => value + 1);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const result = validateCustomerDetails({
        fullName,
        phone,
        address,
        serviceType: serviceTypeId,
      });
      if (!result.ok) {
        setFieldErrors(result.errors);
        setNotice({ tone: 'error', message: 'Please check the highlighted fields.' });
        return;
      }
      if (!selectedStart) {
        setNotice({ tone: 'error', message: 'Pick a date and time above.' });
        return;
      }

      setFieldErrors({});
      setNotice(null);
      setSubmitting(true);

      const details: CustomerDetails = result.value;
      const attribution = attributionRef.current;

      // Same idempotency key for every retry of this attempt: a double click or
      // a flaky connection can never create two bookings.
      const requestId = requestIdRef.current ?? newRequestId();
      requestIdRef.current = requestId;

      const submission = await submitBooking(
        {
          fullName: details.fullName,
          phone: details.phone,
          address: details.address,
          serviceType: details.serviceType,
          startTime: selectedStart,
          source: deriveSource(attribution) ?? 'website',
          campaign: deriveCampaign(attribution) ?? undefined,
          attribution,
          requestId,
        },
        { requestId },
      );

      setSubmitting(false);

      if (submission.ok) {
        requestIdRef.current = null;
        setConfirmation(submission.data.booking);
        trackBookingConfirmed(submission.data.booking, attribution);
        return;
      }

      trackBookingError(submission.code, { status: submission.status });

      // Somebody else claimed the slot between rendering and confirming.
      if (submission.status === 409 || submission.code === 'slot_taken') {
        setSelectedStart(null);
        setNotice({ tone: 'error', message: submission.message });
        trackBookingConflict({ status: submission.status });
        setAvailabilityVersion((value) => value + 1);
        return;
      }

      // Server-side field validation failed — show inline errors.
      if (submission.fields) {
        setFieldErrors(submission.fields);
        setNotice({ tone: 'error', message: submission.message });
        return;
      }

      setNotice({ tone: 'error', message: submission.message });
      setAvailabilityVersion((value) => value + 1);
    },
    [address, fullName, phone, selectedStart, serviceTypeId, submitting],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (confirmation) {
    return (
      <ConfirmationStep booking={confirmation} timezoneLabel={timezoneLabel} />
    );
  }

  const phoneDigits = phone.replace(/\D+/g, '');
  const phoneLooksValid = phoneDigits.length === 10 || (phoneDigits.length === 11 && phoneDigits.startsWith('1'));
  const nameLooksValid = fullName.trim().length >= 2;
  const addressLooksValid = address.trim().length >= 6 && /\d/.test(address);
  const canSubmit =
    Boolean(selectedStart) && nameLooksValid && phoneLooksValid && addressLooksValid && !submitting;

  return (
    <form className="bk-form" noValidate onSubmit={handleSubmit}>
      <h2 className="bk-heading">Book Your Free Estimate</h2>
      <p className="bk-lede">
        Choose a time and tell us where to meet you. We&apos;ll come out for a {durationMinutes}-minute
        visit to walk the project with you.
      </p>

      {notice && (
        <div className={`bk-alert is-${notice.tone}`} role="alert">
          <span aria-hidden="true" className="bk-alert-ic" />
          <p>{notice.message}</p>
        </div>
      )}

      <p className="bk-label">Pick a date</p>
      {(availability === null && availabilityStatus !== 'error') && <ScheduleSkeleton />}

      {availabilityStatus === 'error' && !availability && (
        <div className="bk-empty">
          <p>We couldn&apos;t load the available times.</p>
          <div className="bk-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary bk-cta" type="button" onClick={handleRetryAvailability}>
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {availability && totalSlots === 0 && (
        <div className="bk-empty">
          <p>
            There are no open appointment times in the next {availability.horizonDays} days. Call us and
            we&apos;ll find a time that works.
          </p>
        </div>
      )}

      {availability && totalSlots > 0 && (
        <>
          <DayStrip days={days} selectedDate={activeDate} onSelect={handleSelectDate} />

          <p className="bk-label bk-label-row">
            Pick a time
            <span className="bk-tz">Times shown in {timezoneLabel}</span>
          </p>
          <SlotGrid
            disabled={submitting}
            selectedStart={selectedStart}
            slots={activeDay?.slots ?? []}
            timeZone={availability.timezone}
            onSelect={handleSelectSlot}
          />

          {selection && (
            <div className="bk-summary" role="status">
              <span className="bk-summary-label">Selected</span>
              <span className="bk-summary-value">
                {formatDayLabel(selection.day.date)} ·{' '}
                {formatTimeRange(new Date(selection.slot.start), new Date(selection.slot.end), availability.timezone)}
              </span>
            </div>
          )}
        </>
      )}

      <div className="f-field">
        <label htmlFor="bk-name">Full Name</label>
        <input
          aria-describedby={fieldErrors.fullName ? 'bk-name-err' : undefined}
          aria-invalid={fieldErrors.fullName ? true : undefined}
          autoComplete="name"
          id="bk-name"
          name="fullName"
          type="text"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            if (fieldErrors.fullName) setFieldErrors((current) => ({ ...current, fullName: undefined }));
          }}
        />
        {fieldErrors.fullName && (
          <p className="bk-field-err" id="bk-name-err">
            {fieldErrors.fullName}
          </p>
        )}
      </div>

      <div className="f-field">
        <label htmlFor="bk-phone">Phone Number</label>
        <input
          aria-describedby={fieldErrors.phone ? 'bk-phone-err' : undefined}
          aria-invalid={fieldErrors.phone ? true : undefined}
          autoComplete="tel"
          id="bk-phone"
          inputMode="tel"
          name="phone"
          placeholder="(805) 555-1234"
          type="tel"
          value={phone}
          onChange={(event) => {
            setPhone(formatPhoneInput(event.target.value));
            if (fieldErrors.phone) setFieldErrors((current) => ({ ...current, phone: undefined }));
          }}
        />
        {fieldErrors.phone && (
          <p className="bk-field-err" id="bk-phone-err">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="f-field">
        <label htmlFor="bk-address">Property Address</label>
        <input
          aria-describedby={fieldErrors.address ? 'bk-address-err' : undefined}
          aria-invalid={fieldErrors.address ? true : undefined}
          autoComplete="street-address"
          id="bk-address"
          name="address"
          placeholder="123 Main Street, Santa Barbara, CA"
          type="text"
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            if (fieldErrors.address) setFieldErrors((current) => ({ ...current, address: undefined }));
          }}
        />
        {fieldErrors.address && (
          <p className="bk-field-err" id="bk-address-err">
            {fieldErrors.address}
          </p>
        )}
      </div>

      {/* Service type is required server-side but never asked of the visitor:
          paid ads carry `?service=` and organic traffic falls back to "other". */}
      <input name="serviceType" type="hidden" value={serviceTypeId} />

      <div className="bk-actions">
        <button className="btn btn-primary bk-cta" disabled={!canSubmit} type="submit">
          {submitting ? 'BOOKING…' : 'CONFIRM BOOKING'}
        </button>
      </div>

      <p className="bk-note">
        Free estimate · No obligation · Bookings close {formatNoticeWindow(minimumNoticeMinutes)} before a
        start time.
      </p>
    </form>
  );
}
