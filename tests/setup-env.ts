// Loads .env.local for the integration tests (DATABASE_URL, optional Google
// credentials). Node's loader ignores missing files, so this is safe on CI.
import { existsSync } from 'node:fs';

if (typeof process.loadEnvFile === 'function' && existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    /* already loaded or unreadable — individual tests skip when env is missing */
  }
}
