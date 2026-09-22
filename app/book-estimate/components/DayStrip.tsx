'use client';

import { useCallback } from 'react';
import { formatDayParts } from '@/app/lib/booking/time';
import type { AvailabilityDay } from '@/app/lib/booking/types';

type Props = {
  days: AvailabilityDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
};

/**
 * Mobile-first date carousel: a horizontally scrollable strip of day chips
 * (weekday + day + month + how many times are open). Deliberately not a giant
 * month grid — most ad traffic arrives on a phone.
 */
export default function DayStrip({ days, selectedDate, onSelect }: Props) {
  // Stable callback so React does not detach/re-attach the ref on every render.
  const activeRef = useCallback((node: HTMLButtonElement | null) => {
    node?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  return (
    <div aria-label="Choose a date" className="bk-days-scroll" role="group">
      <div className="bk-days">
        {days.map((day) => {
          const parts = formatDayParts(day.date);
          const isActive = day.date === selectedDate;
          const isEmpty = day.slots.length === 0;
          return (
            <button
              aria-pressed={isActive}
              className={`bk-day${isActive ? ' is-active' : ''}${isEmpty ? ' is-empty' : ''}`}
              key={day.date}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(day.date)}
            >
              <span className="bk-day-wd">{parts.weekday}</span>
              <span className="bk-day-num">{parts.day}</span>
              <span className="bk-day-mo">{parts.month}</span>
              <span className="bk-day-count">
                {isEmpty ? 'Full' : `${day.slots.length} open`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
