import { CurrentWeather, ForecastDay } from '../utils/types';

const BASE = '/api/weather';

export interface WeatherPayload {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherPayload> {
  const res = await fetch(`${BASE}?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to fetch weather');
  return data;
}

export async function fetchWeatherByLocation(location: string): Promise<WeatherPayload> {
  const res = await fetch(`${BASE}?location=${encodeURIComponent(location)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to fetch weather');
  return data;
}

export async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`${BASE}/suggestions?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}
