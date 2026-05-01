export type Category = string;

export type CategoryDefinition = {
  name: Category;
  emoji: string;
  color: string;
};

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

export type PlacesFile = {
  places: Place[];
  categories?: Array<Category | CategoryDefinition>;
};
