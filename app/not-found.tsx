import Link from 'next/link';
import PageShell from './components/PageShell';

export default function NotFound() {
  return (
    <PageShell>
      <section className="page-banner" style={{ padding: '80px 0 70px' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <span className="page-banner-kicker">404</span>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>Page Not Found</h1>
          <p style={{ margin: '12px auto 22px', maxWidth: 520 }}>
            The page you are looking for does not exist. The link may be outdated, or the project
            page you wanted may have moved. Try one of the links below.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/">
              GO HOME
            </Link>
            <Link className="btn btn-light" href="/contact">
              CONTACT US
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
