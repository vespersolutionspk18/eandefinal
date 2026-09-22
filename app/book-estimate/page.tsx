import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import BookingFlow from './components/BookingFlow';
import { BOOKING_CONFIG, BOOKING_SERVICE_TYPES, BOOKING_TIMEZONE_LABEL } from '@/app/lib/booking/config';

export const metadata: Metadata = {
  title: 'Book Your Free Estimate',
  description:
    'Pick a day and time that works for you and book your free in-home remodeling estimate with E&E Home Remodeling. Kitchen, bathroom, ADU, and whole-home projects across Ventura, Santa Barbara, and Los Angeles.',
  alternates: { canonical: '/book-estimate' },
};

/**
 * /book-estimate — the landing page for paid Meta traffic.
 *
 * Server component: it renders the page shell, resolves the `?service=` query
 * parameter from the ad link and passes the booking configuration down to the
 * client flow, so business hours, allowed days, appointment length and the
 * service list all come from one place (`app/lib/booking/config.ts`).
 */
export default async function BookEstimatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedService = typeof params.service === 'string' ? params.service.toLowerCase() : undefined;
  const defaultServiceId = BOOKING_SERVICE_TYPES.some((service) => service.id === requestedService)
    ? requestedService
    : undefined;

  return (
    <PageShell>
      <section className="bk-hero">
        <div className="wrap">
          <span className="bk-hero-kicker">Free In-Home Estimate</span>
          <h1 className="bk-hero-title">Book Your Free Estimate</h1>
          <p className="bk-hero-sub">
            Choose a day and time that works for you. We&apos;ll come out, walk the project with you, and
            prepare your free 3D design — no cost, no obligation.
          </p>
          <div className="bk-hero-trust">
            <span>25+ Years Experience</span>
            <span>Family Owned</span>
            <span>Licensed &amp; Insured</span>
            <span>Free 3D Design</span>
          </div>
        </div>
      </section>

      {/* `id="quote"` keeps the site-wide CTA buttons scrolling to the booking form. */}
      <section className="sec bk-sec" id="quote" aria-label="Book your free estimate">
        <div className="wrap">
          <BookingFlow
            defaultServiceId={defaultServiceId}
            serviceTypes={BOOKING_SERVICE_TYPES.map((service) => ({ id: service.id, label: service.label }))}
            timezoneLabel={BOOKING_TIMEZONE_LABEL}
            durationMinutes={BOOKING_CONFIG.appointmentDurationMinutes}
            minimumNoticeMinutes={BOOKING_CONFIG.minimumNoticeMinutes}
            horizonDays={BOOKING_CONFIG.bookingHorizonDays}
          />
        </div>
      </section>
    </PageShell>
  );
}
