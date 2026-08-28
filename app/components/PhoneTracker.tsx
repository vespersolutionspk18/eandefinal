'use client';

import { useEffect } from 'react';
import { ctaLocation, PHONE_NUMBER, trackConversion } from '@/app/lib/analytics';

export default function PhoneTracker() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
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
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}
