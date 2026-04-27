export type Category = 'restaurant' | 'bar' | 'cafe' | 'bakery' | 'other';
export type Country = 'italy' | 'greece' | 'other';

export type Place = {
  id: string;
  name: string;
  category: Category;
  country: Country;
  lat: number;
  lng: number;
  address: string;
  notes?: string;
  sourceUrl?: string;
  visited: boolean;
  createdAt: number;
  googlePlaceId?: string;
};

export type Prediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  suggestedCategory: Category;
  country: Country;
};

export type PlaceInfo = {
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  businessStatus: string | null;
  openNow: boolean | null;
  weekdayDescriptions: string[] | null;
};
