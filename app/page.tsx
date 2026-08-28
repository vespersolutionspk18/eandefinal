import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageShell from './components/PageShell';
import TrustStrip from './components/TrustStrip';
import Reviews from './components/Reviews';
import FinalLead from './components/FinalLead';
import ServiceCard from './components/ServiceCard';
import { PHONE_NUMBER, PHONE_DISPLAY } from './lib/analytics';
import { SERVICES } from './lib/services';

export const metadata: Metadata = {
  title: 'E&E Home Remodeling | Kitchen, Bath, ADU & Whole-Home Remodeling',
  description:
    'Family-owned for 25+ years. Kitchen, bathroom, ADU, garage conversion, landscaping, and whole-home remodeling across Ventura, Santa Barbara, Los Angeles, and the San Fernando Valley. Free 3D design. CA Lic #1087571.',
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 12h12l-4-4 1.4-1.4L21 12l-6.6 5.4L13 16l4-4H5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z" />
    </svg>
  );
}

const PROCESS_STEPS = [
  {
    title: 'Free Consultation',
    body: 'Walk us through your space, your goals, and your budget. We will tell you what is realistic before you commit to anything.',
  },
  {
    title: 'Free 3D Design',
    body: 'See your actual space in 3D — layout, tile, cabinetry, fixtures — and change anything before construction starts.',
  },
  {
    title: 'Permits & Schedule',
    body: 'We pull the permits, order materials, and hand you a written timeline so you can plan around the work.',
  },
  {
    title: 'Build & Walkthrough',
    body: 'The same crew that drew your design builds the project, protects your home, and walks you through the finish.',
  },
];

const STATS = [
  { num: '25+', label: 'Years Remodeling' },
  { num: '500+', label: 'Projects Completed' },
  { num: '4.7', label: 'Yelp Rating · 77 Reviews' },
  { num: '1', label: 'Team From Design To Build' },
];

export default function Home() {
  return (
    <PageShell active="home">
      <section aria-label="E&E Home Remodeling — design and build" className="home-hero">
        <div className="home-hero-media">
          <Image
            alt="Completed remodel by E&E Home Remodeling"
            height={900}
            priority
            sizes="(max-width: 980px) 100vw, 55vw"
            src="/bathroom/mains/4.jpg"
            width={1400}
          />
        </div>
        <div className="home-hero-copy">
          <span className="home-hero-eyebrow">Family Owned · 25+ Years</span>
          <h1 className="home-hero-h1">
            Designed In 3D.
            <br />
            Built By One Team.
          </h1>
          <p className="home-hero-h2">
            Kitchens, bathrooms, ADUs, and whole-home remodels across Ventura, Santa Barbara, and
            Los Angeles — designed, permitted, and built by the same crew. Free 3D design on every
            project.
          </p>
          <div className="home-hero-actions">
            <a className="btn btn-primary" href="#quote">
              GET A FREE QUOTE
            </a>
            <a className="btn btn-call" href={`tel:${PHONE_NUMBER}`}>
              CALL {PHONE_DISPLAY}
            </a>
          </div>
          <div className="home-hero-services">
            {SERVICES.map((s) => (
              <Link className="home-hero-service" href={s.href} key={s.slug}>
                <ArrowIcon />
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrustStrip />

      <section className="sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <header className="shead">
            <span className="wcy-kicker">What We Build</span>
            <h2 className="h2">Our Services</h2>
            <p className="lead">
              Five specialties, one team. Every project starts with a free 3D design so you can see
              the result before we build it.
            </p>
          </header>
          <div className="svc-overview">
            {SERVICES.map((s) => (
              <ServiceCard
                key={s.slug}
                href={s.href}
                kicker={s.label}
                title={s.label}
                body={s.intro}
                image={s.gallery[0].src}
                alt={s.label}
              />
            ))}
            <ServiceCard
              href="/gallery"
              kicker="Portfolio"
              title="Project Gallery"
              body="Bathroom, kitchen, ADU, and whole-home projects across Santa Barbara, Ventura, and the San Fernando Valley."
              image="/bathroom/mains/4.jpg"
              alt="Project Gallery"
            />
          </div>
        </div>
      </section>

      <section className="sec proc" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <header className="shead">
            <span className="wcy-kicker">How It Works</span>
            <h2 className="h2">From First Call To Final Walkthrough</h2>
            <p className="lead">
              A clear, four-step process. You always know what happens next — and what it costs.
            </p>
          </header>
          <div className="proc-grid">
            {PROCESS_STEPS.map((step, i) => (
              <article className="proc-step" key={step.title}>
                <span className="proc-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="stats-grid" style={{ background: 'transparent', border: 0, padding: 0 }}>
            {STATS.map((s) => (
              <div className="stat-item" key={s.label}>
                <p className="stat-num">{s.num}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sec"
        style={{ background: 'linear-gradient(155deg, #102F37 0%, #135060 58%, #174E5B 100%)', color: '#fff' }}
      >
        <div className="wrap">
          <div className="about-hero">
            <div className="about-hero-photo" style={{ borderColor: 'rgba(255,255,255,.18)' }}>
              <Image alt="E&E Home Remodeling crew" fill sizes="(max-width: 980px) 100vw, 40vw" src="/crew2.jpg" />
            </div>
            <div className="about-hero-copy">
              <span className="wcy-kicker">Why E&E</span>
              <h1 style={{ color: '#fff' }}>One Team From The First Walkthrough To The Final One</h1>
              <ul className="chk">
                <li>
                  <CheckIcon />
                  The designers who draw your 3D plan are in the room with the builders every week.
                </li>
                <li>
                  <CheckIcon />
                  Written schedules and transparent pricing — no handoffs, no surprise change orders.
                </li>
                <li>
                  <CheckIcon />
                  We protect your home, keep the site clean, and treat your family like neighbors —
                  because you probably are.
                </li>
              </ul>
              <div className="wcy-cta" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
                <a className="btn btn-primary" href="#quote">
                  GET A FREE QUOTE
                </a>
                <a className="btn btn-call" href={`tel:${PHONE_NUMBER}`}>
                  CALL {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      <section className="sec gal-sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <header className="shead center">
            <span className="wcy-kicker">Recent Projects</span>
            <h2 className="h2">Work We&apos;re Proud Of</h2>
            <p className="lead">A small sample of recent bathroom, kitchen, ADU, and landscaping projects across Ventura, Santa Barbara, Los Angeles, and the San Fernando Valley.</p>
          </header>
          <div className="gal" style={{ maxWidth: 1380 }}>
            {[
              { src: '/bathroom/mains/1.jpg', cap: 'Bathroom remodel - Santa Barbara' },
              { src: '/bathroom/mains/9.jpg', cap: 'Bathroom remodel - Ventura' },
              { src: '/bathroom/mains/3.jpg', cap: 'Bathroom remodel - Los Angeles' },
              { src: '/kitchen/2o.jpg', cap: 'Kitchen remodel - Ventura' },
              { src: '/kitchen/o.jpg', cap: 'Kitchen remodel - Santa Barbara' },
              { src: '/landscaping/1.jpg', cap: 'Landscaping - Thousand Oaks' },
              { src: '/landscaping/1a.jpg', cap: 'Landscaping - Simi Valley' },
              { src: '/bathroom/mains/4.jpg', cap: 'Bathroom remodel - San Fernando Valley' },
              { src: '/kitchen/2a.jpg', cap: 'Kitchen remodel - Carpinteria' },
            ].map((img) => (
              <figure key={img.src} data-cap={img.cap} style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={img.cap} loading="lazy" src={img.src} />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <span id="quote" />

      <FinalLead
        title="Get Your Free 3D Design"
        subtitle="Tell us about your project. We&apos;ll contact you to discuss your goals, create your free 3D design, and walk you through financing options if needed."
        formTitle="GET YOUR FREE 3D DESIGN"
        formId="home-final"
        serviceName="Home Remodel Inquiry"
        withMessage
      />
    </PageShell>
  );
}
