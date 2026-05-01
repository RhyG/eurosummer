import type { Category, CategoryDefinition } from '@/types';

export const DEFAULT_CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  { name: 'American', emoji: '🍔', color: '#A84C3D' },
  { name: 'Japanese', emoji: '🍣', color: '#3C6E71' },
  { name: 'Italian', emoji: '🍝', color: '#C65D3A' },
  { name: 'Mexican', emoji: '🌮', color: '#D1902F' },
  { name: 'Thai', emoji: '🌶️', color: '#B94E5E' },
  { name: 'Vietnamese', emoji: '🍜', color: '#4F7A45' },
  { name: 'Burgers', emoji: '🍔', color: '#8B5E34' },
  { name: 'Indian', emoji: '🍛', color: '#C77728' },
  { name: 'Bakery', emoji: '🥐', color: '#D9B382' },
  { name: 'Cafe', emoji: '☕', color: '#8C6A4A' },
  { name: 'Bar', emoji: '🍷', color: '#6B7C3A' },
  { name: 'Other', emoji: '📍', color: '#6B7280' },
];

export type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
};

const FALLBACK_COLORS = [
  '#6B7280',
  '#4F7A45',
  '#3C6E71',
  '#8B5E34',
  '#A84C3D',
  '#B94E5E',
  '#C77728',
  '#6B7C3A',
];

export function normalizeCategoryName(value: string): Category {
  return value.trim().replace(/\s+/g, ' ');
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function colorForCategory(category: Category): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]!;
}

export function getCategoryMeta(
  category: Category,
  categories: readonly CategoryDefinition[] = DEFAULT_CATEGORY_DEFINITIONS,
): CategoryMeta {
  const match = categories.find(
    (c) => c.name.toLowerCase() === category.toLowerCase(),
  );
  return match
    ? { label: match.name, emoji: match.emoji, color: match.color }
    : {
        label: titleCase(category),
        emoji: '📍',
        color: colorForCategory(category),
      };
}
