import type { Category, Country } from '@/types';

export const CATEGORIES: readonly Category[] = [
  'restaurant',
  'bar',
  'cafe',
  'bakery',
  'other',
];

export const COUNTRIES: readonly Country[] = ['italy', 'greece', 'other'];

type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  restaurant: { label: 'Restaurants', emoji: '🍝', color: '#C65D3A' },
  bar: { label: 'Bars', emoji: '🍷', color: '#6B7C3A' },
  cafe: { label: 'Cafes', emoji: '☕', color: '#C9A66B' },
  bakery: { label: 'Bakeries', emoji: '🥐', color: '#D9B382' },
  other: { label: 'Other', emoji: '📍', color: '#6B7280' },
};

export const COUNTRY_META: Record<Country, { label: string; flag: string }> = {
  italy: { label: 'Italy', flag: '🇮🇹' },
  greece: { label: 'Greece', flag: '🇬🇷' },
  other: { label: 'Other', flag: '🌍' },
};
