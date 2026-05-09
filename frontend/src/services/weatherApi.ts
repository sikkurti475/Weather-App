import { CurrentWeather, ForecastDay } from '../utils/types';

const BASE_URL = '/api/weather';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`);
  }
  return data as T;
}

export function getCurrentWeather(location: string): Promise<CurrentWeather> {
  return apiFetch<CurrentWeather>(`${BASE_URL}/current?location=${encodeURIComponent(location)}`);
}

export function getForecast(location: string): Promise<ForecastDay[]> {
  return apiFetch<ForecastDay[]>(`${BASE_URL}/forecast?location=${encodeURIComponent(location)}`);
}

export interface GeoSuggestion {
  name: string;
  state?: string;
  country: string;
}

export async function getSuggestions(q: string): Promise<GeoSuggestion[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${BASE_URL}/suggestions?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}
