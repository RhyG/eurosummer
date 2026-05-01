import { Hono } from 'hono';
import { env } from '../env.js';
import type { Category, OpeningPeriod } from '../types.js';

const AUTOCOMPLETE_URL =
  'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

type AutocompletePrediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

type GoogleAutocompleteResp = {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
};

type GoogleDetailsResp = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
  types?: string[];
  addressComponents?: Array<{
    types?: string[];
    shortText?: string;
    longText?: string;
  }>;
  regularOpeningHours?: GoogleHours;
  photos?: GooglePhoto[];
};

type GoogleTimeOfWeek = { day?: number; hour?: number; minute?: number };
type GooglePeriod = { open?: GoogleTimeOfWeek; close?: GoogleTimeOfWeek };
type GoogleHours = {
  openNow?: boolean;
  weekdayDescriptions?: string[];
  periods?: GooglePeriod[];
};

type GooglePhoto = { name?: string };

type GoogleInfoResp = {
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  regularOpeningHours?: GoogleHours;
  currentOpeningHours?: GoogleHours;
  photos?: GooglePhoto[];
};

function normalizePeriods(hours: GoogleHours | undefined): OpeningPeriod[] | null {
  if (!hours?.periods) return null;
  const out: OpeningPeriod[] = [];
  for (const p of hours.periods) {
    if (
      !p.open ||
      typeof p.open.day !== 'number' ||
      typeof p.open.hour !== 'number'
    ) {
      continue;
    }
    const open = {
      day: p.open.day,
      hour: p.open.hour,
      minute: p.open.minute ?? 0,
    };
    if (
      p.close &&
      typeof p.close.day === 'number' &&
      typeof p.close.hour === 'number'
    ) {
      out.push({
        open,
        close: {
          day: p.close.day,
          hour: p.close.hour,
          minute: p.close.minute ?? 0,
        },
      });
    } else {
      out.push({ open });
    }
  }
  return out.length ? out : null;
}

function normalizePhotoNames(photos: GooglePhoto[] | undefined): string[] | null {
  if (!photos) return null;
  const names = photos
    .map((p) => p.name)
    .filter((n): n is string => typeof n === 'string' && PHOTO_NAME_RE.test(n))
    .slice(0, 6);
  return names.length ? names : null;
}

function categoryFromTypes(types: string[]): Category {
  const set = new Set(types);
  if (set.has('bakery')) return 'Bakery';
  if (set.has('cafe') || set.has('coffee_shop')) return 'Cafe';
  if (set.has('hamburger_restaurant')) return 'Burgers';
  if (set.has('japanese_restaurant') || set.has('sushi_restaurant')) {
    return 'Japanese';
  }
  if (set.has('italian_restaurant') || set.has('pizza_restaurant')) {
    return 'Italian';
  }
  if (set.has('mexican_restaurant')) return 'Mexican';
  if (set.has('thai_restaurant')) return 'Thai';
  if (set.has('vietnamese_restaurant')) return 'Vietnamese';
  if (set.has('indian_restaurant')) return 'Indian';
  if (set.has('american_restaurant')) return 'American';
  if (
    set.has('bar') ||
    set.has('night_club') ||
    set.has('wine_bar') ||
    set.has('pub')
  ) {
    return 'Bar';
  }
  if (
    set.has('restaurant') ||
    set.has('food') ||
    set.has('meal_takeaway') ||
    set.has('meal_delivery') ||
    Array.from(set).some((t) => t.endsWith('_restaurant'))
  ) {
    return 'Other';
  }
  return 'Other';
}

function localityFromComponents(
  components: GoogleDetailsResp['addressComponents'],
): string | null {
  if (!components) return null;
  const preferredTypes = [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_2',
    'sublocality',
  ];
  for (const type of preferredTypes) {
    const match = components.find((c) => c.types?.includes(type));
    const text = match?.longText ?? match?.shortText;
    if (text) return text;
  }
  for (const c of components) {
    const text = c.longText ?? c.shortText;
    if (text) return text;
  }
  return null;
}

export const searchRoutes = new Hono();

searchRoutes.get('/', async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) return c.json({ predictions: [] });

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.googlePlacesApiKey,
    },
    body: JSON.stringify({ input: q }),
  });

  if (!res.ok) {
    const text = await res.text();
    return c.json(
      { error: 'google_error', status: res.status, detail: text },
      502,
    );
  }

  const data = (await res.json()) as GoogleAutocompleteResp;
  const predictions: AutocompletePrediction[] = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      placeId: p.placeId,
      primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
    }));

  return c.json({ predictions });
});

searchRoutes.get('/info/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  const fields = [
    'rating',
    'userRatingCount',
    'priceLevel',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'websiteUri',
    'googleMapsUri',
    'businessStatus',
    'regularOpeningHours',
    'currentOpeningHours',
    'photos',
  ].join(',');

  const res = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': env.googlePlacesApiKey,
      'X-Goog-FieldMask': fields,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return c.json(
      { error: 'google_error', status: res.status, detail: text },
      502,
    );
  }

  const data = (await res.json()) as GoogleInfoResp;
  const hours = data.currentOpeningHours ?? data.regularOpeningHours;

  return c.json({
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? null,
    priceLevel: data.priceLevel ?? null,
    phone: data.nationalPhoneNumber ?? data.internationalPhoneNumber ?? null,
    website: data.websiteUri ?? null,
    googleMapsUri: data.googleMapsUri ?? null,
    businessStatus: data.businessStatus ?? null,
    openNow: hours?.openNow ?? null,
    weekdayDescriptions: hours?.weekdayDescriptions ?? null,
    openingPeriods: normalizePeriods(data.regularOpeningHours),
    photoNames: normalizePhotoNames(data.photos),
  });
});

searchRoutes.get('/photo', async (c) => {
  const name = c.req.query('name');
  const maxWidth = c.req.query('maxWidth') ?? '600';
  if (!name || !PHOTO_NAME_RE.test(name)) {
    return c.json({ error: 'invalid_name' }, 400);
  }
  const width = Math.min(Math.max(parseInt(maxWidth, 10) || 600, 50), 2000);
  const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${encodeURIComponent(env.googlePlacesApiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return c.json({ error: 'google_error', status: res.status }, 502);
  }
  const ct = res.headers.get('content-type') ?? 'image/jpeg';
  const buf = await res.arrayBuffer();
  c.header('Content-Type', ct);
  c.header('Cache-Control', 'public, max-age=86400, immutable');
  return c.body(buf);
});

searchRoutes.get('/details/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'primaryType',
    'types',
    'addressComponents',
    'regularOpeningHours',
    'photos',
  ].join(',');

  const res = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': env.googlePlacesApiKey,
      'X-Goog-FieldMask': fields,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return c.json(
      { error: 'google_error', status: res.status, detail: text },
      502,
    );
  }

  const data = (await res.json()) as GoogleDetailsResp;
  const types = [
    ...(data.primaryType ? [data.primaryType] : []),
    ...(data.types ?? []),
  ];

  return c.json({
    googlePlaceId: data.id ?? placeId,
    name: data.displayName?.text ?? '',
    address: data.formattedAddress ?? '',
    lat: data.location?.latitude ?? 0,
    lng: data.location?.longitude ?? 0,
    suggestedCategory: categoryFromTypes(types),
    locality: localityFromComponents(data.addressComponents),
    openingPeriods: normalizePeriods(data.regularOpeningHours),
    photoNames: normalizePhotoNames(data.photos),
  });
});
