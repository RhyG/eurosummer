import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { MapPinned } from 'lucide-react';
import type { Place } from '@/types';

export type SavedLocation = {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  count: number;
};

type Props = {
  places: Place[];
  onJump: (location: SavedLocation) => void;
};

function locationName(place: Place): string | null {
  if (place.locality?.trim()) return place.locality.trim();
  const parts = place.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const candidate = parts[parts.length - 2] ?? parts[0] ?? '';
  const name = candidate
    .replace(/\b[A-Z]{2,3}\b/g, '')
    .replace(/\b\d{3,6}\b/g, '')
    .trim();
  return name || null;
}

function savedLocations(places: Place[]): SavedLocation[] {
  const groups = new Map<string, Place[]>();
  for (const place of places) {
    const name = locationName(place);
    if (!name) continue;
    const key = name.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), place]);
  }
  return Array.from(groups.values())
    .map((group) => {
      const first = group[0]!;
      const name = locationName(first)!;
      const lat =
        group.reduce((sum, place) => sum + place.lat, 0) / group.length;
      const lng =
        group.reduce((sum, place) => sum + place.lng, 0) / group.length;
      return {
        name,
        lat,
        lng,
        zoom: group.length > 1 ? 12 : 14,
        count: group.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function LocationJump({ places, onJump }: Props) {
  const locations = savedLocations(places);
  const disabled = locations.length === 0;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          aria-label="Jump to saved location"
          disabled={disabled}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 shadow-sm hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-50"
        >
          <MapPinned className="h-5 w-5" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[190px] rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
        >
          {locations.map((location) => (
            <Dropdown.Item
              key={location.name}
              onSelect={() => onJump(location)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5"
            >
              <span className="min-w-0 flex-1 truncate">{location.name}</span>
              <span className="text-xs text-ink/45">{location.count}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
