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
    const err = error as AxiosError<{ message?: string }>;
    const status = err.response?.status ?? 500;
    const message = err.response?.data?.message ?? err.message;
    const e = new Error(message) as Error & { status: number };
    e.status = status;
    throw e;
  }
  throw error;
}

export interface GeoResult {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

/** Geocode a text query to coordinates */
export async function geocode(q: string): Promise<GeoResult[]> {
  try {
    const { data } = await client.get<GeoResult[]>('/geo/1.0/direct', {
      params: { q, limit: 5 },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

/** Fetch current weather by coordinates */
export async function fetchCurrentByCoords(lat: number, lon: number): Promise<OWMCurrentResponse> {
  try {
    const { data } = await client.get<OWMCurrentResponse>('/data/2.5/weather', {
      params: { lat, lon },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

/** Fetch 5-day forecast by coordinates */
export async function fetchForecastByCoords(lat: number, lon: number): Promise<OWMForecastResponse> {
  try {
    const { data } = await client.get<OWMForecastResponse>('/data/2.5/forecast', {
      params: { lat, lon, cnt: 40 },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
