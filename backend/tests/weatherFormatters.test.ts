import {
  degreesToCompass,
  calculateHeatIndex,
  formatCurrentWeather,
  formatForecast,
} from '../src/utils/weatherFormatters';
import { OWMCurrentResponse, OWMForecastResponse } from '../src/utils/types';

describe('degreesToCompass', () => {
  it.each([
    [0, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [360, 'N'],
  ])('converts %i° to %s', (degrees, expected) => {
    expect(degreesToCompass(degrees)).toBe(expected);
  });
});

describe('calculateHeatIndex', () => {
  it('returns null below 80°F', () => {
    expect(calculateHeatIndex(79, 80)).toBeNull();
  });

  it('returns null below 40% humidity', () => {
    expect(calculateHeatIndex(90, 39)).toBeNull();
  });

  it('returns a number for hot humid conditions', () => {
    const hi = calculateHeatIndex(95, 70);
    expect(hi).not.toBeNull();
    expect(hi).toBeGreaterThan(95);
  });
});

const mockCurrentRaw: OWMCurrentResponse = {
  name: 'London',
  sys: { country: 'GB', sunrise: 1700000000, sunset: 1700040000 },
  main: {
    temp: 85,
    feels_like: 88,
    humidity: 60,
    temp_min: 80,
    temp_max: 90,
    pressure: 1013,
  },
  wind: { speed: 10, deg: 90 },
  visibility: 16093,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  dt: 1700020000,
  timezone: 0,
};

describe('formatCurrentWeather', () => {
  const result = formatCurrentWeather(mockCurrentRaw);

  it('maps location and country', () => {
    expect(result.location).toBe('London');
    expect(result.country).toBe('GB');
  });

  it('rounds temperature values', () => {
    expect(result.temperature).toBe(85);
    expect(result.feelsLike).toBe(88);
  });

  it('converts visibility from meters to miles', () => {
    expect(result.visibility).toBe(10); // 16093m ≈ 10 miles
  });

  it('converts wind degrees to compass direction', () => {
    expect(result.windDirection).toBe('E');
  });

  it('calculates heat index for hot humid conditions', () => {
    expect(result.heatIndex).not.toBeNull();
  });
});

const mockForecastRaw: OWMForecastResponse = {
  city: { name: 'London', country: 'GB', timezone: 0 },
  list: [
    {
      dt: 1700020000,
      dt_txt: '2024-01-01 12:00:00',
      main: { temp: 70, temp_min: 65, temp_max: 75, humidity: 55 },
      wind: { speed: 8, deg: 180 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
    {
      dt: 1700031000,
      dt_txt: '2024-01-01 15:00:00',
      main: { temp: 72, temp_min: 68, temp_max: 78, humidity: 50 },
      wind: { speed: 9, deg: 180 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
    {
      dt: 1700106400,
      dt_txt: '2024-01-02 12:00:00',
      main: { temp: 60, temp_min: 55, temp_max: 65, humidity: 70 },
      wind: { speed: 12, deg: 270 },
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    },
  ],
};

describe('formatForecast', () => {
  const result = formatForecast(mockForecastRaw);

  it('returns one entry per day', () => {
    expect(result).toHaveLength(2);
  });

  it('aggregates min/max temps across intervals', () => {
    expect(result[0].tempMin).toBe(65);
    expect(result[0].tempMax).toBe(78);
  });

  it('uses midday interval for condition', () => {
    expect(result[0].condition).toBe('Clear');
    expect(result[1].condition).toBe('Rain');
  });
});
