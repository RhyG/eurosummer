import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import {
  createPlace,
  deletePlace,
  exportRaw,
  listPlaces,
  updatePlace,
} from '../store.js';
import type { Category, Country, Place } from '../types.js';

const CATEGORIES: readonly Category[] = [
  'restaurant',
  'bar',
  'cafe',
  'bakery',
  'other',
];
const COUNTRIES: readonly Country[] = ['italy', 'greece', 'other'];

function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);
}
function isCountry(v: unknown): v is Country {
  return typeof v === 'string' && (COUNTRIES as readonly string[]).includes(v);
}

function parseDraft(input: unknown): Omit<Place, 'id' | 'createdAt'> | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  if (typeof o.name !== 'string' || !o.name.trim()) return null;
  if (!isCategory(o.category)) return null;
  if (!isCountry(o.country)) return null;
  if (typeof o.lat !== 'number' || typeof o.lng !== 'number') return null;
  if (typeof o.address !== 'string') return null;
  return {
    name: o.name.trim(),
    category: o.category,
    country: o.country,
    lat: o.lat,
    lng: o.lng,
    address: o.address,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
    sourceUrl: typeof o.sourceUrl === 'string' ? o.sourceUrl : undefined,
    visited: o.visited === true,
    googlePlaceId:
      typeof o.googlePlaceId === 'string' ? o.googlePlaceId : undefined,
  };
}

function parsePatch(input: unknown): Partial<Place> | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const patch: Partial<Place> = {};
  if (o.name !== undefined) {
    if (typeof o.name !== 'string' || !o.name.trim()) return null;
    patch.name = o.name.trim();
  }
  if (o.category !== undefined) {
    if (!isCategory(o.category)) return null;
    patch.category = o.category;
  }
  if (o.country !== undefined) {
    if (!isCountry(o.country)) return null;
    patch.country = o.country;
  }
  if (o.lat !== undefined) {
    if (typeof o.lat !== 'number') return null;
    patch.lat = o.lat;
  }
  if (o.lng !== undefined) {
    if (typeof o.lng !== 'number') return null;
    patch.lng = o.lng;
  }
  if (o.address !== undefined) {
    if (typeof o.address !== 'string') return null;
    patch.address = o.address;
  }
  if (o.notes !== undefined) {
    if (typeof o.notes !== 'string') return null;
    patch.notes = o.notes;
  }
  if (o.sourceUrl !== undefined) {
    if (typeof o.sourceUrl !== 'string') return null;
    patch.sourceUrl = o.sourceUrl;
  }
  if (o.visited !== undefined) {
    if (typeof o.visited !== 'boolean') return null;
    patch.visited = o.visited;
  }
  return patch;
}

export const placeRoutes = new Hono();

placeRoutes.get('/export', async (c) => {
  const raw = await exportRaw();
  c.header('Content-Type', 'application/json');
  c.header(
    'Content-Disposition',
    `attachment; filename="eatlist-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  return c.body(raw);
});

placeRoutes.get('/', async (c) => {
  const places = await listPlaces();
  return c.json({ places });
});

placeRoutes.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const draft = parseDraft(body);
  if (!draft) return c.json({ error: 'invalid_place' }, 400);
  const place: Place = { ...draft, id: nanoid(10), createdAt: Date.now() };
  await createPlace(place);
  return c.json({ place }, 201);
});

placeRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const patch = parsePatch(body);
  if (!patch) return c.json({ error: 'invalid_patch' }, 400);
  const updated = await updatePlace(id, patch);
  if (!updated) return c.json({ error: 'not_found' }, 404);
  return c.json({ place: updated });
});

placeRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deletePlace(id);
  if (!ok) return c.json({ error: 'not_found' }, 404);
  return c.body(null, 204);
});
