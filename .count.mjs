// Temporary verification: the bookings table must be empty after the smoke test.
import { readFileSync } from 'node:fs';

const { neon } = await import('@neondatabase/serverless');

const match = readFileSync('.env.local', 'utf8').match(/DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/);
const url = new URL(match[1].trim());
url.searchParams.delete('channel_binding');
const sql = neon(url.toString());

const rows = await sql`select count(*)::int as n, count(*) filter (where status <> 'cancelled')::int as active from bookings`;
console.log(`bookings rows: ${rows[0].n} | active: ${rows[0].active}`);
