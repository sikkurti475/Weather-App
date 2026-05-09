import {
  OWMCurrentResponse,
  OWMForecastItem,
  OWMForecastResponse,
  CurrentWeather,
  ForecastDay,
} from './types';

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function degreesToCompass(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return WIND_DIRECTIONS[index];
}

/**
 * Heat index (°F) using the Rothfusz regression — only meaningful above 80°F
 * and 40% humidity. Returns null when conditions don't apply.
 */
export function calculateHeatIndex(tempF: number, humidity: number): number | null {
  if (tempF < 80 || humidity < 40) return null;
  const hi =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF ** 2 -
    0.05481717 * humidity ** 2 +
    0.00122874 * tempF ** 2 * humidity +
    0.00085282 * tempF * humidity ** 2 -
    0.00000199 * tempF ** 2 * humidity ** 2;
  return Math.round(hi);
}

function formatUnixTime(unix: number, offsetSeconds: number): string {
  return new Date((unix + offsetSeconds) * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function formatCurrentWeather(data: OWMCurrentResponse): CurrentWeather {
  return {
    location: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: Math.round(data.wind.speed),
    windDirection: degreesToCompass(data.wind.deg),
    visibility: Math.round(data.visibility / 1609.34), // meters → miles
    condition: data.weather[0].main,
    conditionDescription: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: formatUnixTime(data.sys.sunrise, data.timezone),
    sunset: formatUnixTime(data.sys.sunset, data.timezone),
    observedAt: formatUnixTime(data.dt, data.timezone),
    heatIndex: calculateHeatIndex(data.main.temp, data.main.humidity),
  };
}

/**
 * Collapses 3-hour forecast intervals into one entry per calendar day,
 * picking the dominant condition and aggregating min/max temps.
 */
export function formatForecast(data: OWMForecastResponse): ForecastDay[] {
  const byDay = new Map<string, OWMForecastItem[]>();

  for (const item of data.list) {
    const day = item.dt_txt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(item);
  }

  return Array.from(byDay.entries())
    .slice(0, 5)
    .map(([date, items]) => {
      const midday = items.find((i) => i.dt_txt.includes('12:00')) ?? items[Math.floor(items.length / 2)];
      return {
        date,
        tempMin: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        tempMax: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
        windSpeed: Math.round(midday.wind.speed),
        condition: midday.weather[0].main,
        conditionDescription: midday.weather[0].description,
        icon: midday.weather[0].icon,
      };
    });
}
