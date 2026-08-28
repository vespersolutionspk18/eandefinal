import Image from 'next/image';
import { PHONE_NUMBER } from '@/app/lib/analytics';

type Feature = {
  icon: 'star' | 'home' | 'tools' | 'cube' | 'card' | 'leaf' | 'wrench' | 'door' | 'home2' | 'sparkle' | 'shield';
  title: string;
  body: string;
};

type Props = {
  title: string;
  id: string;
  lead: string;
  features: Feature[];
  disclaimer?: string;
  photo?: { src: string; alt: string };
  ctaLabel?: string;
};

function Icon({ name }: { name: Feature['icon'] }) {
  switch (name) {
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z" />
        </svg>
      );
    case 'home2':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12 12 4l9 8v8a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    case 'wrench':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4z" />
        </svg>
      );
    case 'door':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16h-2v-2H7v2zm12-12a1 1 0 1 0-1-1 1 1 0 0 0 1 1z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 3c-7 0-12 5-12 12 0 2 .5 4 1.5 5.5L17 10c-3 1-5 2-7 4 1-3 3-5 6-7-3 0-6 2-7 5C9 6 13 3 17 3z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5Zm-1 14-4-4 1.41-1.41L11 12.17l4.59-4.58L17 9Z" />
        </svg>
      );
    case 'cube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.4 8.7 3.6L12 11.6 3.3 8 12 4.4ZM5 9.6l6 3.3v6.7L5 16.3V9.6Zm8 10v-6.7l6-3.3v6.7l-6 3.3Z"
          />
        </svg>
      );
    case 'card':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18v14H3V5Zm2 3h14V7H5v1Zm0 3v6h14v-6H5Zm2 2h5v2H7v-2Z" />
        </svg>
      );
  }
}

export default function WhyChoose({ title, id, lead, features, disclaimer, photo, ctaLabel = 'GET A FREE QUOTE' }: Props) {
  return (
    <section aria-labelledby={id} className="sec wcy">
      <div className="wrap">
        <div className="wcy-grid">
          <div className="wcy-copy">
            <h2 className="h2" id={id}>
              {title}
            </h2>
            <p className="wcy-lead">{lead}</p>
            <ul className="wcy-features">
              {features.map((f) => (
                <li className="wcy-feature" key={f.title}>
                  <span aria-hidden="true" className="wcy-ic">
                    <Icon name={f.icon} />
                  </span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            {disclaimer && <p className="financing-disclaimer">{disclaimer}</p>}
            <div className="wcy-cta">
              <a className="btn btn-primary" href="#quote">
                {ctaLabel}
              </a>
              <a className="btn btn-call" href={`tel:${PHONE_NUMBER}`}>
                CALL NOW
              </a>
            </div>
          </div>
          {photo && (
            <div className="wcy-image-placeholder">
              <Image alt={photo.alt} className="wcy-photo" fill sizes="(max-width: 980px) 100vw, 40vw" src={photo.src} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
