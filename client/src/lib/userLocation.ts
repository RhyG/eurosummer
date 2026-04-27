import { useEffect, useState } from 'react';

export type UserLocation = { lat: number; lng: number } | null;

export function useUserLocation(): UserLocation {
  const [loc, setLoc] = useState<UserLocation>(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return loc;
}
