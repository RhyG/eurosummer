import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from './env.js';
import type { Place, PlacesFile } from './types.js';

const FILE = path.join(env.dataDir, 'places.json');
const TMP = `${FILE}.tmp`;

let writeQueue: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(env.dataDir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    const empty: PlacesFile = { places: [] };
    await fs.writeFile(FILE, JSON.stringify(empty, null, 2), 'utf8');
  }
}

async function readFile(): Promise<PlacesFile> {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw) as PlacesFile;
    if (!parsed || !Array.isArray(parsed.places)) return { places: [] };
    return parsed;
  } catch {
    return { places: [] };
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

export async function getPlace(id: string): Promise<Place | undefined> {
  const data = await readFile();
  return data.places.find((p) => p.id === id);
}

export async function createPlace(place: Place): Promise<Place> {
  return enqueue(async () => {
    const data = await readFile();
    data.places.push(place);
    await writeFile(data);
    return place;
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
    const next: Place = { ...existing, ...patch, id: existing.id };
    data.places[idx] = next;
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
