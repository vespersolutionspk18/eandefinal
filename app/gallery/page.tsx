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

const PROJECTS = [
  { slug: 'de-la-osa-woodland-hills', title: 'De La Osa Remodel', img: '/projects/de-la-osa/img1.jpg', cat: 'Whole-Home' },
  { slug: 'las-cruces-st-ventura', title: 'Las Cruces Street Remodel', img: '/projects/las-cruces/l1.jpg', cat: 'Room Addition' },
  { slug: 'villawood-cir-calabasas', title: 'Villawood Circle Remodel', img: '/projects/villawood/v1.jpg', cat: 'Garage' },
  { slug: 'kitchen-project', title: 'Kitchen Remodel', img: '/kitchen/projects/k1.jpeg', cat: 'Kitchen' },
  { slug: 'bathroom-project', title: 'Bathroom Remodel', img: '/bathroom/projects/b1.jpeg', cat: 'Bathroom' },
  { slug: 'outdoor-project', title: 'Outdoor Remodel', img: '/outdoor-projects/o1.jpg', cat: 'Outdoor' },
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
          <div className="review-headline">
            <div>
              <h2 className="h2" id="gallery-projects">Recent Projects</h2>
            </div>
          </div>
          <div className="gallery-grid">
            {PROJECTS.map((p) => (
              <Link className="gallery-tile" key={p.slug} href={`/projects/${p.slug}`}>
                <Image
                  alt={p.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 760px) 50vw, 25vw"
                  src={p.img}
                />
                <span className="gallery-tile-label">{p.cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
