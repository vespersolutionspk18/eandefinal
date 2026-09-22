// ============================================================================
// AD/CAMPAIGN ATTRIBUTION
// ----------------------------------------------------------------------------
// Query parameters from a Meta (or Google/other) ad are read on arrival at
// /book-estimate, kept for the whole booking flow (session storage, so the data
// survives step changes, a refresh and a back-navigation), sent with the
// booking request and stored on the booking row.
//
// Nothing here talks to Meta. The pixel / Conversions API wiring lives in
// `tracking.ts` and is called when a booking is confirmed.
// ============================================================================

export const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'gbrandid',
  'gbraid',
  'wbraid',
  'msclkid',
  'referrer',
  'landing_page',
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type BookingAttribution = Partial<Record<AttributionKey, string>>;

/** Session-storage slot used to carry attribution across steps + refreshes. */
export const ATTRIBUTION_STORAGE_KEY = 'ee_booking_attribution';

const MAX_VALUE_LENGTH = 300;

function cleanValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, MAX_VALUE_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

/** Keeps only allow-listed attribution keys with safe, bounded values. */
export function sanitizeAttribution(raw: unknown): BookingAttribution {
  const result: BookingAttribution = {};
  if (!raw || typeof raw !== 'object') return result;
  const source = raw as Record<string, unknown>;
  for (const key of ATTRIBUTION_KEYS) {
    const value = cleanValue(source[key]);
    if (value) result[key] = value;
  }
  return result;
}

export function mergeAttribution(
  base: BookingAttribution | null | undefined,
  extra: BookingAttribution | null | undefined,
): BookingAttribution {
  return { ...sanitizeAttribution(base), ...sanitizeAttribution(extra) };
}

/** Reads allow-listed parameters out of a query string (`"?utm_source=meta"`). */
export function parseAttributionFromSearch(search: string): BookingAttribution {
  if (!search) return {};
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const found: Record<string, string> = {};
  params.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if ((ATTRIBUTION_KEYS as readonly string[]).includes(normalized) && !found[normalized]) {
      found[normalized] = value;
    }
  });
  return sanitizeAttribution(found);
}

/**
 * Combines ad parameters, previously stored values and the referring host into
 * one attribution record.
 */
export function buildAttribution(options: {
  search?: string;
  referrerHost?: string | null;
  stored?: BookingAttribution | null;
  incoming?: BookingAttribution | null;
}): BookingAttribution {
  const fromSearch = parseAttributionFromSearch(options.search ?? '');
  const stored = sanitizeAttribution(options.stored);
  const incoming = sanitizeAttribution(options.incoming);
  const referrerHost = cleanValue(options.referrerHost ?? '');

  const merged = mergeAttribution(mergeAttribution(stored, incoming), fromSearch);
  if (referrerHost && !merged.referrer) merged.referrer = referrerHost;
  return merged;
}

/** Ad platform the visit came from (`meta`, `google`, …). */
export function deriveSource(attribution: BookingAttribution | null | undefined): string | null {
  const clean = sanitizeAttribution(attribution);
  if (clean.utm_source) return clean.utm_source;
  if (clean.fbclid) return 'meta';
  if (clean.gclid || clean.gbraid || clean.wbraid) return 'google';
  if (clean.msclkid) return 'microsoft';
  return null;
}

/** Campaign marker (`utm_campaign`, falling back to `utm_content`). */
export function deriveCampaign(attribution: BookingAttribution | null | undefined): string | null {
  const clean = sanitizeAttribution(attribution);
  return clean.utm_campaign ?? clean.utm_content ?? null;
}

/** One-line summary used by developer tooling / logs. */
export function describeAttribution(attribution: BookingAttribution | null | undefined): string {
  const clean = sanitizeAttribution(attribution);
  const entries = ATTRIBUTION_KEYS.filter((key) => clean[key]);
  if (entries.length === 0) return 'direct';
  return entries.map((key) => `${key}=${clean[key]}`).join(' · ');
}

/** Client helper: reads persisted attribution (safe on the server). */
export function readStoredAttribution(): BookingAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeAttribution(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return {};
  }
}

/** Client helper: persists attribution for the rest of the session. */
export function storeAttribution(attribution: BookingAttribution): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(sanitizeAttribution(attribution)));
  } catch {
    /* storage unavailable (private mode) — attribution is simply not persisted */
  }
}
