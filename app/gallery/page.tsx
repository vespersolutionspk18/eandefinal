import Image from 'next/image';
import Link from 'next/link';
import PageShell from '../components/PageShell';
import YouTubeFacade from '../components/YouTubeFacade';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Gallery | E&E Home Remodeling',
  description:
    'Kitchen, bathroom, ADU, outdoor, and whole-home remodeling projects across Santa Barbara, Ventura, and Los Angeles.',
};

const BENTO = [
  { href: '/whole-house-remodeling', label: 'Whole House Remodel', img: '/bento/whole-house.jpeg' },
  { href: '/kitchen-remodeling', label: 'Kitchen Remodeling', img: '/bento/kitchen.jpeg' },
  { href: '/bathroom-remodeling', label: 'Bathroom Remodeling', img: '/bento/bathroom.jpg' },
  { href: '/', label: 'Room Addition', img: '/bento/room-addition.jpg' },
  { href: '/remodel-villawood-cir--calabasas', label: 'Outdoor Remodeling Calabasas CA', img: '/bento/outdoor-calabasas.jpg' },
] as const;

const VIDEOS = [
  { id: 'cG1DByNcoNk', name: 'Michael', place: 'Calabasas' },
  { id: 'h8vP0XyMHww', name: 'Susan', place: 'Santa Clarita' },
  { id: 'cTp80R6Xt1Y', name: 'Tom', place: 'Moorpark' },
  { id: 'pUZiBB6dxHk', name: 'Lazar', place: 'Burbank' },
  { id: 'VqLbI0dtd5k', name: 'Neil', place: 'Camarillo' },
  { id: 'X0YNR38myPU', name: 'Marlin', place: 'Thousand Oaks' },
  { id: 'Fmvus30M3Mo', name: 'Transformation', place: '' },
  { id: '0N61rpr-Ujc', name: 'Transformation', place: '' },
  { id: 'jERreCLH8c4', name: 'Transformation', place: '' },
  { id: 'R1B-EIt7cuk', name: 'Transformation', place: '' },
] as const;

export default function GalleryPage() {
  return (
    <PageShell active="gallery">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">Project Gallery</span>
          <h1>Featured Projects</h1>
          <p>
            Real kitchens, bathrooms, garages, and whole homes — remodeled across Santa Barbara,
            Ventura, and Los Angeles.
          </p>
        </div>
      </section>

      <section className="review-sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="review-headline">
            <div>
              <h2 className="h2" id="gallery-videos">Featured Videos</h2>
            </div>
          </div>
          <div className="vt-grid">
            {VIDEOS.map((v) => (
              <figure className="vt-card" key={v.id}>
                <YouTubeFacade id={v.id} title={`Video: ${v.name}`} />
                <figcaption className="vt-cap">
                  <strong>{v.name}</strong>
                  {v.place ? ` · ${v.place}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <h2 className="gal-bento-title" id="gallery-projects">
            <em>Featured</em> <strong>Photo Galleries</strong> <em>&amp;</em> <strong>Ideas</strong>
          </h2>
          <div className="gal-bento">
            {BENTO.map((p, i) => {
              const isTall = i === BENTO.length - 1;
              return (
                <Link
                  className={`bento-tile${isTall ? ' bento-tile--tall' : ''}`}
                  key={p.href}
                  href={p.href}
                >
                  <Image
                    alt={p.label}
                    fill
                    loading="lazy"
                    sizes={isTall ? '(max-width: 760px) 100vw, 35vw' : '(max-width: 760px) 50vw, 30vw'}
                    src={p.img}
                  />
                  <span className="bento-tile-label">{p.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
