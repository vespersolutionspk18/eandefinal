'use client';

import { formatTimeLabel } from '@/app/lib/booking/time';
import type { AvailabilitySlot } from '@/app/lib/booking/types';

type Props = {
  slots: AvailabilitySlot[];
  timeZone: string;
  selectedStart: string | null;
  disabled?: boolean;
  onSelect: (start: string) => void;
};

/** Time buttons for the active day. Only server-provided slots are rendered. */
export default function SlotGrid({ slots, timeZone, selectedStart, disabled, onSelect }: Props) {
  if (slots.length === 0) {
    return <p className="bk-empty">No times left on this day — try another date.</p>;
  }

  return (
    <div aria-label="Choose a time" className="bk-times" role="group">
      {slots.map((slot) => {
        const isActive = slot.start === selectedStart;
        return (
          <button
            aria-pressed={isActive}
            className={`bk-time${isActive ? ' is-active' : ''}`}
            disabled={disabled}
            key={slot.start}
            type="button"
            onClick={() => onSelect(slot.start)}
          >
            {formatTimeLabel(new Date(slot.start), timeZone)}
          </button>
        );
      })}
    </div>
  );
}
