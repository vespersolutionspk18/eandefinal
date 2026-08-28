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
  { id: '0N61rpr-Ujc', name: 'Michael', place: 'Calabasas' },
  { id: 'cG1DByNcoNk', name: 'Susan', place: 'Santa Clarita' },
  { id: 'cTp80R6Xt1Y', name: 'Tom', place: 'Moorpark' },
  { id: 'Fmvus30M3Mo', name: 'Feature Project', place: '' },
  { id: 'h8vP0XyMHww', name: 'Neil', place: 'Camarillo' },
  { id: 'jERreCLH8c4', name: 'Feature Project', place: '' },
  { id: 'pUZiBB6dxHk', name: 'Lazar', place: 'Burbank' },
  { id: 'R1B-EIt7cuk', name: 'Feature Project', place: '' },
  { id: 'VqLbI0dtd5k', name: 'Neil', place: 'Camarillo' },
  { id: 'X0YNR38myPU', name: 'Marlin', place: 'Thousand Oaks' },
] as const;

const TESTIMONIALS = [
  { name: 'Michael', place: 'Calabasas', text: '“Best contractors we have used. They remodeled our entire house and the result was amazing. Highly recommend Ezra and his team.”' },
  { name: 'Susan', place: 'Santa Clarita', text: '“They did an excellent job on our kitchen remodel. The team was professional, polite, and finished on schedule. We love our new kitchen!”' },
  { name: 'Tom', place: 'Moorpark', text: '“Very happy with the quality of work. Ezra and his crew transformed our home. Clean, on time, and beautiful results.”' },
  { name: 'Lazar', place: 'Burbank', text: '“Professional, courteous, and great quality work. Highly recommend E&E for any remodeling project.”' },
  { name: 'Neil', place: 'Camarillo', text: '“They converted our garage into a beautiful ADU. The whole process was smooth and the finish is excellent.”' },
  { name: 'Marlin', place: 'Thousand Oaks', text: '“Fantastic job on our bathroom remodel. Detail-oriented, clean, and the results speak for themselves.”' },
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

      <section className="review-sec" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <div className="review-headline">
            <div>
              <h2 className="h2" id="gallery-testimonials">What Clients Say</h2>
            </div>
          </div>
          <div className="rev-grid">
            {TESTIMONIALS.map((r) => (
              <article className="rev-card" key={r.name}>
                <div className="rev-head">
                  <div className="rev-avatar">
                    <span>{r.name.charAt(0)}</span>
                  </div>
                  <div className="rev-meta">
                    <p className="rev-by">{r.name}</p>
                    <p className="rev-place">{r.place}</p>
                  </div>
                </div>
                <p className="rev-text">{r.text}</p>
              </article>
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
