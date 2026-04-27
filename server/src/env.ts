import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// Load .env from the workspace root (one level up from server/) and from
// the server dir, in that order. First match wins; existing process env wins over both.
config({ path: path.resolve(here, '../../.env') });
config({ path: path.resolve(here, '../.env') });

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(optional('PORT', '8080')),
  dataDir: optional('DATA_DIR', './data'),
  authPassword: required('AUTH_PASSWORD'),
  authToken: required('AUTH_TOKEN'),
  googlePlacesApiKey: required('GOOGLE_PLACES_API_KEY'),
  clientDist: optional('CLIENT_DIST', '../client/dist'),
};
