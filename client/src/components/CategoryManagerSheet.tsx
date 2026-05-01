import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Check, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { normalizeCategoryName } from '@/lib/categories';
import type { Category, CategoryDefinition } from '@/types';

type Props = {
  open: boolean;
  categories: CategoryDefinition[];
  onClose: () => void;
  onUpdate: (
    currentName: Category,
    category: CategoryDefinition,
  ) => Promise<void> | void;
  onDelete: (category: Category) => Promise<void> | void;
};

type RowProps = {
  category: CategoryDefinition;
  onUpdate: Props['onUpdate'];
  onDelete: Props['onDelete'];
};

function CategoryRow({ category, onUpdate, onDelete }: RowProps) {
  const protectedOther = category.name === 'Other';
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji);
  const [color, setColor] = useState(category.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(category.name);
    setEmoji(category.emoji);
    setColor(category.color);
  }, [category]);

  const nextName = protectedOther ? 'Other' : normalizeCategoryName(name);
  const canSave =
    Boolean(nextName) &&
    Boolean(emoji.trim()) &&
    /^#[0-9a-fA-F]{6}$/.test(color) &&
    (nextName !== category.name ||
      emoji.trim() !== category.emoji ||
      color.toUpperCase() !== category.color.toUpperCase());

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onUpdate(category.name, {
        name: nextName,
        emoji: emoji.trim(),
        color: color.toUpperCase(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (protectedOther) return;
    setDeleting(true);
    try {
      await onDelete(category.name);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 border-b border-ink/10 py-2 last:border-b-0 sm:grid-cols-[3.25rem_minmax(10rem,1fr)_3.5rem_auto_auto]">
      <Input
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        className="h-10 px-2 text-center text-lg"
        aria-label={`${category.name} emoji`}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={protectedOther}
        className="h-10 text-sm"
        aria-label={`${category.name} name`}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-10 w-full rounded-xl border border-ink/15 bg-cream p-1"
        aria-label={`${category.name} color`}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={save}
        disabled={!canSave || saving}
        className="col-start-2 h-10 px-3 sm:col-start-auto"
        aria-label={`Save ${category.name}`}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={remove}
        disabled={protectedOther || deleting}
        className="h-10 px-3 text-red-600 hover:bg-red-50"
        aria-label={`Delete ${category.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CategoryManagerSheet({
  open,
  categories,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[82vh] flex-col rounded-t-2xl bg-cream pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none">
          <Drawer.Title className="sr-only">Edit categories</Drawer.Title>
          <div className="mx-auto mt-2 mb-2 h-1.5 w-10 rounded-full bg-ink/15" />
          <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-col px-4 pb-4 pt-2 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Edit categories</h2>
              <Button variant="ghost" onClick={onClose}>
                Done
              </Button>
            </div>
            <div className="min-h-0 overflow-y-auto rounded-xl bg-white px-3">
              {categories.map((category) => (
                <CategoryRow
                  key={category.name}
                  category={category}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
