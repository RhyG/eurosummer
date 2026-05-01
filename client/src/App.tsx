import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, MapIcon } from 'lucide-react';
import { Map, type MapHandle } from './components/Map';
import { ListView } from './components/ListView';
import { SearchBar } from './components/SearchBar';
import { FiltersMenu } from './components/FiltersMenu';
import { LocationJump } from './components/LocationJump';
import { PasswordGate } from './components/PasswordGate';
import { SaveDialog } from './components/SaveDialog';
import { PlaceSheet } from './components/PlaceSheet';
import { EditDialog } from './components/EditDialog';
import { CategoryManagerSheet } from './components/CategoryManagerSheet';
import {
  DEFAULT_CATEGORY_DEFINITIONS,
  normalizeCategoryName,
} from './lib/categories';
import { getToken } from './lib/auth';
import { api, UnauthorizedError } from './lib/api';
import { isOpenNow } from './lib/openingHours';
import { useUserLocation } from './lib/userLocation';
import type {
  Category,
  CategoryDefinition,
  Place,
  PlaceDetails,
  Prediction,
} from './types';

const SHEET_PADDING = 360;
type ViewMode = 'map' | 'list';

export function App() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));
  const [maptilerKey, setMaptilerKey] = useState<string | null | undefined>(
    undefined,
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>(
    DEFAULT_CATEGORY_DEFINITIONS.slice(),
  );
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [pendingDetails, setPendingDetails] = useState<PlaceDetails | null>(
    null,
  );
  const [selected, setSelected] = useState<Place | null>(null);
  const [editing, setEditing] = useState<Place | null>(null);
  const [editingCategories, setEditingCategories] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const mapRef = useRef<MapHandle | null>(null);
  const userLocation = useUserLocation();

  const refresh = useCallback(async () => {
    try {
      const [{ places }, { categories }] = await Promise.all([
        api.listPlaces(),
        api.listCategories(),
      ]);
      setPlaces(places);
      setCategories(categories);
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
    }
  }, []);

  useEffect(() => {
    if (authed) refresh();
  }, [authed, refresh]);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    api
      .config()
      .then(({ maptilerKey }) => {
        if (!cancelled) setMaptilerKey(maptilerKey);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) setAuthed(false);
        else if (!cancelled) setMaptilerKey(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // Auto-fit to saved places once on first load (if any).
  useEffect(() => {
    if (!hasFitBounds && places.length > 0 && mapRef.current) {
      mapRef.current.fitToPlaces(places);
      setHasFitBounds(true);
    }
  }, [places, hasFitBounds]);

  const visiblePlaces = useMemo(() => {
    return places.filter((p) => {
      if (activeCats.size > 0 && !activeCats.has(p.category)) return false;
      if (openNowOnly && isOpenNow(p.openingPeriods) === false) return false;
      return true;
    });
  }, [places, activeCats, openNowOnly]);

  const toggleCat = (c: Category) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  async function handleAddCategory(
    raw: Category,
  ): Promise<CategoryDefinition[]> {
    const category = normalizeCategoryName(raw);
    if (!category) return categories;
    const existing = categories.find(
      (c) => c.name.toLowerCase() === category.toLowerCase(),
    );
    if (existing) return categories;
    try {
      const { categories: next } = await api.addCategory(category);
      setCategories(next);
      return next;
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
      throw err;
    }
  }

  async function handleUpdateCategory(
    currentName: Category,
    category: CategoryDefinition,
  ) {
    try {
      const { categories: nextCategories, places: nextPlaces } =
        await api.updateCategory(currentName, category);
      setCategories(nextCategories);
      setPlaces(nextPlaces);
      setActiveCats((prev) => {
        const next = new Set<Category>();
        for (const active of prev) {
          next.add(active === currentName ? category.name : active);
        }
        return next;
      });
      if (selected?.category === currentName) {
        setSelected(nextPlaces.find((p) => p.id === selected.id) ?? null);
      }
      if (editing?.category === currentName) {
        setEditing(nextPlaces.find((p) => p.id === editing.id) ?? null);
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
      throw err;
    }
  }

  async function handleDeleteCategory(category: Category) {
    try {
      const { categories: nextCategories, places: nextPlaces } =
        await api.deleteCategory(category);
      setCategories(nextCategories);
      setPlaces(nextPlaces);
      setActiveCats((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
      if (selected?.category === category) {
        setSelected(nextPlaces.find((p) => p.id === selected.id) ?? null);
      }
      if (editing?.category === category) {
        setEditing(nextPlaces.find((p) => p.id === editing.id) ?? null);
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) setAuthed(false);
      throw err;
    }
  }

  async function handlePickPrediction(p: Prediction) {
    try {
      const details = await api.details(p.placeId);
      setPendingDetails(details);
      setViewMode('map');
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
      locality: pendingDetails.locality ?? undefined,
      googlePlaceId: pendingDetails.googlePlaceId,
      category,
      notes: notes || undefined,
      visited: false,
      openingPeriods: pendingDetails.openingPeriods ?? undefined,
      photoNames: pendingDetails.photoNames ?? undefined,
    };
    try {
      const { place } = await api.createPlace(draft);
      setPlaces((prev) => [...prev, place]);
      setCategories((prev) =>
        prev.some((c) => c.name.toLowerCase() === place.category.toLowerCase())
          ? prev
          : [
              ...prev,
              { name: place.category, emoji: '📍', color: '#6B7280' },
            ],
      );
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
      setCategories((prev) =>
        prev.some((c) => c.name.toLowerCase() === place.category.toLowerCase())
          ? prev
          : [
              ...prev,
              { name: place.category, emoji: '📍', color: '#6B7280' },
            ],
      );
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

  if (maptilerKey === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {viewMode === 'map' ? (
        <Map
          ref={mapRef}
          places={visiblePlaces}
          categories={categories}
          onPickPlace={setSelected}
          maptilerKey={maptilerKey}
          userLocation={userLocation}
          previewLocation={
            pendingDetails
              ? { lat: pendingDetails.lat, lng: pendingDetails.lng }
              : null
          }
        />
      ) : (
        <div className="absolute inset-0 bg-cream pt-[4.75rem]">
          <ListView
            places={visiblePlaces}
            categories={categories}
            userLocation={userLocation}
            onPick={setSelected}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              onPick={handlePickPrediction}
              onFocus={() => {
                setSelected(null);
                setPendingDetails(null);
                setEditing(null);
              }}
            />
          </div>
          <LocationJump
            places={places}
            onJump={(c) => {
              setViewMode('map');
              mapRef.current?.flyTo({
                lat: c.lat,
                lng: c.lng,
                zoom: c.zoom,
              });
            }}
          />
          <button
            onClick={() => setViewMode((v) => (v === 'map' ? 'list' : 'map'))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 shadow-sm hover:bg-ink/5"
            aria-label={viewMode === 'map' ? 'Switch to list' : 'Switch to map'}
          >
            {viewMode === 'map' ? (
              <List className="h-5 w-5" />
            ) : (
              <MapIcon className="h-5 w-5" />
            )}
          </button>
          <FiltersMenu
            active={activeCats}
            toggle={toggleCat}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly((v) => !v)}
            categories={categories}
            places={places}
            onEditCategories={() => setEditingCategories(true)}
            onLogout={() => setAuthed(false)}
          />
        </div>
      </div>

      <SaveDialog
        details={pendingDetails}
        onClose={() => setPendingDetails(null)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onSave={handleSaveNew}
      />

      <PlaceSheet
        place={selected}
        categories={categories}
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
        categories={categories}
        onAddCategory={handleAddCategory}
        onSave={handleEditSave}
      />

      <CategoryManagerSheet
        open={editingCategories}
        categories={categories}
        onClose={() => setEditingCategories(false)}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
}
