'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PHONE_DISPLAY, PHONE_NUMBER } from '@/app/lib/analytics';

type Props = {
  active?: 'home' | 'bathroom' | 'kitchen' | 'landscaping' | 'adu' | 'whole-home' | 'gallery' | 'about' | 'contact';
};

const SERVICES = [
  { href: '/bathroom-remodeling', label: 'Bathroom Remodeling', key: 'bathroom' as const },
  { href: '/kitchen-remodeling', label: 'Kitchen Remodeling', key: 'kitchen' as const },
  { href: '/landscaping', label: 'Landscaping', key: 'landscaping' as const },
  { href: '/adu-garage-conversion', label: 'ADU / Garage Conversion', key: 'adu' as const },
  { href: '/whole-home-remodeling', label: 'Whole-Home Remodeling', key: 'whole-home' as const },
];

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02Z" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

export default function SiteHeader({ active }: Props) {
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    if (!servicesOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target && !target.closest('.nav-services')) setServicesOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [servicesOpen]);

  const linkClass = (key: NonNullable<Props['active']>) =>
    `nav-link ${active === key ? 'is-active' : ''}`.trim();

  return (
    <header className="site-header-nav">
      <div className="site-header-nav-in">
        <Link aria-label="E&E Home Remodeling home" className="site-header-logo" href="/">
          <Image
            alt="E&E Home Remodeling logo"
            src="/eelogo.png"
            width={158}
            height={38}
            priority
          />
        </Link>
        <nav aria-label="Primary" className="site-nav">
          <div className="nav-services">
            <button
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              className={`nav-link nav-link-button ${SERVICES.some((s) => s.key === active) ? 'is-active' : ''}`}
              type="button"
              onClick={() => setServicesOpen((v) => !v)}
            >
              Services
              <CaretIcon />
            </button>
            <div className={`nav-dropdown ${servicesOpen ? 'is-open' : ''}`} role="menu">
              {SERVICES.map((s) => (
                <Link
                  aria-current={active === s.key ? 'page' : undefined}
                  className={`nav-dropdown-link ${active === s.key ? 'is-active' : ''}`}
                  href={s.href}
                  key={s.href}
                  role="menuitem"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
          <Link className={linkClass('gallery')} href="/gallery">
            Gallery
          </Link>
          <Link className={linkClass('about')} href="/about">
            About
          </Link>
          <Link className={linkClass('contact')} href="/contact">
            Contact
          </Link>
        </nav>
        <div className="site-header-right">
          <div aria-label="Language selector" className="lang-toggle" role="group">
            <button
              aria-pressed="true"
              className="lang-btn active"
              data-lang="en"
              type="button"
            >
              EN
            </button>
            <button
              aria-pressed="false"
              className="lang-btn"
              data-lang="es"
              type="button"
            >
              ES
            </button>
          </div>
          <a
            aria-label={`Call E&E Home Remodeling at ${PHONE_DISPLAY}`}
            className="hdr-tel"
            href={`tel:${PHONE_NUMBER}`}
          >
            <PhoneIcon />
            {PHONE_DISPLAY}
          </a>
          <a className="btn btn-call btn-sm" href={`tel:${PHONE_NUMBER}`}>
            CALL NOW
          </a>
          <a
            className="btn btn-primary btn-sm"
            data-short-label="FREE QUOTE"
            href="#quote"
          >
            GET A FREE QUOTE
          </a>
        </div>
      </div>
    </header>
  );
}
