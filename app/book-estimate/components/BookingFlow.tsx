'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import CustomerDetailsStep from './CustomerDetailsStep';
import ScheduleStep from './ScheduleStep';
import ConfirmationStep from './ConfirmationStep';
import StepIndicator from './StepIndicator';
import { detailsStore } from './details-store';
import { fetchAvailability, submitBooking } from '@/app/lib/booking/client-api';
import {
  buildAttribution,
  deriveCampaign,
  deriveSource,
  readStoredAttribution,
  storeAttribution,
  type BookingAttribution,
} from '@/app/lib/booking/attribution';
import { validateCustomerDetails, type CustomerDetails } from '@/app/lib/booking/validation';
import {
  trackBookingConflict,
  trackBookingConfirmed,
  trackBookingError,
  trackBookingSlotSelected,
  trackBookingStep,
  trackBookingView,
} from '@/app/lib/booking/tracking';
import type { AvailabilityResponse, BookingConfirmation } from '@/app/lib/booking/types';

export type BookingStep = 'details' | 'schedule' | 'confirmed';

export type ServiceOption = { id: string; label: string };

export type DetailsForm = {
  fullName: string;
  phone: string;
  address: string;
  /** Service type id (`kitchen`); normalized to its label by the shared validation. */
  serviceType: string;
};

type FormField = keyof DetailsForm;
type Notice = { tone: 'error' | 'info'; message: string };

type Props = {
  serviceTypes: ServiceOption[];
  timezoneLabel: string;
  durationMinutes: number;
  minimumNoticeMinutes: number;
  horizonDays: number;
  /** `?service=` from the ad link, resolved on the server before render. */
  defaultServiceId?: string;
};

const FORM_FIELDS: readonly FormField[] = ['fullName', 'phone', 'address', 'serviceType'];

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}


export default function BookingFlow({
  serviceTypes,
  timezoneLabel,
  durationMinutes,
  minimumNoticeMinutes,
  horizonDays,
  defaultServiceId,
}: Props) {
  // Step 1 answers live in an external store (session storage) so they survive
  // a refresh or a back navigation without hydration tricks.
  const form = useSyncExternalStore(
    detailsStore.subscribe,
    detailsStore.getSnapshot,
    detailsStore.getServerSnapshot,
  );

  const [step, setStep] = useState<BookingStep>('details');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const requestIdRef = useRef<string | null>(null);
  const attributionRef = useRef<BookingAttribution>({});
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // The `?service=` preselect never needs to become state: it is only used while
  // the customer has not chosen a project type themselves.
  const effectiveService = form.serviceType || defaultServiceId || '';

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

  // Keep screen readers and mobile keyboards on the active step.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // Refresh availability when the visitor returns to the tab, so slots that
  // have passed the notice window are dropped and newly-freed slots appear.
  useEffect(() => {
    if (step !== 'schedule') return;
    const onVisible = () => {
      if (!document.hidden) setAvailabilityVersion((v) => v + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [step]);

  // ---------------------------------------------------------------------------
  // Availability always comes from the server; the UI never decides what is
  // bookable. Re-fetched when entering the step and after a conflict.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (step !== 'schedule') return;
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
  }, [step, availabilityVersion, horizonDays]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const updateField = useCallback((field: FormField, value: string) => {
    detailsStore.set({ ...detailsStore.getSnapshot(), [field]: value });
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }, []);

  const handleContinue = useCallback(() => {
    const result = validateCustomerDetails({
      ...detailsStore.getSnapshot(),
      serviceType: effectiveService,
    });
    if (!result.ok) {
      setFieldErrors(result.errors);
      setNotice({ tone: 'error', message: 'Please check the highlighted fields.' });
      return;
    }
    setFieldErrors({});
    setNotice(null);
    setDetails(result.value);
    setStep('schedule');
    trackBookingStep('schedule');
  }, [effectiveService]);

  const handleBack = useCallback(() => {
    setStep('details');
    setNotice(null);
    trackBookingStep('details');
  }, []);

  const handleSelectSlot = useCallback((start: string) => {
    setSelectedStart(start);
    setNotice(null);
    trackBookingSlotSelected({ start });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!details || !selectedStart || submitting) return;
    const attribution = attributionRef.current;

    // Same idempotency key for every retry of this attempt: a double click or a
    // flaky connection can never create two bookings.
    const requestId = requestIdRef.current ?? newRequestId();
    requestIdRef.current = requestId;
    setSubmitting(true);
    setNotice(null);

    const result = await submitBooking(
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

    if (result.ok) {
      requestIdRef.current = null;
      setConfirmation(result.data.booking);
      setStep('confirmed');
      trackBookingConfirmed(result.data.booking, attribution);
      return;
    }

    trackBookingError(result.code, { status: result.status });

    // Somebody else claimed the slot between rendering and confirming.
    if (result.status === 409 || result.code === 'slot_taken') {
      setSelectedStart(null);
      setNotice({ tone: 'error', message: result.message });
      trackBookingConflict({ status: result.status });
      setAvailabilityVersion((value) => value + 1);
      return;
    }

    // Server-side field validation failed (e.g. phone) — send them back.
    if (result.fields && FORM_FIELDS.some((field) => result.fields?.[field])) {
      setFieldErrors(result.fields);
      setStep('details');
      setNotice({ tone: 'error', message: result.message });
      return;
    }

    setSelectedStart(null);
    setNotice({ tone: 'error', message: result.message });
    setAvailabilityVersion((value) => value + 1);
  }, [details, selectedStart, submitting]);

  return (
    <div className="bk-card">
      <StepIndicator current={step} />

      {notice && (
        <div className={`bk-alert is-${notice.tone}`} role="alert">
          <span aria-hidden="true" className="bk-alert-ic" />
          <p>{notice.message}</p>
        </div>
      )}

      {step === 'details' && (
        <CustomerDetailsStep
          defaultServiceId={defaultServiceId}
          errors={fieldErrors}
          form={form}
          headingRef={headingRef}
          serviceTypes={serviceTypes}
          onChange={updateField}
          onSubmit={handleContinue}
        />
      )}

      {step === 'schedule' && (
        <ScheduleStep
          availability={availability}
          durationMinutes={durationMinutes}
          failed={availabilityStatus === 'error'}
          headingRef={headingRef}
          loading={availability === null && availabilityStatus !== 'error'}
          minimumNoticeMinutes={minimumNoticeMinutes}
          selectedStart={selectedStart}
          submitting={submitting}
          timezoneLabel={timezoneLabel}
          onBack={handleBack}
          onConfirm={handleConfirm}
          onRetry={() => setAvailabilityVersion((value) => value + 1)}
          onSelectSlot={handleSelectSlot}
        />
      )}

      {step === 'confirmed' && confirmation && (
        <ConfirmationStep booking={confirmation} timezoneLabel={timezoneLabel} />
      )}
    </div>
  );
}


