import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Check, Clock, LogOut, Pencil, SlidersHorizontal } from 'lucide-react';
import { getCategoryMeta } from '@/lib/categories';
import { clearToken } from '@/lib/auth';
import type { Category, CategoryDefinition, Place } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  active: Set<Category>;
  toggle: (c: Category) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  categories: CategoryDefinition[];
  places: Place[];
  onEditCategories: () => void;
  onLogout: () => void;
};

export function FiltersMenu({
  active,
  toggle,
  openNowOnly,
  onToggleOpenNow,
  categories,
  places,
  onEditCategories,
  onLogout,
}: Props) {
  const counts = new Map<Category, number>();
  for (const p of places)
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const anyActive = openNowOnly || active.size > 0;

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          aria-label="Filters"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/80 shadow-sm hover:bg-ink/5"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {anyActive && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-terracotta ring-2 ring-white" />
          )}
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[min(92vw,28rem)] rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
        >
          <Dropdown.Item
            onSelect={(e) => {
              e.preventDefault();
              onToggleOpenNow();
            }}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5',
              openNowOnly && 'bg-emerald-50 text-emerald-800',
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="flex-1">Open now</span>
            {openNowOnly && <Check className="h-4 w-4" />}
          </Dropdown.Item>

          <div className="my-1 h-px bg-ink/10" />

          <div className="flex max-h-44 flex-row flex-wrap gap-1.5 overflow-y-auto p-1">
            {categories.map((c) => {
              const meta = getCategoryMeta(c.name, categories);
              const on = active.has(c.name);
              const n = counts.get(c.name) ?? 0;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggle(c.name)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-sm outline-none transition hover:bg-ink/5',
                    on
                      ? 'border-transparent font-medium'
                      : 'border-ink/10 text-ink/75',
                  )}
                  style={
                    on
                      ? {
                          backgroundColor: `${meta.color}1a`,
                          color: meta.color,
                        }
                      : undefined
                  }
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="text-xs opacity-60">{n}</span>
                  {on && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="my-1 h-px bg-ink/10" />

          <Dropdown.Item
            onSelect={(e) => {
              e.preventDefault();
              onEditCategories();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5"
          >
            <Pencil className="h-4 w-4" />
            Edit categories
          </Dropdown.Item>

          <div className="my-1 h-px bg-ink/10" />

          <Dropdown.Item
            onSelect={logout}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none data-[highlighted]:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
