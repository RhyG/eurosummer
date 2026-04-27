import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { MapPin } from 'lucide-react';
import { CITIES, type City } from '@/lib/cities';
import { COUNTRY_META } from '@/lib/categories';

type Props = {
  onJump: (city: City) => void;
};

export function CityJump({ onJump }: Props) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          aria-label="Jump to city"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink/80 shadow-sm hover:bg-ink/5"
        >
          <MapPin className="h-5 w-5" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
        >
          {CITIES.map((city) => {
            const flag = COUNTRY_META[city.country].flag;
            return (
              <Dropdown.Item
                key={city.name}
                onSelect={() => onJump(city)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5"
              >
                <span>{flag}</span>
                {city.name}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
