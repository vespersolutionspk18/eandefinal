'use client';

import { useState } from 'react';

type Props = {
  id: string;
  title: string;
};

export default function YouTubeFacade({ id, title }: Props) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      aria-label={`Play video: ${title}`}
      className="vt-thumb"
      onClick={() => setActive(true)}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" loading="lazy" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} />
      <span aria-hidden="true" className="vt-play">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}