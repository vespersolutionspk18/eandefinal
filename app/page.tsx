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
  title: 'E&E Home Remodeling | Santa Barbara Kitchen, Bath, ADU & Whole-Home Remodels',
  description:
    'Family-owned for over 25 years. Kitchens, bathrooms, ADUs, landscaping, and whole-home remodels in Santa Barbara, Ventura, and Los Angeles. Free consultation and 3D design. CA Lic #1087571.',
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
    body: 'We visit your home, listen carefully, and discuss what you have in mind. No cost, no obligation.',
  },
  {
    title: 'Free 3D Design',
    body: 'You see exactly how your home will look — and change anything you like — before work begins.',
  },
  {
    title: 'A Clear Plan',
    body: 'You receive a written schedule and a written price. Everything is in writing.',
  },
  {
    title: 'The Work',
    body: 'Our own crew completes your project, keeps your home clean and comfortable, and walks through every detail with you at the end.',
  },
];

const STATS = [
  { num: '25+', label: 'Years Remodeling' },
  { num: '500+', label: 'Projects Completed' },
  { num: '4.7', label: 'Yelp Rating · 77 Reviews' },
  { num: '2', label: 'Best of Houzz Awards — 2023 & 2024' },
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
          <span className="home-hero-eyebrow">Family Owned &amp; Operated · Licensed CA #1087571 · 25+ Years</span>
          <h1 className="home-hero-h1">
            A Beautiful Remodel,
            <br />
            From People You Can Trust
          </h1>
          <p className="home-hero-h2">
            We design your kitchen, bathroom, or whole home in 3D before any work begins, give you
            a clear written price, and our own experienced crew does the work from start to finish.
            Serving Santa Barbara, Ventura, and Los Angeles for over 25 years.
          </p>
          <div className="home-hero-actions">
            <a className="btn btn-primary" href={`tel:${PHONE_NUMBER}`}>
              CALL {PHONE_DISPLAY}
            </a>
            <a className="btn btn-call" href="#quote">
              REQUEST A FREE CONSULTATION
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
            <span className="wcy-kicker">Our Services</span>
            <h2 className="h2">One Company. One Number. One Crew.</h2>
            <p className="lead">
              Kitchens, bathrooms, ADUs, landscaping, and whole-home remodels. Every project begins
              with a free consultation and a free 3D design, so you see your finished home before
              any work begins.
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
              body="Recent projects from homes in your neighborhoods."
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
            <h2 className="h2">Simple and Straightforward</h2>
            <p className="lead">Four steps, and we handle the details at every one.</p>
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
              <Image alt="The E&E Home Remodeling family team" fill sizes="(max-width: 980px) 100vw, 40vw" src="/about.jpg" />
            </div>
            <div className="about-hero-copy">
              <span className="wcy-kicker">Why Homeowners Choose E&E</span>
              <h1 style={{ color: '#fff' }}>A Family Business That Treats Your Home Like Our Own</h1>
              <ul className="chk">
                <li>
                  <CheckIcon />
                  You&apos;ll work with the same courteous crew from start to finish — people who know your name and your home.
                </li>
                <li>
                  <CheckIcon />
                  Your price and your schedule, in writing, before we begin.
                </li>
                <li>
                  <CheckIcon />
                  We treat your home with care — clean job sites, tidy work, and a full cleanup every day.
                </li>
              </ul>
              <div className="wcy-cta" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
                <a className="btn btn-primary" href={`tel:${PHONE_NUMBER}`}>
                  CALL {PHONE_DISPLAY}
                </a>
                <a className="btn btn-call" href="#quote">
                  REQUEST A FREE CONSULTATION
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
            <span className="wcy-kicker">Our Recent Work</span>
            <h2 className="h2">Recent Projects</h2>
            <p className="lead">A selection of kitchen, bathroom, ADU, and landscaping projects completed for homes in Santa Barbara, Ventura, and Los Angeles.</p>
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
        title="Request Your Free Consultation"
        subtitle="Tell us a little about your project. We&apos;ll call you to set up a convenient time to meet, answer every question, and prepare your free 3D design. There is never any obligation."
        formTitle="GET YOUR FREE 3D DESIGN"
        formId="home-final"
        serviceName="Home Remodel Inquiry"
        withMessage
      />
    </PageShell>
  );
}
