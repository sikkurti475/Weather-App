import { useState, useCallback } from 'react';
import { getCurrentWeather, getForecast } from '../services/weatherApi';
import { WeatherState } from '../utils/types';

const initialState: WeatherState = {
  current: null,
  forecast: [],
  loading: false,
  error: null,
};

export function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);

  const search = useCallback(async (location: string) => {
    setState({ current: null, forecast: [], loading: true, error: null });
    try {
      const [current, forecast] = await Promise.all([
        getCurrentWeather(location),
        getForecast(location),
      ]);
      setState({ current, forecast, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState({ current: null, forecast: [], loading: false, error: message });
    }
  }, []);

  return { ...state, search };
}
