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

export type PlacesFile = {
  places: Place[];
};
