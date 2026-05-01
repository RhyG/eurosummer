import { Drawer } from 'vaul';
import { useEffect, useState } from 'react';
import { getCategoryMeta } from '@/lib/categories';
import { appleMapsUrl } from '@/lib/appleMaps';
import { api, UnauthorizedError } from '@/lib/api';
import { Button } from './ui/Button';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  MapPinned,
  Pencil,
  Phone,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import type { CategoryDefinition, Place, PlaceInfo } from '@/types';

type Props = {
  place: Place | null;
  categories: CategoryDefinition[];
  onClose: () => void;
  onEdit: (p: Place) => void;
  onDelete: (id: string) => Promise<void> | void;
  onToggleVisited: (p: Place) => Promise<void> | void;
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

export function PlaceSheet({
  place,
  categories,
  onClose,
  onEdit,
  onDelete,
  onToggleVisited,
}: Props) {
  const [confirm, setConfirm] = useState(false);
  const [info, setInfo] = useState<PlaceInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    setInfo(null);
    setInfoLoading(false);
    setHoursOpen(false);
    setConfirm(false);
    if (!place?.googlePlaceId) return;
    let cancelled = false;
    setInfoLoading(true);
    api
      .info(place.googlePlaceId)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) return;
        // Silent failure — sheet still works without enriched info.
      })
      .finally(() => {
        if (!cancelled) setInfoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [place?.id, place?.googlePlaceId]);

  if (!place) return null;
  const meta = getCategoryMeta(place.category, categories);
  const priceLabel = info?.priceLevel ? PRICE_LABELS[info.priceLevel] : null;
  const todayIdx = todayWeekdayIndex();
  const todayHours = info?.weekdayDescriptions?.[todayIdx] ?? null;

  return (
    <Drawer.Root open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-2xl bg-cream pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none">
          <Drawer.Title className="sr-only">{place.name}</Drawer.Title>
          <div className="mx-auto mt-2 mb-2 h-1.5 w-10 rounded-full bg-ink/15" />
          <div className="overflow-y-auto px-5 pb-5 pt-2">
            {(info?.photoNames?.length ?? 0) > 0 && (
              <div className="no-scrollbar -mx-5 mb-4 flex gap-1 overflow-x-auto px-5">
                {info!.photoNames!.slice(0, 5).map((name) => (
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
                style={{ backgroundColor: meta.color }}
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </span>
              {place.locality && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs">
                  {place.locality}
                </span>
              )}
              {place.visited && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
                  <Check className="h-3 w-3" /> visited
                </span>
              )}
            </div>

            <h2 className="text-2xl font-semibold leading-tight">
              {place.name}
            </h2>
            <p className="mt-1 text-sm text-ink/60">{place.address}</p>

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

            {place.notes && (
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">
                {place.notes}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={appleMapsUrl({
                  name: place.name,
                  lat: place.lat,
                  lng: place.lng,
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

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                onClick={() => onToggleVisited(place)}
              >
                {place.visited ? (
                  <>
                    <RotateCcw className="h-4 w-4" /> Unvisit
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Visited
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => onEdit(place)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              {confirm ? (
                <Button
                  variant="danger"
                  onClick={async () => {
                    await onDelete(place.id);
                    setConfirm(false);
                  }}
                >
                  Confirm
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
