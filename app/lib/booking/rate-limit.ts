// ============================================================================
// RATE LIMITING (booking endpoints)
// ----------------------------------------------------------------------------
// Small fixed-window limiter so a public write endpoint cannot be hammered.
//
// Scope: this is per-process memory, which is the right amount of protection
// for a single-instance Node deployment and for serverless (each warm instance
// keeps its own window). If the app ever runs at a scale where shared limits
// matter, swap the Map for Upstash/Redis — the call sites do not change.
// ============================================================================

type Bucket = { count: number; resetAt: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export type RateLimiter = {
  check(key: string): RateLimitResult;
  reset(): void;
};

const MAX_TRACKED_KEYS = 5_000;

export function createRateLimiter(options: { windowMs: number; max: number }): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();

      if (buckets.size > MAX_TRACKED_KEYS) {
        for (const [bucketKey, bucket] of buckets) {
          if (bucket.resetAt <= now) buckets.delete(bucketKey);
        }
      }

      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { ok: true };
      }

      if (existing.count >= options.max) {
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
      }

      existing.count += 1;
      return { ok: true };
    },

    reset(): void {
      buckets.clear();
    },
  };
}

/** Best-effort client identity behind a proxy/CDN. */
export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Booking creation.
 *
 * Every attempt counts — including 409 conflicts and 400 validation errors —
 * so this has to leave room for a real person to retry: pick a time, lose the
 * race to somebody else, pick another, mistype the phone once.
 *
 * The budget is deliberately generous because the key is the client IP and
 * mobile carriers share egress addresses (CGNAT): a tight limit lets one
 * visitor's retries lock out unrelated visitors on the same IP.
 */
export const bookingRateLimiter = createRateLimiter({ windowMs: 60_000, max: 12 });

/** Availability reads: generous, they are cache-friendly and read-only. */
export const availabilityRateLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
