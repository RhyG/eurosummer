export type City = {
  name: string;
  country: 'italy' | 'greece';
  lat: number;
  lng: number;
  zoom: number;
};

export const CITIES: readonly City[] = [
  { name: 'Rome', country: 'italy', lat: 41.9028, lng: 12.4964, zoom: 13 },
  {
    name: 'Florence',
    country: 'italy',
    lat: 43.7696,
    lng: 11.2558,
    zoom: 14,
  },
  {
    name: 'Montepulciano',
    country: 'italy',
    lat: 43.0942,
    lng: 11.7807,
    zoom: 15,
  },
  { name: 'Athens', country: 'greece', lat: 37.9755, lng: 23.7348, zoom: 13 },
  { name: 'Paros', country: 'greece', lat: 37.0856, lng: 25.1492, zoom: 12 },
  { name: 'Milos', country: 'greece', lat: 36.6927, lng: 24.4344, zoom: 12 },
  {
    name: 'Santorini',
    country: 'greece',
    lat: 36.3932,
    lng: 25.4615,
    zoom: 12,
  },
];

export const MEDITERRANEAN_VIEW = {
  lat: 39.5,
  lng: 19.0,
  zoom: 5,
};
