import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Button } from './ui/Button';
import { Textarea } from './ui/Input';
import { CATEGORIES, CATEGORY_META } from '@/lib/categories';
import type { Category, PlaceDetails } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  details: PlaceDetails | null;
  onClose: () => void;
  onSave: (data: {
    category: Category;
    notes: string;
  }) => Promise<void> | void;
};

export function SaveDialog({ details, onClose, onSave }: Props) {
  const [category, setCategory] = useState<Category>(
    details?.suggestedCategory ?? 'restaurant',
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when a new place is selected.
  useEffect(() => {
    if (details) {
      setCategory(details.suggestedCategory);
      setNotes('');
    }
  }, [details]);

  if (!details) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ category, notes });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer.Root open onOpenChange={(o) => !o && onClose()} modal={false}>
      <Drawer.Portal>
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[70vh] flex-col rounded-t-2xl bg-cream pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none"
        >
          <Drawer.Title className="sr-only">Save {details.name}</Drawer.Title>
          <div className="mx-auto mt-2 mb-2 h-1.5 w-10 rounded-full bg-ink/15" />
          <div className="overflow-y-auto px-5 pb-5 pt-2">
            <h2 className="text-xl font-semibold leading-tight">
              {details.name}
            </h2>
            <p className="mt-1 text-sm text-ink/60">{details.address}</p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const meta = CATEGORY_META[c];
                    const on = c === category;
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition',
                          on
                            ? 'text-cream border-transparent'
                            : 'bg-cream text-ink/70 border-ink/15 hover:bg-ink/5',
                        )}
                        style={on ? { backgroundColor: meta.color } : undefined}
                      >
                        <span>{meta.emoji}</span>
                        {meta.label.replace(/s$/, '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why this place? Recommended dishes? Source?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
