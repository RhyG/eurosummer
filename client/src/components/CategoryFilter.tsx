import { CATEGORIES, CATEGORY_META } from '@/lib/categories';
import type { Category, Place } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  active: Set<Category>;
  toggle: (c: Category) => void;
  places: Place[];
};

export function CategoryFilter({ active, toggle, places }: Props) {
  const counts = new Map<Category, number>();
  for (const p of places) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map((c) => {
        const meta = CATEGORY_META[c];
        const on = active.has(c);
        const n = counts.get(c) ?? 0;
        return (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              on
                ? 'text-cream shadow-sm'
                : 'bg-white/90 text-ink/70 hover:bg-white',
            )}
            style={on ? { backgroundColor: meta.color } : undefined}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
            <span className={cn('text-xs', on ? 'opacity-80' : 'opacity-50')}>
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
