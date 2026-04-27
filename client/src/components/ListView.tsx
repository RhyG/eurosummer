import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { CATEGORY_META, COUNTRY_META } from '@/lib/categories';
import { formatDistance, haversineKm } from '@/lib/distance';
import { isOpenNow } from '@/lib/openingHours';
import type { Place } from '@/types';
import type { UserLocation } from '@/lib/userLocation';

type Props = {
  places: Place[];
  userLocation: UserLocation;
  onPick: (place: Place) => void;
};

export function ListView({ places, userLocation, onPick }: Props) {
  const sorted = useMemo(() => {
    const arr = places.slice();
    if (userLocation) {
      arr.sort((a, b) => {
        const da = haversineKm(userLocation, a);
        const db = haversineKm(userLocation, b);
        return da - db;
      });
    } else {
      arr.sort((a, b) => b.createdAt - a.createdAt);
    }
    return arr;
  }, [places, userLocation]);

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink/50">
        No places match your filters.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      <ul className="mx-auto w-full max-w-2xl space-y-1.5 p-3">
        {sorted.map((p) => {
          const meta = CATEGORY_META[p.category];
          const country = COUNTRY_META[p.country];
          const open = isOpenNow(p.openingPeriods);
          const distKm = userLocation ? haversineKm(userLocation, p) : null;
          return (
            <li key={p.id}>
              <button
                onClick={() => onPick(p)}
                className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-ink/5"
              >
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: meta.color, color: '#F7F1E5' }}
                >
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.visited && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink/60">
                    {p.address}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/60">
                    <span>{country.flag}</span>
                    {distKm != null && <span>{formatDistance(distKm)}</span>}
                    {open === true && (
                      <span className="font-medium text-emerald-700">
                        Open now
                      </span>
                    )}
                    {open === false && (
                      <span className="font-medium text-red-600">Closed</span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
