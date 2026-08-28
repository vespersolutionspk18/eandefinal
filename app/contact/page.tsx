import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import LeadForm, { PHONE_DISPLAY } from '../components/LeadForm';
import { PHONE_NUMBER } from '../lib/analytics';

export const metadata: Metadata = {
  title: 'Contact E&E Home Remodeling | Get a Free 3D Design | (805) 590-0908',
  description:
    'Contact E&E Home Remodeling for a free consultation and 3D design. Kitchen, bath, ADU, and whole-home remodeling across Ventura, Santa Barbara, and Los Angeles. Call (805) 590-0908.',
};

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h-5v-2h3V7h2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.4l-8 5-8-5zm0 2.7 8 5 8-5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <PageShell active="contact">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">Contact E&amp;E</span>
          <h1>Let&apos;s Talk About Your Project</h1>
          <p>
            Tell us about your project below, or call us directly. The first conversation is free
            and there is no obligation. We respond within one business day.
          </p>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="contact-grid">
            <div className="form-card" id="quote" style={{ padding: 22 }}>
              <h2 className="form-title" style={{ fontSize: 22, marginBottom: 12 }}>Send Us A Message</h2>
              <LeadForm formId="contact" withMessage serviceName="General Inquiry" />
              <p className="form-note" style={{ marginTop: 6 }}>We respond within one business day.</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-row">
                <span className="contact-info-ic"><PhoneIcon /></span>
                <div>
                  <p className="contact-info-label">Phone</p>
                  <p className="contact-info-value">
                    <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
                  </p>
                </div>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-ic"><PinIcon /></span>
                <div>
                  <p className="contact-info-label">Service Area</p>
                  <p className="contact-info-value">
                    Ventura · Santa Barbara · Los Angeles · San Fernando Valley
                  </p>
                </div>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-ic"><ClockIcon /></span>
                <div>
                  <p className="contact-info-label">Hours</p>
                  <p className="contact-info-value">Mon–Fri, 8am – 5pm</p>
                </div>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-ic"><MailIcon /></span>
                <div>
                  <p className="contact-info-label">License</p>
                  <p className="contact-info-value">CA General Contractor #1087571</p>
                </div>
              </div>
              <div
                style={{
                  background: 'var(--tint-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: 16,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span className="wcy-kicker" style={{ width: 'fit-content' }}>Prefer To Email?</span>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--mut)', lineHeight: 1.5 }}>
                  Prefer to email? Use the form and we will follow up. We respond within one
                  business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
