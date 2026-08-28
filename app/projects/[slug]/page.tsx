import Image from 'next/image';
import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import { PROJECTS } from '../../lib/projects';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectDetail({ params }: Props) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return (
      <PageShell active="gallery">
        <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h1>Project not found</h1>
          <Link href="/gallery">Back to Gallery</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell active="gallery">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">{project.category} Project</span>
          <h1>{project.title}</h1>
          <p>{project.blurb}</p>
        </div>
      </section>
      <section className="sec" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <div className="gallery-grid">
            {project.images.map((src, i) => (
              <figure
                className="gallery-tile project-tile"
                key={`${src}-${i}`}
              >
                <Image
                  alt={`${project.title} photo ${i + 1}`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 760px) 50vw, 25vw"
                  src={src}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return params.then(({ slug }) => {
    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) return { title: 'Project Not Found' };
    return {
      title: `${project.title} | E&E Home Remodeling`,
      description: project.blurb,
    };
  });
}