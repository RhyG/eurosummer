import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { CategoryPicker } from './CategoryPicker';
import type { Category, Place } from '@/types';

type Props = {
  place: Place | null;
  categories: Category[];
  onClose: () => void;
  onAddCategory: (category: Category) => Promise<Category[]> | void;
  onSave: (patch: Partial<Place>) => Promise<void> | void;
};

export function EditDialog({
  place,
  categories,
  onClose,
  onAddCategory,
  onSave,
}: Props) {
  const [name, setName] = useState(place?.name ?? '');
  const [category, setCategory] = useState<Category>(
    place?.category ?? 'Other',
  );
  const [notes, setNotes] = useState(place?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!place) return;
    setName(place.name);
    setCategory(place.category);
    setNotes(place.notes ?? '');
  }, [place]);

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
            <CategoryPicker
              categories={categories}
              value={category}
              onChange={setCategory}
              onAddCategory={onAddCategory}
            />
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
