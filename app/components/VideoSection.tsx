import { PHONE_NUMBER } from '@/app/lib/analytics';

type Props = {
  youtubeId: string;
  caption: string;
  title?: string;
};

export default function VideoSection({ youtubeId, caption, title = 'See Our Work' }: Props) {
  return (
    <section aria-labelledby="vid-h" className="sec">
      <div className="wrap">
        <div className="shead center">
          <h2 className="h2" id="vid-h">{title}</h2>
        </div>
        <div className="vid-single">
          <div className="vid-card">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`}
              title="Full Home Remodeling by E&E Home Remodeling"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <p className="vid-cap">{caption}</p>
          </div>
        </div>
        <div className="cta-row cta-pair">
          <a className="btn btn-primary" href="#quote">
            GET A FREE QUOTE
          </a>
          <a className="btn btn-ghost" href={`tel:${PHONE_NUMBER}`}>
            CALL NOW
          </a>
        </div>
      </div>
    </section>
  );
}
