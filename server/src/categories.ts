import type { Category, CategoryDefinition } from './types.js';

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

const LEGACY_CATEGORY_MAP = new Map<string, Category>([
  ['restaurant', 'Other'],
  ['bar', 'Bar'],
  ['cafe', 'Cafe'],
  ['bakery', 'Bakery'],
  ['other', 'Other'],
]);

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
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return LEGACY_CATEGORY_MAP.get(trimmed.toLowerCase()) ?? trimmed;
}

export function normalizeHexColor(value: string): string {
  const color = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : '#6B7280';
}

function colorForCategory(category: Category): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]!;
}

function defaultDefinitionFor(name: Category): CategoryDefinition {
  const known = DEFAULT_CATEGORY_DEFINITIONS.find(
    (category) => category.name.toLowerCase() === name.toLowerCase(),
  );
  return known
    ? { ...known, name }
    : { name, emoji: '📍', color: colorForCategory(name) };
}

export function normalizeCategoryDefinition(
  value: unknown,
): CategoryDefinition | null {
  if (typeof value === 'string') {
    const name = normalizeCategoryName(value);
    return name ? defaultDefinitionFor(name) : null;
  }
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  if (typeof o.name !== 'string') return null;
  const name = normalizeCategoryName(o.name);
  if (!name) return null;
  return {
    name,
    emoji:
      typeof o.emoji === 'string' && o.emoji.trim()
        ? o.emoji.trim()
        : defaultDefinitionFor(name).emoji,
    color:
      typeof o.color === 'string'
        ? normalizeHexColor(o.color)
        : defaultDefinitionFor(name).color,
  };
}

export function mergeCategoryDefinitions(
  values: readonly unknown[],
  includeDefaults = false,
): CategoryDefinition[] {
  const categories = new Map<string, CategoryDefinition>();
  const source = includeDefaults
    ? [...DEFAULT_CATEGORY_DEFINITIONS, ...values]
    : values;
  for (const value of source) {
    const definition = normalizeCategoryDefinition(value);
    if (!definition) continue;
    categories.set(definition.name.toLowerCase(), definition);
  }
  if (!categories.has('other')) {
    const other = defaultDefinitionFor('Other');
    categories.set(other.name.toLowerCase(), other);
  }
  return Array.from(categories.values());
}
