'use client';

import Script from 'next/script';

declare global {
  interface Window {
    eeGoogleAdsLeadConversion?: () => void;
  }
}

export default function GTag() {
  const fireLeadConversion = () => {
    const gtag = window.gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        send_to: 'AW-18384454921/PGvyCN7E-eMcEImKsr5E',
      });
    }
  };

  // Expose globally so LeadForm can call after a successful submit.
  if (typeof window !== 'undefined') {
    window.eeGoogleAdsLeadConversion = fireLeadConversion;
  }

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18384454921"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18384454921');
        `}
      </Script>
    </>
  );
}
