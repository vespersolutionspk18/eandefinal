'use client';

import { useState, type RefObject } from 'react';
import DayStrip from './DayStrip';
import SlotGrid from './SlotGrid';
import { PHONE_DISPLAY, PHONE_NUMBER } from '@/app/lib/analytics';
import { formatDayLabel, formatNoticeWindow, formatTimeRange } from '@/app/lib/booking/time';
import type { AvailabilityResponse } from '@/app/lib/booking/types';

type Props = {
  availability: AvailabilityResponse | null;
  /** True while the first availability fetch is still in flight. */
  loading: boolean;
  /** True when the availability request failed and nothing is rendered yet. */
  failed: boolean;
  selectedStart: string | null;
  timezoneLabel: string;
  durationMinutes: number;
  minimumNoticeMinutes: number;
  submitting: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSelectSlot: (start: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onRetry: () => void;
};

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
 * STEP 2 — pick a date, pick a time, confirm.
 * Every slot shown here was produced by the server; tapping CONFIRM re-validates
 * it and claims it atomically, so a taken slot comes back as HTTP 409 and the
 * list is refreshed automatically by the parent.
 */
export default function ScheduleStep({
  availability,
  loading,
  failed,
  selectedStart,
  timezoneLabel,
  durationMinutes,
  minimumNoticeMinutes,
  submitting,
  headingRef,
  onSelectSlot,
  onConfirm,
  onBack,
  onRetry,
}: Props) {
  const days = availability?.dates ?? [];
  // The date the visitor explicitly picked; null until they do.
  const [requestedDate, setRequestedDate] = useState<string | null>(null);

  /**
   * Active date, derived instead of effect-driven: keep the visitor's explicit
   * choice (even a "Full" day, so they see why), otherwise land on the first
   * day that still has times, or simply the first day.
   */
  const activeDate =
    requestedDate && days.some((day) => day.date === requestedDate)
      ? requestedDate
      : (days.find((day) => day.slots.length > 0) ?? days[0])?.date ?? null;

  const activeDay = days.find((day) => day.date === activeDate) ?? null;
  const totalSlots = days.reduce((sum, day) => sum + day.slots.length, 0);

  // The appointment the visitor has picked, if the server still offers it.
  // (Plain loop: the React Compiler memoizes this automatically.)
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

  return (
    <div className="bk-step-body">
      <h2 className="bk-heading" ref={headingRef} tabIndex={-1}>
        Choose a Date &amp; Time
      </h2>
      <p className="bk-lede">
        A {durationMinutes}-minute visit at your property. Times shown in {timezoneLabel}.
      </p>

      {loading && !availability && <ScheduleSkeleton />}

      {failed && !availability && (
        <div className="bk-empty">
          <p>We couldn&apos;t load the available times.</p>
          <div className="bk-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost bk-back" type="button" onClick={onBack}>
              BACK
            </button>
            <button className="btn btn-primary bk-cta" type="button" onClick={onRetry}>
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
          <div className="bk-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost bk-back" type="button" onClick={onBack}>
              BACK
            </button>
            <a className="btn btn-call bk-cta" href={`tel:${PHONE_NUMBER}`}>
              CALL {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}

      {availability && totalSlots > 0 && (
        <>
          <p className="bk-label">Choose a date</p>
          <DayStrip days={days} selectedDate={activeDate} onSelect={setRequestedDate} />

          <p className="bk-label bk-label-row">
            Choose a time
            <span className="bk-tz">Times shown in {timezoneLabel}</span>
          </p>
          <SlotGrid
            disabled={submitting}
            selectedStart={selectedStart}
            slots={activeDay?.slots ?? []}
            timeZone={availability.timezone}
            onSelect={onSelectSlot}
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

          <div className="bk-actions">
            <button className="btn btn-ghost bk-back" disabled={submitting} type="button" onClick={onBack}>
              BACK
            </button>
            <button
              className="btn btn-primary bk-cta"
              disabled={!selection || submitting}
              type="button"
              onClick={onConfirm}
            >
              {submitting ? 'BOOKING…' : 'CONFIRM BOOKING'}
            </button>
          </div>

          <p className="bk-note">
            Free estimate · No obligation · Bookings close {formatNoticeWindow(minimumNoticeMinutes)} before a
            start time.
          </p>
        </>
      )}
    </div>
  );
}
