export function appleMapsUrl(opts: {
  name: string;
  lat: number;
  lng: number;
}): string {
  const q = encodeURIComponent(opts.name);
  const ll = `${opts.lat},${opts.lng}`;
  return `https://maps.apple.com/?q=${q}&ll=${ll}`;
}
