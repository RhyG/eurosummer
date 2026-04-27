import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { CATEGORIES, CATEGORY_META } from '@/lib/categories';
import type { Category, Place } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  place: Place | null;
  onClose: () => void;
  onSave: (patch: Partial<Place>) => Promise<void> | void;
};

export function EditDialog({ place, onClose, onSave }: Props) {
  const [name, setName] = useState(place?.name ?? '');
  const [category, setCategory] = useState<Category>(
    place?.category ?? 'restaurant',
  );
  const [notes, setNotes] = useState(place?.notes ?? '');
  const [saving, setSaving] = useState(false);

  if (!place) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ name: name.trim() || place!.name, category, notes });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Edit place</DialogTitle>
        <DialogDescription>{place.address}</DialogDescription>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label className="mb-2 block text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
