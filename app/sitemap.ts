import type { MetadataRoute } from 'next';
import { SERVICES } from './lib/services';

const BASE = 'https://eandehomeremodel.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
  const servicePages: MetadataRoute.Sitemap = SERVICES.map((s) => ({
    url: `${BASE}${s.href}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));
  return [...staticPages, ...servicePages];
}
