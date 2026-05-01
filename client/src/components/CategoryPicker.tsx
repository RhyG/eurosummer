import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  getCategoryMeta,
  normalizeCategoryName,
} from '@/lib/categories';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

type Props = {
  categories: Category[];
  value: Category;
  onChange: (category: Category) => void;
  onAddCategory: (category: Category) => Promise<Category[]> | void;
};

export function CategoryPicker({
  categories,
  value,
  onChange,
  onAddCategory,
}: Props) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  async function addCategory() {
    const normalized = normalizeCategoryName(draft);
    const category =
      categories.find((c) => c.toLowerCase() === normalized.toLowerCase()) ??
      normalized;
    if (!category) return;
    setAdding(true);
    try {
      await onAddCategory(category);
      onChange(category);
      setDraft('');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const meta = getCategoryMeta(c);
          const on = c === value;
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition',
                on
                  ? 'text-cream border-transparent'
                  : 'bg-cream text-ink/70 border-ink/15 hover:bg-ink/5',
              )}
              style={on ? { backgroundColor: meta.color } : undefined}
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void addCategory();
            }
          }}
          placeholder="Add category"
          className="h-10 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addCategory}
          disabled={adding || !normalizeCategoryName(draft)}
          className="h-10 px-3"
          aria-label="Add category"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
