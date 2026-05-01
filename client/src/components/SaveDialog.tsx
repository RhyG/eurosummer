import { useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  MapPinned,
  Phone,
  Star,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Input';
import { CategoryPicker } from './CategoryPicker';
import { getCategoryMeta } from '@/lib/categories';
import { appleMapsUrl } from '@/lib/appleMaps';
import { api, UnauthorizedError } from '@/lib/api';
import type {
  Category,
  CategoryDefinition,
  PlaceDetails,
  PlaceInfo,
} from '@/types';

type Props = {
  details: PlaceDetails | null;
  onClose: () => void;
  categories: CategoryDefinition[];
  onAddCategory: (category: Category) => Promise<CategoryDefinition[]> | void;
  onSave: (data: {
    category: Category;
    notes: string;
  }) => Promise<void> | void;
};

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

function todayWeekdayIndex(): number {
  // Google's weekdayDescriptions starts Monday=0; JS Sunday=0.
  const d = new Date().getDay();
  return (d + 6) % 7;
}

export function SaveDialog({
  details,
  onClose,
  categories,
  onAddCategory,
  onSave,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState<Category>(
    details?.suggestedCategory ?? 'Other',
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<PlaceInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  // Reset form when a new place is selected.
  useEffect(() => {
    if (details) {
      setCategory(details.suggestedCategory);
      setNotes('');
    }
  }, [details]);

  useEffect(() => {
    setInfo(null);
    setInfoLoading(false);
    setHoursOpen(false);
    if (!details?.googlePlaceId) return;
    let cancelled = false;
    setInfoLoading(true);
    api
      .info(details.googlePlaceId)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) return;
        // The save flow still works if enriched place info is unavailable.
      })
      .finally(() => {
        if (!cancelled) setInfoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [details?.googlePlaceId]);

  useEffect(() => {
    if (!details) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (
        target instanceof Node &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true);
  }, [details, onClose]);

  if (!details) return null;
  const selectedMeta = getCategoryMeta(category, categories);
  const priceLabel = info?.priceLevel ? PRICE_LABELS[info.priceLevel] : null;
  const todayIdx = todayWeekdayIndex();
  const todayHours = info?.weekdayDescriptions?.[todayIdx] ?? null;
  const photoNames = info?.photoNames ?? details.photoNames ?? [];

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
          ref={contentRef}
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[50vh] flex-col rounded-t-2xl bg-cream pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none"
        >
          <Drawer.Title className="sr-only">Save {details.name}</Drawer.Title>
          <div className="mx-auto mt-2 mb-2 h-1.5 w-10 rounded-full bg-ink/15" />
          <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-2">
            {photoNames.length > 0 && (
              <div className="no-scrollbar -mx-5 mb-4 flex gap-1 overflow-x-auto px-5">
                {photoNames.slice(0, 5).map((name) => (
                  <img
                    key={name}
                    src={api.photoUrl(name, 800)}
                    alt=""
                    loading="lazy"
                    className="h-44 w-auto shrink-0 rounded-xl bg-ink/5 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-cream"
                style={{ backgroundColor: selectedMeta.color }}
              >
                <span>{selectedMeta.emoji}</span>
                {selectedMeta.label}
              </span>
              {details.locality && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs">
                  {details.locality}
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold leading-tight">
              {details.name}
            </h2>
            <p className="mt-1 text-sm text-ink/60">{details.address}</p>

            {(infoLoading || info) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {infoLoading && !info && (
                  <span className="text-ink/40">Loading details…</span>
                )}
                {info?.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span className="font-medium">
                      {info.rating.toFixed(1)}
                    </span>
                    {info.userRatingCount != null && (
                      <span className="text-ink/50">
                        ({info.userRatingCount.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
                {priceLabel && (
                  <span className="text-ink/70">{priceLabel}</span>
                )}
                {info?.openNow === true && (
                  <span className="font-medium text-emerald-700">
                    Open now
                  </span>
                )}
                {info?.openNow === false && (
                  <span className="font-medium text-red-600">Closed</span>
                )}
                {info?.businessStatus === 'CLOSED_PERMANENTLY' && (
                  <span className="font-medium text-red-600">
                    Permanently closed
                  </span>
                )}
              </div>
            )}

            {info?.weekdayDescriptions && info.weekdayDescriptions.length > 0 && (
              <div className="mt-2 text-sm">
                <button
                  onClick={() => setHoursOpen((v) => !v)}
                  className="flex items-center gap-1 text-ink/70 hover:text-ink"
                >
                  <span>{todayHours ?? 'Hours'}</span>
                  {hoursOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {hoursOpen && (
                  <ul className="mt-2 space-y-0.5 rounded-xl bg-white p-3 text-xs text-ink/80">
                    {info.weekdayDescriptions.map((line, i) => (
                      <li
                        key={i}
                        className={i === todayIdx ? 'font-semibold' : ''}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={appleMapsUrl({
                  name: details.name,
                  lat: details.lat,
                  lng: details.lng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink/80 hover:bg-ink/5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Apple Maps
              </a>
              {info?.phone && (
                <a
                  href={`tel:${info.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink/80 hover:bg-ink/5"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {info.phone}
                </a>
              )}
              {info?.website && (
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink/80 hover:bg-ink/5"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {info?.googleMapsUri && (
                <a
                  href={info.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink/80 hover:bg-ink/5"
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  Google Maps
                </a>
              )}
            </div>

            <div className="mt-5 space-y-4">
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
