import { PHONE_NUMBER } from '@/app/lib/analytics';

type Props = {
  title: string;
  sub: string;
  ariaLabel?: string;
};

export default function CtaBand({ title, sub, ariaLabel = 'Ready to get started' }: Props) {
  return (
    <section aria-label={ariaLabel} className="band">
      <div className="wrap band-in">
        <div>
          <h2 className="h2">{title}</h2>
          <p className="band-sub">{sub}</p>
        </div>
        <div className="band-actions">
          <span className="chip-3d">FREE 3D DESIGN</span>
          <a className="btn btn-primary" href="#quote">
            GET A FREE QUOTE
          </a>
          <a className="btn btn-light" href={`tel:${PHONE_NUMBER}`}>
            CALL NOW
          </a>
        </div>
      </div>
    </section>
  );
}
