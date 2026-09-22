// ============================================================================
// CUSTOMER DETAIL VALIDATION (Step 1)
// ----------------------------------------------------------------------------
// Runs in the browser for instant feedback and again on the server, which is
// the source of truth. Phone handling is US-first: 10 digits (a leading "1"
// country code is accepted) and the number is stored in E.164 (`+18055900908`).
// ============================================================================

import { resolveServiceType } from './config';

export type CustomerDetails = {
  fullName: string;
  phone: string;
  address: string;
  serviceType: string;
};

export type CustomerDetailsField = keyof CustomerDetails;
export type CustomerDetailsErrors = Partial<Record<CustomerDetailsField, string>>;

export const CUSTOMER_FIELD_LIMITS = {
  fullName: 80,
  address: 180,
  phone: 40,
} as const;

/** Strips control characters and angle brackets, collapses whitespace, trims. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** `"805-555-1234"` → `"+18055551234"`. Returns null when not a valid US number. */
export function normalizeUsPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/\D+/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  if (!/^[2-9]\d{2}$/.test(digits.slice(0, 3))) return null;
  if (!/^[2-9]\d{2}$/.test(digits.slice(3, 6))) return null;
  return `+1${digits}`;
}

/** `"+18055551234"` → `"(805) 555-1234"`. */
export function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D+/g, '').replace(/^1/, '');
  if (digits.length !== 10) return e164;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** `"+18055551234"` → `"+1 805 555 1234"` (used in calendar event text). */
export function formatPhoneSpaced(e164: string): string {
  const digits = e164.replace(/\D+/g, '').replace(/^1/, '');
  if (digits.length !== 10) return e164;
  return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** Progressively formats what the visitor types into `(805) 555-1234`. */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D+/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Validates and normalizes the Step 1 fields.
 * Returns `{ ok: true, value }` with sanitized values, or `{ ok: false, errors }`
 * keyed by field name so the form and the API render identical copy.
 */
export function validateCustomerDetails(
  input: unknown,
): { ok: true; value: CustomerDetails } | { ok: false; errors: CustomerDetailsErrors } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: CustomerDetailsErrors = {};

  const fullName = sanitizeText(raw.fullName, CUSTOMER_FIELD_LIMITS.fullName);
  if (fullName.length < 2 || !/\p{L}{2}/u.test(fullName)) {
    errors.fullName = 'Enter your full name.';
  }

  const phone = normalizeUsPhone(raw.phone);
  if (!phone) {
    errors.phone = 'Enter a valid 10-digit US phone number.';
  }

  const address = sanitizeText(raw.address, CUSTOMER_FIELD_LIMITS.address);
  if (address.length < 6 || !/\d/.test(address) || !/\p{L}{2}/u.test(address)) {
    errors.address = 'Enter the property address (street number and name).';
  }

  const serviceType = resolveServiceType(typeof raw.serviceType === 'string' ? raw.serviceType : '');
  if (!serviceType) {
    errors.serviceType = 'Choose a project type.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      fullName,
      phone: phone as string,
      address,
      serviceType: (serviceType as NonNullable<typeof serviceType>).label,
    },
  };
}
