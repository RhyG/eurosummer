import type { Category } from './types.js';

export const DEFAULT_CATEGORIES: readonly Category[] = [
  'American',
  'Japanese',
  'Italian',
  'Mexican',
  'Thai',
  'Vietnamese',
  'Burgers',
  'Indian',
  'Bakery',
  'Cafe',
  'Bar',
  'Other',
];

const LEGACY_CATEGORY_MAP = new Map<string, Category>([
  ['restaurant', 'Other'],
  ['bar', 'Bar'],
  ['cafe', 'Cafe'],
  ['bakery', 'Bakery'],
  ['other', 'Other'],
]);

export function normalizeCategoryName(value: string): Category {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return LEGACY_CATEGORY_MAP.get(trimmed.toLowerCase()) ?? trimmed;
}

export function mergeCategories(values: readonly unknown[]): Category[] {
  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const value of [...DEFAULT_CATEGORIES, ...values]) {
    if (typeof value !== 'string') continue;
    const category = normalizeCategoryName(value);
    if (!category || seen.has(category.toLowerCase())) continue;
    seen.add(category.toLowerCase());
    categories.push(category);
  }
  return categories;
}
