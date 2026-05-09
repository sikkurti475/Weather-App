import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config/env';
import { OWMCurrentResponse, OWMForecastResponse } from '../utils/types';

const client: AxiosInstance = axios.create({
  baseURL: config.openWeatherBaseUrl,
  timeout: 8000,
  params: { appid: config.openWeatherApiKey, units: 'imperial' },
});

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status ?? 500;
    const message = axiosErr.response?.data?.message ?? axiosErr.message;
    const err = new Error(message) as Error & { status: number };
    err.status = status;
    throw err;
  }
  throw error;
}

export async function fetchCurrentWeather(location: string): Promise<OWMCurrentResponse> {
  try {
    const { data } = await client.get<OWMCurrentResponse>('/data/3.0/weather', {
      params: { q: location },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function fetchForecast(location: string): Promise<OWMForecastResponse> {
  try {
    const { data } = await client.get<OWMForecastResponse>('/data/3.0/forecast', {
      params: { q: location, cnt: 40 },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
