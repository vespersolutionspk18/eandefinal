// Google Ads / Analytics conversion tracking helpers.
// Mirrors the original inline script's `eeTrackConversion` and
// `eeCtaLocation` helpers so existing GTM/GA4 wiring keeps working.

export type ConversionDetail = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    eeTrackConversion?: (eventName: string, detail?: ConversionDetail) => void;
    eeGoogleAdsLeadConversion?: () => void;
    eeT?: (english: string) => string;
  }
}

export function trackConversion(eventName: string, detail: ConversionDetail = {}): void {
  if (typeof window === 'undefined') return;

  const payload: Record<string, unknown> = { event: eventName, ...detail };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, detail);
  }

  try {
    document.dispatchEvent(new CustomEvent('ee:' + eventName, { detail }));
  } catch {
    /* older browsers */
  }
}

export function ctaLocation(link: HTMLElement): string {
  if (link.closest('.hdr')) return 'header';
  if (link.closest('.hero')) return 'hero';
  if (link.closest('.gal-sec')) return 'gallery_cta';
  if (link.closest('.wcy')) return 'why_choose';
  if (link.closest('.band')) return 'mid_page_cta';
  const vid = document.querySelector('[aria-labelledby="vid-h"]');
  if (vid && link.closest('[aria-labelledby="vid-h"]')) return 'video_cta';
  if (link.closest('.aa-final')) return 'final_form';
  if (link.closest('.site-footer')) return 'footer';
  if (link.closest('.mbar')) return 'mobile_sticky_bar';
  return 'page';
}

export const PHONE_NUMBER = '+18055900908';
export const PHONE_DISPLAY = '(805) 590-0908';
export const SERVICE_NAME = 'Bathroom Remodel';
