import { clearToken, getToken } from './auth';
import type { Place, PlaceDetails, PlaceInfo, Prediction } from '@/types';

class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  async login(password: string): Promise<string> {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('invalid_password');
    const data = (await res.json()) as { token: string };
    return data.token;
  },

  listPlaces(): Promise<{ places: Place[] }> {
    return request('/api/places');
  },

  createPlace(
    draft: Omit<Place, 'id' | 'createdAt'>,
  ): Promise<{ place: Place }> {
    return request('/api/places', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  },

  updatePlace(
    id: string,
    patch: Partial<Place>,
  ): Promise<{ place: Place }> {
    return request(`/api/places/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  deletePlace(id: string): Promise<void> {
    return request(`/api/places/${id}`, { method: 'DELETE' });
  },

  search(q: string): Promise<{ predictions: Prediction[] }> {
    return request(`/api/search?q=${encodeURIComponent(q)}`);
  },

  details(placeId: string): Promise<PlaceDetails> {
    return request(`/api/search/details/${encodeURIComponent(placeId)}`);
  },

  info(placeId: string): Promise<PlaceInfo> {
    return request(`/api/search/info/${encodeURIComponent(placeId)}`);
  },

  exportUrl(): string {
    return '/api/places/export';
  },
};

export { UnauthorizedError };
