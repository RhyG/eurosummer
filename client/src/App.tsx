import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, type MapHandle } from './components/Map';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { CityJump } from './components/CityJump';
import { SettingsMenu } from './components/SettingsMenu';
import { PasswordGate } from './components/PasswordGate';
import { SaveDialog } from './components/SaveDialog';
import { PlaceSheet } from './components/PlaceSheet';
import { EditDialog } from './components/EditDialog';
import { CATEGORIES } from './lib/categories';
import { getToken } from './lib/auth';
import { api, UnauthorizedError } from './lib/api';
import type { Category, Place, PlaceDetails, Prediction } from './types';

const SHEET_PADDING = 360;

export function App() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeCats, setActiveCats] = useState<Set<Category>>(
    new Set(CATEGORIES),
  );
  const [pendingDetails, setPendingDetails] = useState<PlaceDetails | null>(
    null,
  );
  const [selected, setSelected] = useState<Place | null>(null);
  const [editing, setEditing] = useState<Place | null>(null);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const mapRef = useRef<MapHandle | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { places } = await api.listPlaces();
      setPlaces(places);
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }, []);

  useEffect(() => {
    if (authed) refresh();
  }, [authed, refresh]);

  // Auto-fit to saved places once on first load (if any).
  useEffect(() => {
    if (!hasFitBounds && places.length > 0 && mapRef.current) {
      mapRef.current.fitToPlaces(places);
      setHasFitBounds(true);
    }
  }, [places, hasFitBounds]);

  const visiblePlaces = useMemo(
    () => places.filter((p) => activeCats.has(p.category)),
    [places, activeCats],
  );

  const toggleCat = (c: Category) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      if (next.size === 0) return new Set(CATEGORIES); // never leave empty
      return next;
    });
  };

  async function handlePickPrediction(p: Prediction) {
    try {
      const details = await api.details(p.placeId);
      setPendingDetails(details);
      mapRef.current?.flyTo({
        lat: details.lat,
        lng: details.lng,
        zoom: 15,
        bottomPadding: SHEET_PADDING,
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }

  async function handleSaveNew({
    category,
    notes,
  }: {
    category: Category;
    notes: string;
  }) {
    if (!pendingDetails) return;
    const draft = {
      name: pendingDetails.name,
      address: pendingDetails.address,
      lat: pendingDetails.lat,
      lng: pendingDetails.lng,
      country: pendingDetails.country,
      googlePlaceId: pendingDetails.googlePlaceId,
      category,
      notes: notes || undefined,
      visited: false,
    };
    try {
      const { place } = await api.createPlace(draft);
      setPlaces((prev) => [...prev, place]);
      mapRef.current?.flyTo({ lat: place.lat, lng: place.lng, zoom: 14 });
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }

  async function handleEditSave(patch: Partial<Place>) {
    if (!editing) return;
    try {
      const { place } = await api.updatePlace(editing.id, patch);
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? place : p)));
      setSelected(place);
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deletePlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }

  async function handleToggleVisited(p: Place) {
    try {
      const { place } = await api.updatePlace(p.id, { visited: !p.visited });
      setPlaces((prev) => prev.map((x) => (x.id === place.id ? place : x)));
      setSelected(place);
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        places={visiblePlaces}
        onPickPlace={setSelected}
        previewLocation={
          pendingDetails
            ? { lat: pendingDetails.lat, lng: pendingDetails.lng }
            : null
        }
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex-1">
            <SearchBar onPick={handlePickPrediction} />
          </div>
          <CityJump
            onJump={(c) =>
              mapRef.current?.flyTo({
                lat: c.lat,
                lng: c.lng,
                zoom: c.zoom,
              })
            }
          />
          <SettingsMenu onLogout={() => setAuthed(false)} />
        </div>
        <div className="pointer-events-auto">
          <CategoryFilter
            active={activeCats}
            toggle={toggleCat}
            places={places}
          />
        </div>
      </div>

      <SaveDialog
        details={pendingDetails}
        onClose={() => setPendingDetails(null)}
        onSave={handleSaveNew}
      />

      <PlaceSheet
        place={selected}
        onClose={() => setSelected(null)}
        onEdit={(p) => {
          setSelected(null);
          setEditing(p);
        }}
        onDelete={handleDelete}
        onToggleVisited={handleToggleVisited}
      />

      <EditDialog
        place={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
