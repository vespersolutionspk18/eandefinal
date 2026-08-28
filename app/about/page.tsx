import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '../components/PageShell';
import IconBadge from '../components/IconBadge';
import { PHONE_NUMBER, PHONE_DISPLAY } from '../lib/analytics';

export const metadata: Metadata = {
  title: 'About E&E Home Remodeling | Family-Owned Since 1999',
  description:
    'E&E Home Remodeling is a family-owned general contractor serving Ventura, Santa Barbara, Los Angeles, and the San Fernando Valley. 25+ years of kitchen, bath, ADU, and whole-home remodeling.',
};

export default function AboutPage() {
  return (
    <PageShell active="about">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">About E&amp;E</span>
          <h1>Family-Owned. Family-Run. For Over 25 Years.</h1>
          <p>
            E&amp;E Home Remodeling is a licensed general contractor. The owners are on every job. The
            same team that draws your 3D design is the team that builds your project.
          </p>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="about-hero">
            <div className="about-hero-copy">
              <span className="wcy-kicker">Our Story</span>
              <h1>A Remodel Built Around The Way You Live</h1>
              <p className="lead">
                We started E&amp;E because we saw too many homeowners get stuck between a designer who
                never set foot on the jobsite and a contractor who only cared about the schedule. The
                difference between a good remodel and a painful one is coordination — and that only
                works when one team owns the whole project.
              </p>
              <p className="mut" style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                Today we handle design, permits, and construction under one roof. The people who
                answer the phone are the people doing the work. The people drawing your 3D design
                are the people standing in your kitchen when the cabinets go in. We have remodeled
                kitchens, bathrooms, ADUs, and whole homes for over 25 years across Ventura, Santa
                Barbara, and the San Fernando Valley — and we are not slowing down.
              </p>
            </div>
            <div className="about-hero-photo">
              <Image alt="E&E Home Remodeling crew" fill sizes="(max-width: 980px) 100vw, 40vw" src="/crew2.jpg" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <header className="shead center">
            <span className="wcy-kicker">What We Believe</span>
            <h2 className="h2">Three Things Every Project Has To Get Right</h2>
          </header>
          <div className="values-grid">
            {[
              {
                icon: 'cube' as const,
                title: 'See It Before You Build It',
                body: 'Every project starts with a free 3D design so you can see the layout, tile, fixtures, and finishes before we break ground. Decisions are easier when the project is in front of you.',
              },
              {
                icon: 'tools' as const,
                title: 'One Team, One Schedule',
                body: 'Design, permits, and construction all run through the same team. One contract, one project manager, one phone number. No finger-pointing between subs.',
              },
              {
                icon: 'shield' as const,
                title: 'Licensed, Insured, And Still Here Tomorrow',
                body: 'CA General Contractor License #1087571. Workers comp and liability on every project. We have been in business for 25+ years and we plan to be here for the next 25.',
              },
            ].map((v) => (
              <article className="value-card" key={v.title}>
                <span aria-hidden="true" className="wcy-ic">
                  <IconBadge name={v.icon} />
                </span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: 'linear-gradient(155deg, #102F37 0%, #135060 58%, #174E5B 100%)', color: '#fff' }}>
        <div className="wrap">
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="h2" style={{ color: '#fff' }}>Ready to Talk About Your Project?</h2>
            <p className="lead" style={{ color: '#D7EDF2', margin: '12px auto 22px' }}>
              The first conversation is free. We will walk you through what is realistic, what the
              options are, and what your project could look like in 3D.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href="/contact">
                CONTACT US
              </Link>
              <a className="btn btn-light" href={`tel:${PHONE_NUMBER}`}>
                CALL {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
