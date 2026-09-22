// ---------------------------------------------------------------------------
// Standalone booking migration runner:  node scripts/db-migrate.mjs
//
// Applies the same statements as app/lib/booking/migrate.ts (which runs
// automatically on the first API request) so the schema can also be created
// from a terminal or CI before the app is deployed.
//
// The SQL lives in app/lib/booking/schema.ts, which has no imports, so Node can
// load it directly with its built-in TypeScript type stripping.
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of ['.env.local', '.env']) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    const match = readFileSync(path, 'utf8').match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/m);
    if (match) return match[1].trim();
  }
  return null;
}

const { BOOKING_BASE_STATEMENTS, BOOKING_EXTENSION_STATEMENT, BOOKING_OVERLAP_CONSTRAINT, BOOKING_OVERLAP_STATEMENT } =
  await import('../app/lib/booking/schema.ts');

const { neon } = await import('@neondatabase/serverless');

const rawUrl = loadDatabaseUrl();
if (!rawUrl) {
  console.error('DATABASE_URL is not set (checked the environment, .env.local and .env).');
  process.exit(1);
}

const url = new URL(rawUrl);
url.searchParams.delete('channel_binding');
if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');

const sql = neon(url.toString());
const firstLine = (statement) => statement.split('\n')[0].replace(/\s+/g, ' ').trim();

console.log('Applying booking schema…');
for (const statement of BOOKING_BASE_STATEMENTS) {
  await sql.query(statement);
  console.log(`  ok  ${firstLine(statement)}`);
}

const existing = await sql.query('SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = $1) AS present', [
  BOOKING_OVERLAP_CONSTRAINT,
]);

if (existing[0]?.present) {
  console.log(`  ok  ${BOOKING_OVERLAP_CONSTRAINT} already present`);
} else {
  try {
    await sql.query(BOOKING_EXTENSION_STATEMENT);
    await sql.query(BOOKING_OVERLAP_STATEMENT);
    console.log(`  ok  ${firstLine(BOOKING_OVERLAP_STATEMENT)}`);
  } catch (error) {
    console.warn(`  !!  optional overlap constraint skipped: ${error?.message ?? error}`);
  }
}

const columns = await sql.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' ORDER BY ordinal_position`,
);
console.log(`bookings columns: ${columns.map((row) => row.column_name).join(', ')}`);

const constraints = await sql.query(
  `SELECT conname FROM pg_constraint WHERE conrelid = 'bookings'::regclass ORDER BY conname`,
);
console.log(`constraints: ${constraints.map((row) => row.conname).join(', ')}`);

const indexes = await sql.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'bookings' ORDER BY indexname`);
console.log(`indexes: ${indexes.map((row) => row.indexname).join(', ')}`);
console.log('Done.');
