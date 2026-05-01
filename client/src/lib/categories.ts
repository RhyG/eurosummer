import type { Category } from "@/types";

export const DEFAULT_CATEGORIES: readonly Category[] = [
  "American",
  "Japanese",
  "Italian",
  "Mexican",
  "Thai",
  "Vietnamese",
  "Burgers",
  "Indian",
  "Bakery",
  "Cafe",
  "Bar",
  "Other",
];

type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
};

const KNOWN_CATEGORY_META: Record<string, CategoryMeta> = {
  American: { label: "American", emoji: "🍔", color: "#A84C3D" },
  Japanese: { label: "Japanese", emoji: "🍣", color: "#3C6E71" },
  Italian: { label: "Italian", emoji: "🍝", color: "#C65D3A" },
  Mexican: { label: "Mexican", emoji: "🌮", color: "#D1902F" },
  Thai: { label: "Thai", emoji: "🌶️", color: "#B94E5E" },
  Vietnamese: { label: "Vietnamese", emoji: "🍜", color: "#4F7A45" },
  Burgers: { label: "Burgers", emoji: "🍔", color: "#8B5E34" },
  Indian: { label: "Indian", emoji: "🍛", color: "#C77728" },
  Bakery: { label: "Bakery", emoji: "🥐", color: "#D9B382" },
  Cafe: { label: "Cafe", emoji: "☕", color: "#fffc5c" },
  Bar: { label: "Bar", emoji: "🍷", color: "#6B7C3A" },
  Other: { label: "Other", emoji: "📍", color: "#6B7280" },
};

const FALLBACK_COLORS = [
  "#6B7280",
  "#4F7A45",
  "#3C6E71",
  "#8B5E34",
  "#A84C3D",
  "#B94E5E",
  "#C77728",
  "#6B7C3A",
];

export function normalizeCategoryName(value: string): Category {
  return value.trim().replace(/\s+/g, " ");
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function colorForCategory(category: Category): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]!;
}

export function getCategoryMeta(category: Category): CategoryMeta {
  return (
    KNOWN_CATEGORY_META[category] ?? {
      label: titleCase(category),
      emoji: "📍",
      color: colorForCategory(category),
    }
  );
}
