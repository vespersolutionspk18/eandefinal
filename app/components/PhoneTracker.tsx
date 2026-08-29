'use client';

import { useEffect } from 'react';
import { ctaLocation, PHONE_NUMBER, trackConversion } from '@/app/lib/analytics';

// Digits-only form of the phone number, used to detect copies in any format
// (e.g. "(805) 590-0908", "805-590-0908", "+18055900908", "8055900908").
const PHONE_DIGITS = PHONE_NUMBER.replace(/\D/g, '');

function locationForNode(node: Node | null): string {
  if (!node || typeof node !== 'object') return 'page';
  const el = (node.nodeType === 1 ? (node as Element) : node.parentElement) as Element | null;
  if (!el) return 'page';
  // ctaLocation() expects an HTMLElement, but Element satisfies the union
  return ctaLocation(el as HTMLElement);
}

export default function PhoneTracker() {
  useEffect(() => {
    // 1) Click on a tel: link
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href^="tel:"]') as HTMLAnchorElement | null;
      if (!link) return;
      trackConversion('phone_click', {
        service: 'Bathroom Remodel',
        page: window.location.pathname,
        cta_location: ctaLocation(link),
        phone: PHONE_NUMBER,
      });
    };

    // 2) Copy of the phone number (anywhere on the page, any format)
    const copyHandler = (event: ClipboardEvent) => {
      const selection = window.getSelection?.()?.toString() || '';
      const fromClipboard = event.clipboardData?.getData('text/plain') || '';
      const combined = (selection + ' ' + fromClipboard).replace(/\D/g, '');
      if (!combined || !PHONE_DIGITS) return;
      // Match if the selection contains our digits, or our digits contain the selection
      // (the latter catches the case where the user copies a partial like "8055900908").
      if (!combined.includes(PHONE_DIGITS) && !PHONE_DIGITS.includes(combined)) return;

      const anchor =
        (window.getSelection?.()?.anchorNode as Node | null) ||
        (document.activeElement as Node | null);
      trackConversion('phone_copy', {
        service: 'Bathroom Remodel',
        page: window.location.pathname,
        cta_location: locationForNode(anchor),
        phone: PHONE_NUMBER,
        copy_source: fromClipboard ? 'clipboard' : 'selection',
      });
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('copy', copyHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('copy', copyHandler);
    };
  }, []);

  return null;
}
