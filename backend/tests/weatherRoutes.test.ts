import request from 'supertest';
import { createApp } from '../src/app';

jest.mock('../src/services/weatherService');
jest.mock('../src/config/env', () => ({
  default: {
    port: 3001,
    openWeatherApiKey: 'test-key',
    openWeatherBaseUrl: 'https://api.openweathermap.org',
    rateLimitWindowMs: 900000,
    rateLimitMax: 100,
  },
}));

import { fetchCurrentWeather, fetchForecast } from '../src/services/weatherService';

const mockFetchCurrent = fetchCurrentWeather as jest.MockedFunction<typeof fetchCurrentWeather>;
const mockFetchForecast = fetchForecast as jest.MockedFunction<typeof fetchForecast>;

const app = createApp();

const mockCurrentRaw = {
  name: 'Austin',
  sys: { country: 'US', sunrise: 1700000000, sunset: 1700040000 },
  main: { temp: 90, feels_like: 95, humidity: 65, temp_min: 85, temp_max: 95, pressure: 1010 },
  wind: { speed: 12, deg: 270 },
  visibility: 16093,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  dt: 1700020000,
  timezone: -21600,
};

const mockForecastRaw = {
  city: { name: 'Austin', country: 'US', timezone: -21600 },
  list: [
    {
      dt: 1700020000,
      dt_txt: '2024-01-01 12:00:00',
      main: { temp: 90, temp_min: 85, temp_max: 95, humidity: 65 },
      wind: { speed: 12, deg: 270 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
  ],
};

describe('GET /api/weather/current', () => {
  it('returns 400 when location is missing', async () => {
    const res = await request(app).get('/api/weather/current');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/location/i);
  });

  it('returns formatted weather for a valid location', async () => {
    mockFetchCurrent.mockResolvedValueOnce(mockCurrentRaw as any);
    const res = await request(app).get('/api/weather/current?location=Austin');
    expect(res.status).toBe(200);
    expect(res.body.location).toBe('Austin');
    expect(res.body.country).toBe('US');
    expect(typeof res.body.temperature).toBe('number');
  });

  it('returns 404 when location is not found', async () => {
    const err = Object.assign(new Error('city not found'), { status: 404 });
    mockFetchCurrent.mockRejectedValueOnce(err);
    const res = await request(app).get('/api/weather/current?location=Nowhere');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/weather/forecast', () => {
  it('returns 400 when location is missing', async () => {
    const res = await request(app).get('/api/weather/forecast');
    expect(res.status).toBe(400);
  });

  it('returns forecast array for a valid location', async () => {
    mockFetchForecast.mockResolvedValueOnce(mockForecastRaw as any);
    const res = await request(app).get('/api/weather/forecast?location=Austin');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
