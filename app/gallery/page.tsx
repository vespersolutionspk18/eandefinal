'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import PageShell from '../components/PageShell';

type Tile = { src: string; alt: string; cap: string; category: string };

const CATEGORIES = ['All', 'Bathroom', 'Kitchen', 'Landscaping', 'Whole-Home'] as const;

const TILES: Tile[] = [
  { src: '/bathroom/mains/1.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/2.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/3.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/4.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/5.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/6.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/7.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/8.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/mains/9.jpg', alt: 'Bathroom remodel', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/2a.jpg', alt: 'Bathroom project', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/2.jpg', alt: 'Bathroom project', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/bathroom/4a.jpg', alt: 'Bathroom project', cap: 'Bathroom Remodel', category: 'Bathroom' },
  { src: '/kitchen/2o.jpg', alt: 'Kitchen remodel', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/kitchen/1o.jpg', alt: 'Kitchen remodel', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/kitchen/2a.jpg', alt: 'Kitchen project', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/kitchen/2b.jpg', alt: 'Kitchen project', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/kitchen/2c.jpg', alt: 'Kitchen project', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/kitchen/o.jpg', alt: 'Kitchen project', cap: 'Kitchen Remodel', category: 'Kitchen' },
  { src: '/landscaping/1.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
  { src: '/landscaping/1a.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
  { src: '/landscaping/1c.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
  { src: '/landscaping/1d.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
  { src: '/landscaping/b1.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
  { src: '/landscaping/b2.jpg', alt: 'Landscaping project', cap: 'Landscaping', category: 'Landscaping' },
];

export default function GalleryPage() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>('All');
  const [open, setOpen] = useState<{ src: string; alt: string; cap: string } | null>(null);

  const filtered = useMemo(() => {
    if (active === 'All') return TILES;
    return TILES.filter((t) => t.category === active);
  }, [active]);

  return (
    <PageShell active="gallery">
      <section className="page-banner">
        <div className="wrap">
          <span className="page-banner-kicker">Project Gallery</span>
          <h1>Recent Work</h1>
          <p>
            Bathroom, kitchen, ADU, landscaping, and whole-home projects across Ventura, Santa
            Barbara, Los Angeles, and the San Fernando Valley.
          </p>
        </div>
      </section>
      <section className="sec" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <div className="gallery-filter" role="tablist">
            {CATEGORIES.map((c) => (
              <button
                aria-pressed={active === c}
                className={active === c ? 'is-active' : ''}
                key={c}
                onClick={() => setActive(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {filtered.map((tile) => (
              <button
                aria-label={`Open ${tile.cap}`}
                className="gallery-tile"
                key={tile.src}
                type="button"
                onClick={() => setOpen(tile)}
              >
                <Image alt={tile.alt} fill loading="lazy" sizes="(max-width: 760px) 50vw, 25vw" src={tile.src} />
                <span className="gallery-tile-label">{tile.category}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {open && (
        <div
          aria-label="Photo viewer"
          aria-modal="true"
          className="lb on"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <button
            aria-label="Close photo viewer"
            className="lb-x"
            type="button"
            onClick={() => setOpen(null)}
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={open.alt} src={open.src} />
          <p className="lb-cap">{open.cap}</p>
        </div>
      )}
    </PageShell>
  );
}
