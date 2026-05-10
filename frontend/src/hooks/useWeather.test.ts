import { renderHook, act } from '@testing-library/react';
import { useWeather } from './useWeather';
import * as weatherApi from '../services/weatherApi';

jest.mock('../services/weatherApi');

const mockCurrent = {
  location: 'Austin', country: 'US', temperature: 95, feelsLike: 102,
  tempMin: 88, tempMax: 98, humidity: 65, pressure: 1010,
  windSpeed: 12, windDirection: 'S', visibility: 10,
  condition: 'Clear', conditionDescription: 'clear sky', icon: '01d',
  sunrise: '06:45', sunset: '18:30', observedAt: '14:00', heatIndex: 110,
};

const mockForecast = [
  {
    date: '2024-01-01', tempMin: 80, tempMax: 95, humidity: 60,
    windSpeed: 10, condition: 'Clear', conditionDescription: 'clear sky', icon: '01d',
  },
];

const mockPayload = { current: mockCurrent, forecast: mockForecast };

describe('useWeather', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with empty state', () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current.current).toBeNull();
    expect(result.current.forecast).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading true during fetch', async () => {
    let resolvePromise!: () => void;
    (weatherApi.fetchWeatherByCoords as jest.Mock).mockReturnValue(
      new Promise((res) => { resolvePromise = () => res(mockPayload); })
    );

    const { result } = renderHook(() => useWeather());
    act(() => { result.current.searchByCoords(30.2672, -97.7431, 'Austin'); });
    expect(result.current.loading).toBe(true);
    await act(async () => resolvePromise());
  });

  it('populates current and forecast on success', async () => {
    (weatherApi.fetchWeatherByCoords as jest.Mock).mockResolvedValue(mockPayload);

    const { result } = renderHook(() => useWeather());
    await act(async () => { await result.current.searchByCoords(30.2672, -97.7431, 'Austin'); });

    expect(result.current.current).toEqual(mockCurrent);
    expect(result.current.forecast).toEqual(mockForecast);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error message on failure', async () => {
    (weatherApi.fetchWeatherByLocation as jest.Mock).mockRejectedValue(new Error('Location not found'));

    const { result } = renderHook(() => useWeather());
    await act(async () => { await result.current.searchByLocation('Nowhere'); });

    expect(result.current.error).toBe('Location not found');
    expect(result.current.current).toBeNull();
  });
});
