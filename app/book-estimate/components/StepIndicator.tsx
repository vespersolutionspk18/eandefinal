'use client';

import type { BookingStep } from './BookingFlow';

type Props = { current: BookingStep };

const STEPS: Array<{ id: BookingStep; label: string }> = [
  { id: 'details', label: 'Your Details' },
  { id: 'schedule', label: 'Date & Time' },
  { id: 'confirmed', label: 'Confirmed' },
];

/** Compact 3-dot progress rail (the third dot is the confirmation state). */
export default function StepIndicator({ current }: Props) {
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.id === current),
  );

  return (
    <ol className="bk-steps">
      {STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        return (
          <li
            aria-current={isCurrent ? 'step' : undefined}
            className={`bk-step${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}
            key={step.id}
          >
            <span aria-hidden="true" className="bk-step-dot">
              {isDone ? '\u2713' : index + 1}
            </span>
            <span className="bk-step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
