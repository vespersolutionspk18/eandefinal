// ============================================================================
// POSTGRES ACCESS (Neon serverless driver — no ORM)
// ----------------------------------------------------------------------------
// Server-side only. The connection string is read from `DATABASE_URL` and never
// reaches the browser bundle (no NEXT_PUBLIC_ prefix, no client import of this
// module).
//
// Queries go over Neon's HTTP SQL endpoint, which is stateless and needs no
// connection pool — ideal for Next.js route handlers and serverless deploys.
// The booking claim is a single statement so no interactive transaction is
// required.
// ============================================================================

import { neon } from '@neondatabase/serverless';

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL is not set — the booking API cannot reach Postgres.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export class DatabaseError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

/** Normalizes the connection string (drops libpq-only params). */
export function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // `channel_binding` is a libpq option that the serverless driver does not
    // implement; the URL is still valid without it.
    url.searchParams.delete('channel_binding');
    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
    return url.toString();
  } catch {
    return raw;
  }
}

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new DatabaseNotConfiguredError();
  return normalizeDatabaseUrl(raw);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

type SqlClient = ReturnType<typeof neon>;

let client: SqlClient | null = null;
let clientUrl: string | null = null;

function getClient(): SqlClient {
  const url = getDatabaseUrl();
  if (!client || clientUrl !== url) {
    client = neon(url);
    clientUrl = url;
  }
  return client;
}

/** Runs a parameterized query and returns its rows. */
export async function queryRows<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const rows = (await getClient().query(text, params)) as unknown as T[];
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    throw toDatabaseError(error);
  }
}

/** Runs DDL or any statement where only the row count matters. */
export async function execute(text: string, params: unknown[] = []): Promise<number> {
  const rows = await queryRows(text, params);
  return rows.length;
}

/** Runs a parameterized query expecting exactly one row (or none). */
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryRows<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export function toDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) return error;
  const candidate = error as { message?: string; code?: string } | null;
  return new DatabaseError(candidate?.message ?? 'Database request failed.', candidate?.code);
}

/** Extracts the Postgres error code from any thrown value. */
export function errorCode(error: unknown): string | undefined {
  const candidate = error as { code?: string; cause?: { code?: string } } | null;
  return candidate?.code ?? candidate?.cause?.code;
}

/** Test helper: forget the cached client (used when DATABASE_URL changes). */
export function resetDatabaseClientForTests(): void {
  client = null;
  clientUrl = null;
}
