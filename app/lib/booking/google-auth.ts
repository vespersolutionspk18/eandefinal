// ============================================================================
// GOOGLE SERVICE-ACCOUNT AUTHENTICATION (server-side only)
// ----------------------------------------------------------------------------
// Signs a JWT with the service-account private key (RS256) and exchanges it for
// an OAuth access token. No SDK: `node:crypto` + `fetch` only.
//
// This runs exclusively on the server. The private key is read from
// `GOOGLE_PRIVATE_KEY` and is never sent to the browser, never stored in the
// database and never logged.
//
// Setup checklist (see BOOKING_SETUP.md):
//   1. Google Cloud project → enable the Google Calendar API
//   2. Create a service account, download its JSON key
//   3. Share the booking calendar with the service-account address,
//      permission "Make changes to events"
//   4. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID
// ============================================================================

import { createSign } from 'node:crypto';

export type GoogleCredentials = {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
};

export type AccessTokenProvider = () => Promise<string>;

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function normalizePrivateKey(raw: string): string {
  // Env vars often arrive with literal "\n" sequences.
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

/** Reads the Google configuration from the environment (null when incomplete). */
export function readGoogleConfigFromEnv(): GoogleCredentials | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!clientEmail || !privateKey || !calendarId) return null;
  return { clientEmail, privateKey: normalizePrivateKey(privateKey), calendarId };
}

export type TokenProviderOptions = {
  fetchImpl?: typeof fetch;
  now?: () => number;
};

/**
 * Returns a cached access-token getter for the service account.
 * Tokens are refreshed one minute before they expire.
 */
export function createServiceAccountTokenProvider(
  credentials: GoogleCredentials,
  options: TokenProviderOptions = {},
): AccessTokenProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => Date.now());
  let cachedToken: string | null = null;
  let expiresAt = 0;

  return async function getAccessToken(): Promise<string> {
    if (cachedToken && now() < expiresAt) return cachedToken;

    const issuedAt = Math.floor(now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64Url(
      JSON.stringify({
        iss: credentials.clientEmail,
        scope: CALENDAR_SCOPE,
        aud: TOKEN_ENDPOINT,
        iat: issuedAt,
        exp: issuedAt + 3600,
      }),
    );

    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${claims}`);
    signer.end();
    const signature = base64Url(signer.sign(credentials.privateKey));
    const assertion = `${header}.${claims}.${signature}`;

    const response = await fetchImpl(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Google token request failed (${response.status}): ${text.slice(0, 300)}`);
    }

    const payload = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!payload.access_token) throw new Error('Google token response did not include an access token.');

    cachedToken = payload.access_token;
    expiresAt = now() + Math.max(0, (payload.expires_in ?? 3600) - 60) * 1000;
    return cachedToken;
  };
}
