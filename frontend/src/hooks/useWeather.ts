import { useState } from 'react';
import useSWR from 'swr';
import { fetchWeatherByCoords, fetchWeatherByLocation, WeatherPayload } from '../services/weatherApi';

type Key = { type: 'coords'; lat: number; lon: number } | { type: 'location'; q: string };

function fetcher(key: Key): Promise<WeatherPayload> {
  return key.type === 'coords'
    ? fetchWeatherByCoords(key.lat, key.lon)
    : fetchWeatherByLocation(key.q);
}

export function useWeather() {
  const [key, setKey] = useState<Key | null>(null);
  const [searchedLabel, setSearchedLabel] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    searchedLabel,
    searchByCoords: (lat: number, lon: number, label = '') => { setSearchedLabel(label || null); setKey({ type: 'coords', lat, lon }); },
    searchByLocation: (q: string) => { setSearchedLabel(q); setKey({ type: 'location', q }); },
  };
}
