import Image from 'next/image';
import LeadForm, { PHONE_DISPLAY } from './LeadForm';
import { PHONE_NUMBER } from '@/app/lib/analytics';

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 5h18v14H3V5Zm2 3h14V7H5v1Zm0 3v6h14v-6H5Zm2 2h5v2H7v-2Z" />
    </svg>
  );
}

type Props = {
  eyebrow: string;
  ariaLabel: string;
  image: string;
  imageAlt: string;
  heroH1?: string;
  heroH2?: string;
  formId: string;
  serviceName: string;
  heroFlag?: string;
  trustItems?: { label: string; icon: 'check' | 'card' }[];
};

export default function Hero({
  eyebrow,
  ariaLabel,
  image,
  imageAlt,
  heroH1 = 'FREE 3D DESIGN',
  heroH2 = 'Get a free 3D design for your remodel.',
  formId,
  serviceName,
  heroFlag = 'GET A FREE 3D DESIGN',
  trustItems,
}: Props) {
  const items =
    trustItems ||
    ([
      { icon: 'check' as const, label: '25+ Years Experience' },
      { icon: 'check' as const, label: 'Family Owned' },
      { icon: 'check' as const, label: 'Licensed & Insured' },
      { icon: 'card' as const, label: 'Low Interest Financing' },
    ]);
  return (
    <section aria-label={ariaLabel} className="hero">
      <div className="hero-media">
        <Image
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 980px) 100vw, 60vw"
          src={image}
        />
        <span className="hero-flag btn btn-primary btn-sm">{heroFlag}</span>
      </div>
      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow">{eyebrow}</span>
        <h1 className="h-disp hero-h1">{heroH1}</h1>
        <p className="hero-h2">{heroH2}</p>
        <div className="hero-trust" role="list">
          {items.map((t, i) => (
            <span key={i} role="listitem">
              {t.icon === 'check' ? <CheckIcon /> : <CardIcon />}
              {t.label}
            </span>
          ))}
        </div>
        <div className="form-card" id="quote">
          <h2 className="form-title">Get Your Free 3D Design</h2>
          <LeadForm formId={formId} serviceName={serviceName} />
          <p className="or-call">
            Or Call <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
          </p>
          <p className="form-note">Free 3D design · Free quote</p>
        </div>
      </div>
    </section>
  );
}
