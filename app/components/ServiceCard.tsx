'use client';

import Image from 'next/image';
import Link from 'next/link';
import { trackConversion } from '@/app/lib/analytics';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 12h12l-4-4 1.4-1.4L21 12l-6.6 5.4L13 16l4-4H5z" />
    </svg>
  );
}

type Props = {
  href: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

export default function ServiceCard({ href, kicker, title, body, image, alt }: Props) {
  return (
    <Link
      className="svc-card"
      href={href}
      onClick={() => trackConversion('svc_card_click', { href })}
    >
      <div className="svc-card-img">
        <Image alt={alt} fill sizes="(max-width: 640px) 100vw, 33vw" src={image} />
      </div>
      <div className="svc-card-body">
        <span className="svc-card-kicker">{kicker}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <span className="svc-card-cta">
          Learn more <Arrow />
        </span>
      </div>
    </Link>
  );
}
