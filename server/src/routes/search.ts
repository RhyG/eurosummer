import { Hono } from 'hono';
import { env } from '../env.js';
import type { Category, Country } from '../types.js';

const AUTOCOMPLETE_URL =
  'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

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
};

type GoogleHours = {
  openNow?: boolean;
  weekdayDescriptions?: string[];
};

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
};

function categoryFromTypes(types: string[]): Category {
  const set = new Set(types);
  if (set.has('bakery')) return 'bakery';
  if (set.has('cafe') || set.has('coffee_shop')) return 'cafe';
  if (
    set.has('bar') ||
    set.has('night_club') ||
    set.has('wine_bar') ||
    set.has('pub')
  ) {
    return 'bar';
  }
  if (
    set.has('restaurant') ||
    set.has('food') ||
    set.has('meal_takeaway') ||
    set.has('meal_delivery') ||
    Array.from(set).some((t) => t.endsWith('_restaurant'))
  ) {
    return 'restaurant';
  }
  return 'other';
}

function countryFromComponents(
  components: GoogleDetailsResp['addressComponents'],
): Country {
  if (!components) return 'other';
  for (const c of components) {
    if (c.types?.includes('country')) {
      const code = (c.shortText ?? '').toUpperCase();
      if (code === 'IT') return 'italy';
      if (code === 'GR') return 'greece';
      return 'other';
    }
  }
  return 'other';
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
  });
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
    country: countryFromComponents(data.addressComponents),
  });
});
