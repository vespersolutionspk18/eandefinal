'use client';

import { useCallback, useEffect, useState } from 'react';
import { PHONE_DISPLAY, PHONE_NUMBER, trackConversion } from '@/app/lib/analytics';

type Image = { src: string; alt: string; cap: string };

type Props = { images: Image[]; sectionStyle?: React.CSSProperties };

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02Z" />
    </svg>
  );
}

export default function Gallery({ images, sectionStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = useCallback((n: number) => {
    setIndex(((n % images.length) + images.length) % images.length);
  }, [images.length]);

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, show, close]);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const current = images[index];

  return (
    <section aria-label="Project gallery" className="sec gal-sec" style={sectionStyle || { background: 'var(--mist)' }}>
      <div className="wrap">
        <div className="shead center">
          <h2 className="h2" id="gal-h">PROJECTS WE&apos;VE BUILT</h2>
        </div>
        <div className="gal" id="gallery">
          {images.map((img, i) => (
            <figure
              key={img.src + i}
              data-cap={img.cap}
              role="button"
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              onClick={() => openAt(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openAt(i);
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={img.alt} loading="lazy" src={img.src} />
              <span aria-hidden="true" className="plus">
                <svg fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </figure>
          ))}
        </div>
        <div className="cta-row cta-pair">
          <a
            className="btn btn-primary"
            href="#quote"
            onClick={() => trackConversion('cta_click', { location: 'gallery', type: 'quote' })}
          >
            GET A FREE QUOTE
          </a>
          <a className="btn btn-call" href={`tel:${PHONE_NUMBER}`}>
            <PhoneIcon />
            CALL NOW
          </a>
        </div>
      </div>
      <div
        aria-label="Photo viewer"
        aria-modal="true"
        className={`lb ${open ? 'on' : ''}`}
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button aria-label="Close photo viewer" className="lb-x" type="button" onClick={close}>
          <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={current.alt} src={current.src} />
        <p className="lb-cap">{current.cap}</p>
        <div className="lb-nav">
          <button aria-label="Previous photo" type="button" onClick={() => show(index - 1)}>
            <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button aria-label="Next photo" type="button" onClick={() => show(index + 1)}>
            <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <p className="lb-count">
          {index + 1} of {images.length}
        </p>
      </div>
    </section>
  );
}
