import { useState } from 'react';
import useSWR from 'swr';
import { getCurrentWeather, getForecast } from '../services/weatherApi';
import { CurrentWeather, ForecastDay } from '../utils/types';

async function fetchWeather(location: string): Promise<{ current: CurrentWeather; forecast: ForecastDay[] }> {
  const [current, forecast] = await Promise.all([
    getCurrentWeather(location),
    getForecast(location),
  ]);
  return { current, forecast };
}

export function useWeather() {
  const [location, setLocation] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR(
    location,
    fetchWeather,
    { revalidateOnFocus: true, dedupingInterval: 60_000 }
  );

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Something went wrong' : null,
    search: setLocation,
  };
}
