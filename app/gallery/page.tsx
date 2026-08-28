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

const TESTIMONIALS = [
  {
    name: 'Michael',
    place: 'Calabasas',
    text: '“I chose Ezra because of the highly rated Angie\u2019s List recommendation that granted given and I\u2019m extremely happy with the work. The color is just what I wanted. The workmanship was excellent.”',
  },
  {
    name: 'Susan',
    place: 'Santa Clarita',
    text: '“It\u2019s just like I said — if I had this to do all over again, there\u2019s absolutely nothing I would change, beginning to end. Starting with the first conversation, he would not let me back down, he promised me what I would get and he delivered.”',
  },
  {
    name: 'Tom',
    place: 'Moorpark',
    text: '“This is a great job. Going to see Ezra and Ron hooked me up with this beautiful work. We had this incredible vision that only those guys could have pulled off.”',
  },
  {
    name: 'Lazar',
    place: 'Burbank',
    text: '“The work they did was just beautiful. I\u2019m sure that they\u2019re going to be able to walk you around and show you what they did, but the addition looks like it was part of the house forever.”',
  },
  {
    name: 'Neil',
    place: 'Camarillo',
    text: '“Hi, this is Neil from Camarillo. I just want to let everybody know that Ezra worked in the house, did some upgrades. Fantastic. I\u2019m so happy with it. I don\u2019t know what to tell you — even my wife is happy.”',
  },
  {
    name: 'Marlin',
    place: 'Thousand Oaks',
    text: '“I\u2019m very happy with the work here and everything looks perfect — patio cover and the lanai. This was a big job, but they did it very quickly and took care of everything. When he left here, it was nice and clean.”',
  },
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
