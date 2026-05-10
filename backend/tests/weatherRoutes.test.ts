import request from 'supertest';
import { createApp } from '../src/app';

jest.mock('../src/services/weatherService');
jest.mock('../src/services/cache');
jest.mock('../src/middleware/rateLimiter', () => ({
  rateLimiter: jest.fn((req, res, next) => next()),
}));
jest.mock('../src/config/env', () => ({
  default: {
    port: 3001,
    openWeatherApiKey: 'test-key',
    openWeatherBaseUrl: 'https://api.openweathermap.org',
    redisUrl: 'redis://localhost:6379',
    rateLimitWindowMs: 900000,
    rateLimitMax: 100,
  },
}));

import { geocode, fetchCurrentByCoords, fetchForecastByCoords } from '../src/services/weatherService';
import { cacheGet, cacheSet } from '../src/services/cache';

const mockGeocode = geocode as jest.MockedFunction<typeof geocode>;
const mockFetchCurrent = fetchCurrentByCoords as jest.MockedFunction<typeof fetchCurrentByCoords>;
const mockFetchForecast = fetchForecastByCoords as jest.MockedFunction<typeof fetchForecastByCoords>;
const mockCacheGet = cacheGet as jest.MockedFunction<typeof cacheGet>;
const mockCacheSet = cacheSet as jest.MockedFunction<typeof cacheSet>;

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

describe('GET /api/weather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockResolvedValue(null);
  });

  it('returns 400 when neither location nor lat/lon provided', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/provide location or lat\/lon/i);
  });

  it('returns 400 for invalid lat/lon', async () => {
    const res = await request(app).get('/api/weather?lat=invalid&lon=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid lat\/lon/i);
  });

  it('returns 404 when location is not found', async () => {
    mockGeocode.mockResolvedValue([]);
    const res = await request(app).get('/api/weather?location=Nowhere');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/location not found/i);
  });

  it('returns cached weather if available', async () => {
    const cachedData = { current: { location: 'Austin' }, forecast: [] };
    mockCacheGet.mockResolvedValue(cachedData);
    const res = await request(app).get('/api/weather?lat=30.2672&lon=-97.7431');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cachedData);
    expect(mockFetchCurrent).not.toHaveBeenCalled();
  });

  it('fetches and returns weather for valid coords', async () => {
    mockFetchCurrent.mockResolvedValue(mockCurrentRaw as any);
    mockFetchForecast.mockResolvedValue(mockForecastRaw as any);
    mockCacheSet.mockResolvedValue();

    const res = await request(app).get('/api/weather?lat=30.2672&lon=-97.7431');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current');
    expect(res.body).toHaveProperty('forecast');
    expect(res.body.current.location).toBe('Austin');
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('coalesces concurrent requests for the same location cache key', async () => {
    let resolveCurrent: (value: any) => void;
    let resolveForecast: (value: any) => void;

    mockFetchCurrent.mockImplementation(() => new Promise<any>(resolve => { resolveCurrent = resolve; }));
    mockFetchForecast.mockImplementation(() => new Promise<any>(resolve => { resolveForecast = resolve; }));
    mockCacheSet.mockResolvedValue();

    const req1 = new Promise<any>(resolve => {
      request(app)
        .get('/api/weather?lat=30.2672&lon=-97.7431')
        .end((err, res) => resolve(res));
    });
    const req2 = new Promise<any>(resolve => {
      request(app)
        .get('/api/weather?lat=30.2672&lon=-97.7431')
        .end((err, res) => resolve(res));
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockFetchCurrent).toHaveBeenCalledTimes(1);
    expect(mockFetchForecast).toHaveBeenCalledTimes(1);

    resolveCurrent!(mockCurrentRaw as any);
    resolveForecast!(mockForecastRaw as any);

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
  });

  it('fetches and returns weather for valid location', async () => {
    mockGeocode.mockResolvedValue([{ name: 'Austin', lat: 30.2672, lon: -97.7431, country: 'US' }]);
    mockFetchCurrent.mockResolvedValue(mockCurrentRaw as any);
    mockFetchForecast.mockResolvedValue(mockForecastRaw as any);
    mockCacheSet.mockResolvedValue();

    const res = await request(app).get('/api/weather?location=Austin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current');
    expect(res.body).toHaveProperty('forecast');
  });
});

describe('GET /api/weather/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockResolvedValue(null);
  });

  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/weather/suggestions');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/q is required/i);
  });

  it('returns empty array for short query', async () => {
    const res = await request(app).get('/api/weather/suggestions?q=a');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it('returns cached suggestions if available', async () => {
    const cachedSuggestions = [{ label: 'Austin, TX, US', lat: 30.2672, lon: -97.7431 }];
    mockCacheGet.mockResolvedValue(cachedSuggestions);
    const res = await request(app).get('/api/weather/suggestions?q=austin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cachedSuggestions);
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it('fetches and returns suggestions', async () => {
    mockGeocode.mockResolvedValue([
      { name: 'Austin', state: 'TX', country: 'US', lat: 30.2672, lon: -97.7431 }
    ]);
    mockCacheSet.mockResolvedValue();

    const res = await request(app).get('/api/weather/suggestions?q=austin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ label: 'Austin, TX, US', lat: 30.2672, lon: -97.7431 }]);
    expect(mockCacheSet).toHaveBeenCalled();
  });
});

describe('GET /health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns healthy status when Redis is connected', async () => {
    mockCacheGet.mockResolvedValue(null);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'healthy',
      redis: 'connected'
    });
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns unhealthy status when Redis is disconnected', async () => {
    mockCacheGet.mockRejectedValue(new Error('Redis connection failed'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: 'unhealthy',
      redis: 'disconnected'
    });
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('error');
  });
});
