import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import maplibregl, {
  Map as MLMap,
  GeoJSONSource,
  LngLatBoundsLike,
} from 'maplibre-gl';
import { CATEGORY_META } from '@/lib/categories';
import { MEDITERRANEAN_VIEW } from '@/lib/cities';
import type { Place } from '@/types';

function styleUrl(key: string | null): string {
  return key
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
    : 'https://demotiles.maplibre.org/style.json';
}

export type MapHandle = {
  flyTo: (opts: {
    lat: number;
    lng: number;
    zoom?: number;
    bottomPadding?: number;
  }) => void;
  fitToPlaces: (places: Place[]) => void;
};

type Props = {
  places: Place[];
  onPickPlace: (place: Place) => void;
  previewLocation: { lat: number; lng: number } | null;
  maptilerKey: string | null;
};

export const Map = forwardRef<MapHandle, Props>(function Map(
  { places, onPickPlace, previewLocation, maptilerKey },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placesRef = useRef<Place[]>(places);
  const onPickRef = useRef(onPickPlace);
  placesRef.current = places;
  onPickRef.current = onPickPlace;

  useImperativeHandle(ref, () => ({
    flyTo({ lat, lng, zoom, bottomPadding }) {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: zoom ?? 13,
        speed: 1.4,
        padding: bottomPadding
          ? { top: 0, right: 0, bottom: bottomPadding, left: 0 }
          : { top: 0, right: 0, bottom: 0, left: 0 },
      });
    },
    fitToPlaces(ps) {
      if (ps.length === 0 || !mapRef.current) return;
      let minLng = Infinity,
        minLat = Infinity,
        maxLng = -Infinity,
        maxLat = -Infinity;
      for (const p of ps) {
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
      }
      const bounds: LngLatBoundsLike = [
        [minLng, minLat],
        [maxLng, maxLat],
      ];
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl(maptilerKey),
      center: [MEDITERRANEAN_VIEW.lng, MEDITERRANEAN_VIEW.lat],
      zoom: MEDITERRANEAN_VIEW.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({}), 'bottom-right');

    map.on('load', () => {
      map.addSource('places', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#C65D3A',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            5,
            22,
            20,
            28,
          ],
          'circle-stroke-color': '#F7F1E5',
          'circle-stroke-width': 3,
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#F7F1E5' },
      });

      map.addLayer({
        id: 'place-points',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 9,
          'circle-stroke-color': '#F7F1E5',
          'circle-stroke-width': 2.5,
          'circle-opacity': [
            'case',
            ['==', ['get', 'visited'], true],
            0.55,
            1,
          ],
        },
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const f = features[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id;
        const source = map.getSource('places') as GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = f.geometry as { type: 'Point'; coordinates: [number, number] };
          map.flyTo({ center: geom.coordinates, zoom });
        });
      });

      map.on('click', 'place-points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id as string | undefined;
        if (!id) return;
        const place = placesRef.current.find((p) => p.id === id);
        if (place) onPickRef.current(place);
      });

      const setCursor = (cursor: string) => () => {
        map.getCanvas().style.cursor = cursor;
      };
      map.on('mouseenter', 'place-points', setCursor('pointer'));
      map.on('mouseleave', 'place-points', setCursor(''));
      map.on('mouseenter', 'clusters', setCursor('pointer'));
      map.on('mouseleave', 'clusters', setCursor(''));

      // Push initial places.
      const data = placesToGeoJSON(placesRef.current);
      (map.getSource('places') as GeoJSONSource).setData(data);
    });

    // User location.
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      const userEl = document.createElement('div');
      userEl.className =
        'h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/30 shadow';
      const marker = new maplibregl.Marker({ element: userEl });
      userMarkerRef.current = marker;

      let centeredOnce = false;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          marker.setLngLat([longitude, latitude]).addTo(map);
          if (!centeredOnce) {
            centeredOnce = true;
            if (placesRef.current.length === 0) {
              map.flyTo({ center: [longitude, latitude], zoom: 13 });
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push places into the source whenever they change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('places') as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(placesToGeoJSON(places));
  }, [places]);

  // Show a temporary preview marker (e.g. for a place being added).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
    if (!previewLocation) return;
    const el = document.createElement('div');
    el.className = 'eatlist-preview-pin';
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([previewLocation.lng, previewLocation.lat])
      .addTo(map);
    previewMarkerRef.current = marker;
    return () => {
      marker.remove();
      if (previewMarkerRef.current === marker) previewMarkerRef.current = null;
    };
  }, [previewLocation]);

  return <div ref={containerRef} className="absolute inset-0" />;
});

function placesToGeoJSON(places: Place[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        color: CATEGORY_META[p.category].color,
        visited: p.visited,
      },
    })),
  };
}
