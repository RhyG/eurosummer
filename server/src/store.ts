import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from './env.js';
import {
  mergeCategoryDefinitions,
  normalizeCategoryDefinition,
  normalizeCategoryName,
} from './categories.js';
import type { Category, CategoryDefinition, Place, PlacesFile } from './types.js';

const FILE = path.join(env.dataDir, 'places.json');
const TMP = `${FILE}.tmp`;

let writeQueue: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(env.dataDir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    const empty: PlacesFile = {
      places: [],
      categories: mergeCategoryDefinitions([], true),
    };
    await fs.writeFile(FILE, JSON.stringify(empty, null, 2), 'utf8');
  }
}

function inferLocalityFromAddress(address: string): string | undefined {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return undefined;
  const candidate = parts[parts.length - 2] ?? parts[0] ?? '';
  const locality = candidate
    .replace(/\b[A-Z]{2,3}\b/g, '')
    .replace(/\b\d{3,6}\b/g, '')
    .trim();
  return locality || undefined;
}

function normalizePlace(value: unknown): Place | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== 'string') return null;
  if (typeof o.name !== 'string' || !o.name.trim()) return null;
  if (typeof o.category !== 'string' || !o.category.trim()) return null;
  if (typeof o.lat !== 'number' || typeof o.lng !== 'number') return null;
  if (typeof o.address !== 'string') return null;
  if (typeof o.visited !== 'boolean') return null;
  if (typeof o.createdAt !== 'number') return null;

  const locality =
    typeof o.locality === 'string' && o.locality.trim()
      ? o.locality.trim()
      : inferLocalityFromAddress(o.address);

  return {
    id: o.id,
    name: o.name.trim(),
    category: normalizeCategoryName(o.category),
    lat: o.lat,
    lng: o.lng,
    address: o.address,
    locality,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
    sourceUrl: typeof o.sourceUrl === 'string' ? o.sourceUrl : undefined,
    visited: o.visited,
    createdAt: o.createdAt,
    googlePlaceId:
      typeof o.googlePlaceId === 'string' ? o.googlePlaceId : undefined,
    openingPeriods: Array.isArray(o.openingPeriods)
      ? (o.openingPeriods as Place['openingPeriods'])
      : undefined,
    photoNames: Array.isArray(o.photoNames)
      ? (o.photoNames as string[])
      : undefined,
  };
}

function normalizeFile(parsed: unknown): PlacesFile {
  if (!parsed || typeof parsed !== 'object') {
    return { places: [], categories: mergeCategoryDefinitions([], true) };
  }
  const o = parsed as Record<string, unknown>;
  const places = Array.isArray(o.places)
    ? o.places.map(normalizePlace).filter((p): p is Place => Boolean(p))
    : [];
  const storedCategories = Array.isArray(o.categories) ? o.categories : [];
  const placeCategories = places.map((p) => p.category);
  const includeDefaults = !Array.isArray(o.categories);
  return {
    places,
    categories: mergeCategoryDefinitions(
      [...storedCategories, ...placeCategories],
      includeDefaults,
    ),
  };
}

async function readFile(): Promise<PlacesFile> {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  try {
    return normalizeFile(JSON.parse(raw));
  } catch {
    return { places: [], categories: mergeCategoryDefinitions([], true) };
  }
}

async function writeFile(data: PlacesFile): Promise<void> {
  await fs.mkdir(env.dataDir, { recursive: true });
  await fs.writeFile(TMP, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(TMP, FILE);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function listPlaces(): Promise<Place[]> {
  const data = await readFile();
  return data.places;
}

export async function listCategories(): Promise<CategoryDefinition[]> {
  const data = await readFile();
  return mergeCategoryDefinitions(data.categories ?? []);
}

export async function addCategory(
  category: Category,
): Promise<CategoryDefinition[]> {
  return enqueue(async () => {
    const data = await readFile();
    data.categories = mergeCategoryDefinitions([
      ...(data.categories ?? []),
      category,
    ]);
    await writeFile(data);
    return mergeCategoryDefinitions(data.categories);
  });
}

export async function updateCategory(
  currentName: Category,
  nextDefinition: CategoryDefinition,
): Promise<{ categories: CategoryDefinition[]; places: Place[] } | null> {
  return enqueue(async () => {
    const data = await readFile();
    const categories = mergeCategoryDefinitions(data.categories ?? []);
    const current = normalizeCategoryName(currentName);
    const next = normalizeCategoryDefinition(nextDefinition);
    if (!current || !next) return null;
    if (current.toLowerCase() === 'other' && next.name !== 'Other') {
      return null;
    }
    const idx = categories.findIndex(
      (category) => category.name.toLowerCase() === current.toLowerCase(),
    );
    if (idx === -1) return null;
    const duplicate = categories.some(
      (category, i) =>
        i !== idx && category.name.toLowerCase() === next.name.toLowerCase(),
    );
    if (duplicate) return null;
    categories[idx] = next;
    data.places = data.places.map((place) =>
      place.category.toLowerCase() === current.toLowerCase()
        ? { ...place, category: next.name }
        : place,
    );
    data.categories = mergeCategoryDefinitions(categories);
    await writeFile(data);
    return { categories: mergeCategoryDefinitions(data.categories), places: data.places };
  });
}

export async function deleteCategory(
  categoryName: Category,
): Promise<{ categories: CategoryDefinition[]; places: Place[] } | null> {
  return enqueue(async () => {
    const data = await readFile();
    const category = normalizeCategoryName(categoryName);
    if (!category || category.toLowerCase() === 'other') return null;
    const categories = mergeCategoryDefinitions(data.categories ?? []);
    const nextCategories = categories.filter(
      (item) => item.name.toLowerCase() !== category.toLowerCase(),
    );
    if (nextCategories.length === categories.length) return null;
    data.places = data.places.map((place) =>
      place.category.toLowerCase() === category.toLowerCase()
        ? { ...place, category: 'Other' }
        : place,
    );
    data.categories = mergeCategoryDefinitions(nextCategories);
    await writeFile(data);
    return { categories: mergeCategoryDefinitions(data.categories), places: data.places };
  });
}

export async function getPlace(id: string): Promise<Place | undefined> {
  const data = await readFile();
  return data.places.find((p) => p.id === id);
}

export async function createPlace(place: Place): Promise<Place> {
  return enqueue(async () => {
    const data = await readFile();
    const next = { ...place, category: normalizeCategoryName(place.category) };
    data.categories = mergeCategoryDefinitions([
      ...(data.categories ?? []),
      next.category,
    ]);
    data.places.push(next);
    await writeFile(data);
    return next;
  });
}

export async function updatePlace(
  id: string,
  patch: Partial<Place>,
): Promise<Place | undefined> {
  return enqueue(async () => {
    const data = await readFile();
    const idx = data.places.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const existing = data.places[idx]!;
    const next: Place = {
      ...existing,
      ...patch,
      id: existing.id,
      category:
        typeof patch.category === 'string'
          ? normalizeCategoryName(patch.category)
          : existing.category,
    };
    data.places[idx] = next;
    data.categories = mergeCategoryDefinitions([
      ...(data.categories ?? []),
      next.category,
    ]);
    await writeFile(data);
    return next;
  });
}

export async function deletePlace(id: string): Promise<boolean> {
  return enqueue(async () => {
    const data = await readFile();
    const before = data.places.length;
    data.places = data.places.filter((p) => p.id !== id);
    if (data.places.length === before) return false;
    await writeFile(data);
    return true;
  });
}

export async function exportRaw(): Promise<string> {
  await ensureFile();
  return fs.readFile(FILE, 'utf8');
}
