// ============================================================================
// PAYLOAD VALIDATION + ATTRIBUTION TESTS
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  formatPhoneDisplay,
  formatPhoneInput,
  normalizeUsPhone,
  sanitizeText,
  validateCustomerDetails,
} from '@/app/lib/booking/validation';
import {
  buildAttribution,
  deriveCampaign,
  deriveSource,
  parseAttributionFromSearch,
  sanitizeAttribution,
} from '@/app/lib/booking/attribution';
import { resolveServiceType } from '@/app/lib/booking/config';

describe('US phone numbers', () => {
  it('accepts the formats people actually type', () => {
    for (const input of ['8055551234', '805-555-1234', '(805) 555-1234', '+1 805 555 1234', '1 (805) 555-1234']) {
      expect(normalizeUsPhone(input), input).toBe('+18055551234');
    }
  });

  it('rejects incomplete, local or invalid numbers', () => {
    for (const input of ['', '5551234', '80555512', '0055551234', '1055551234', '8051551234', 'abcdefghij']) {
      expect(normalizeUsPhone(input), input).toBeNull();
    }
  });

  it('formats input and display consistently', () => {
    expect(formatPhoneInput('8055551234')).toBe('(805) 555-1234');
    expect(formatPhoneInput('805')).toBe('805');
    expect(formatPhoneDisplay('+18055551234')).toBe('(805) 555-1234');
  });
});

describe('text sanitizing', () => {
  it('strips angle brackets, control characters and excess length', () => {
    expect(sanitizeText('  John <script>  Smith  ', 80)).toBe('John script Smith');
    expect(sanitizeText('Ana\u0000Maria', 80)).toBe('Ana Maria');
    expect(sanitizeText('x'.repeat(200), 20)).toHaveLength(20);
    expect(sanitizeText(42, 20)).toBe('');
  });
});

describe('validateCustomerDetails', () => {
  const valid = {
    fullName: 'John Smith',
    phone: '(805) 555-1234',
    address: '123 Main Street, Santa Barbara, CA',
    serviceType: 'kitchen',
  };

  it('accepts a complete submission and normalizes it', () => {
    const result = validateCustomerDetails(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        fullName: 'John Smith',
        phone: '+18055551234',
        address: '123 Main Street, Santa Barbara, CA',
        serviceType: 'Kitchen Remodeling',
      });
    }
  });

  it('rejects each field with actionable copy', () => {
    const result = validateCustomerDetails({ fullName: 'J', phone: '123', address: 'Main St', serviceType: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['address', 'fullName', 'phone', 'serviceType']);
      expect(result.errors.phone).toContain('10-digit');
    }
  });

  it('requires a street number in the address', () => {
    const result = validateCustomerDetails({ ...valid, address: 'Main Street, Santa Barbara' });
    expect(result.ok).toBe(false);
  });

  it('ignores hostile extra properties', () => {
    const result = validateCustomerDetails({ ...valid, endTime: '1999-01-01T00:00:00Z', durationMinutes: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.value)).toEqual(['fullName', 'phone', 'address', 'serviceType']);
  });

  it('resolves service types by id or label', () => {
    expect(resolveServiceType('Kitchen Remodeling')?.id).toBe('kitchen');
    expect(resolveServiceType('adu')?.label).toBe('ADU / Garage Conversion');
    expect(resolveServiceType('nonsense')).toBeNull();
  });
});

describe('attribution', () => {
  it('keeps only allow-listed keys with bounded values', () => {
    const sanitized = sanitizeAttribution({
      utm_source: 'meta',
      utm_campaign: 'kitchen-remodeling',
      fbclid: 'abc123',
      evil: 'drop-me',
      utm_term: 'x'.repeat(500),
    });
    expect(sanitized.utm_source).toBe('meta');
    expect(sanitized.utm_campaign).toBe('kitchen-remodeling');
    expect(sanitized.fbclid).toBe('abc123');
    expect((sanitized as Record<string, unknown>).evil).toBeUndefined();
    expect(sanitized.utm_term).toHaveLength(300);
  });

  it('parses ad parameters from the landing URL', () => {
    const parsed = parseAttributionFromSearch('?utm_source=meta&utm_campaign=kitchen-remodeling&fbclid=xyz&ignored=1');
    expect(parsed).toEqual({ utm_source: 'meta', utm_campaign: 'kitchen-remodeling', fbclid: 'xyz' });
  });

  it('derives the source and campaign for reporting', () => {
    expect(deriveSource({ utm_source: 'meta' })).toBe('meta');
    expect(deriveSource({ fbclid: 'only-a-click-id' })).toBe('meta');
    expect(deriveSource({ gclid: 'google-click' })).toBe('google');
    expect(deriveCampaign({ utm_campaign: 'kitchen-remodeling' })).toBe('kitchen-remodeling');
    expect(deriveCampaign({ utm_content: 'bathroom-ad' })).toBe('bathroom-ad');
    expect(deriveCampaign({})).toBeNull();
  });

  it('merges stored attribution with fresh query parameters', () => {
    const merged = buildAttribution({
      search: '?utm_source=meta&utm_campaign=fall-promo',
      stored: { utm_source: 'google', utm_medium: 'cpc', fbclid: 'old' },
      referrerHost: 'facebook.com',
    });
    expect(merged.utm_source).toBe('meta'); // fresh beats stored
    expect(merged.utm_medium).toBe('cpc'); // stored survives
    expect(merged.utm_campaign).toBe('fall-promo');
    expect(merged.referrer).toBe('facebook.com');
  });
});
