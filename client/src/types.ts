export type Category = string;

export type TimeOfWeek = { day: number; hour: number; minute: number };
export type OpeningPeriod = { open: TimeOfWeek; close?: TimeOfWeek };

export type Place = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address: string;
  locality?: string;
  notes?: string;
  sourceUrl?: string;
  visited: boolean;
  createdAt: number;
  googlePlaceId?: string;
  openingPeriods?: OpeningPeriod[];
  photoNames?: string[];
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
  locality: string | null;
  openingPeriods: OpeningPeriod[] | null;
  photoNames: string[] | null;
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
  openingPeriods: OpeningPeriod[] | null;
  photoNames: string[] | null;
};
