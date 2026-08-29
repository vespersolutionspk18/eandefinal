import Image from 'next/image';
import type { Metadata } from 'next';
import PageShell from './PageShell';
import CtaBand from './CtaBand';
import FinalLead from './FinalLead';
import { PHONE_DISPLAY } from './LeadForm';
import { PHONE_NUMBER } from '@/app/lib/analytics';

type Props = {
  title: string;
  location: string;
  blurb: string;
  images: string[];
  formId: string;
  serviceName: string;
};

export function makeProjectMetadata(p: Pick<Props, 'title' | 'location' | 'blurb'>): Metadata {
  return {
    title: `${p.title} | E&E Home Remodeling`,
    description: p.blurb,
  };
}

export default function ProjectGallery({
  title,
  location,
  blurb,
  images,
  formId,
  serviceName,
}: Props) {
  return (
    <PageShell active="gallery">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">Project</span>
          <h1>{title}</h1>
          <p>{blurb}</p>
          <p style={{ color: 'var(--mut)', fontSize: 14, marginTop: 6 }}>{location}</p>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <div className="gallery-grid">
            {images.map((src, i) => (
              <figure className="gallery-tile project-tile" key={`${src}-${i}`}>
                <Image
                  alt={`${title} photo ${i + 1}`}
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

      <CtaBand
        title={`Like what you see? Start your ${title.toLowerCase()}.`}
        sub="Get a free 3D design for your project. Low interest financing is available for qualified homeowners."
        ariaLabel={`Ready for ${title.toLowerCase()}`}
      />

      <FinalLead
        title={`Get Your Free 3D Design`}
        subtitle="Tell us about your project. We'll contact you to discuss your goals, design the project in 3D, and walk you through financing options."
        formTitle="GET YOUR FREE 3D DESIGN"
        formId={formId}
        serviceName={serviceName}
        withMessage
      />
    </PageShell>
  );
}
