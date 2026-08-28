import Link from 'next/link';
import Image from 'next/image';
import { PHONE_DISPLAY, PHONE_NUMBER } from '@/app/lib/analytics';

const SERVICES = [
  { href: '/bathroom-remodeling', label: 'Bathroom Remodeling' },
  { href: '/kitchen-remodeling', label: 'Kitchen Remodeling' },
  { href: '/landscaping', label: 'Landscaping' },
  { href: '/adu-garage-conversion', label: 'ADU / Garage Conversion' },
  { href: '/whole-home-remodeling', label: 'Whole-Home Remodeling' },
];

const COMPANY = [
  { href: '/about', label: 'About E&E' },
  { href: '/gallery', label: 'Project Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer-full">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand-block">
              <Image
                alt="E&E Home Remodeling logo"
                className="footer-logo"
                height={54}
                src="/footerlogo.webp"
                width={80}
              />
              <div>
                <div className="footer-name" style={{ color: '#fff' }}>E&amp;E Home Remodeling</div>
              </div>
            </div>
            <p className="footer-tagline">
              Family-owned for 25+ years. Kitchens, bathrooms, ADUs, garage conversions, and whole-home
              remodeling across Ventura, Santa Barbara, and the San Fernando Valley.
            </p>
            <div className="footer-contact">
              <span>Call for a free quote</span>
              <a href={`tel:${PHONE_NUMBER}`}>
                <strong>{PHONE_DISPLAY}</strong>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link href={c.href}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            ©2025 E &amp; E Home Remodeling Company. All rights reserved. - General Contractor CA Lic #1087571.
          </div>
          <div>
            <Link href="/contact">Contact</Link> · <Link href="/about">About</Link> · <Link href="/gallery">Gallery</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
