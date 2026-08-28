import { PHONE_NUMBER } from '@/app/lib/analytics';

export default function MobileStickyBar() {
  return (
    <div aria-label="Quick actions" className="mbar" role="navigation">
      <div className="mbar-in">
        <a className="btn btn-call" href={`tel:${PHONE_NUMBER}`}>
          CALL NOW
        </a>
        <a className="btn btn-primary" href="#quote">
          GET A FREE QUOTE
        </a>
      </div>
    </div>
  );
}
