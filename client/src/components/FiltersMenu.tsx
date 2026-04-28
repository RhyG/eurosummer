import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Check, Clock, LogOut, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, CATEGORY_META } from '@/lib/categories';
import { clearToken } from '@/lib/auth';
import type { Category, Place } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  active: Set<Category>;
  toggle: (c: Category) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  places: Place[];
  onLogout: () => void;
};

export function FiltersMenu({
  active,
  toggle,
  openNowOnly,
  onToggleOpenNow,
  places,
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
          className="z-50 min-w-[220px] rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
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

          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const on = active.has(c);
            const n = counts.get(c) ?? 0;
            return (
              <Dropdown.Item
                key={c}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle(c);
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5',
                  on && 'font-medium',
                )}
                style={on ? { backgroundColor: `${meta.color}1a` } : undefined}
              >
                <span>{meta.emoji}</span>
                <span className="flex-1">{meta.label}</span>
                <span className="text-xs opacity-60">{n}</span>
                {on && (
                  <Check
                    className="h-4 w-4"
                    style={{ color: meta.color }}
                  />
                )}
              </Dropdown.Item>
            );
          })}

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
