/**
 * Computes heat index (°F) using the Rothfusz regression formula.
 * Only meaningful when temp >= 80°F and humidity >= 40%.
 */
function computeHeatIndex(tempF, humidity) {
  if (tempF < 80 || humidity < 40) return null;

  const T = tempF;
  const R = humidity;

  const hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  return Math.round(hi);
}

/**
 * Maps wind speed (mph) to a Beaufort-style description.
 */
function describeWind(speedMph) {
  if (speedMph < 1) return 'Calm';
  if (speedMph < 8) return 'Light breeze';
  if (speedMph < 19) return 'Moderate breeze';
  if (speedMph < 32) return 'Strong breeze';
  if (speedMph < 47) return 'Near gale';
  return 'Storm';
}

/**
 * Converts wind degrees to a compass direction.
 */
function degreesToCompass(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

/**
 * Shapes raw OpenWeatherMap current data into our API response.
 */
function formatCurrentWeather(raw) {
  const tempF = Math.round(raw.main.temp);
  const humidity = raw.main.humidity;

  return {
    location: `${raw.name}, ${raw.sys.country}`,
    condition: raw.weather[0].main,
    description: raw.weather[0].description,
    iconCode: raw.weather[0].icon,
    tempF,
    feelsLikeF: Math.round(raw.main.feels_like),
    heatIndexF: computeHeatIndex(tempF, humidity),
    humidity,
    windMph: Math.round(raw.wind.speed),
    windDirection: degreesToCompass(raw.wind.deg),
    windDescription: describeWind(raw.wind.speed),
    visibilityMiles: raw.visibility ? Math.round(raw.visibility / 1609) : null,
    pressureHpa: raw.main.pressure,
    sunrise: raw.sys.sunrise,
    sunset: raw.sys.sunset,
    timezone: raw.timezone,
    recordedAt: raw.dt,
  };
}

/**
 * Aggregates 3-hour forecast intervals into one entry per day.
 * Picks the noon-closest interval for conditions; tracks daily high/low.
 */
function formatForecast(raw) {
  const byDay = {};

  for (const item of raw.list) {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().slice(0, 10);
    const hour = date.getUTCHours() + raw.city.timezone / 3600;

    if (!byDay[dayKey]) {
      byDay[dayKey] = {
        date: dayKey,
        highF: item.main.temp_max,
        lowF: item.main.temp_min,
        noonDiff: Infinity,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        iconCode: item.weather[0].icon,
        humidity: item.main.humidity,
        windMph: Math.round(item.wind.speed),
      };
    }

    const day = byDay[dayKey];
    day.highF = Math.max(day.highF, item.main.temp_max);
    day.lowF = Math.min(day.lowF, item.main.temp_min);

    const diff = Math.abs(hour - 12);
    if (diff < day.noonDiff) {
      day.noonDiff = diff;
      day.condition = item.weather[0].main;
      day.description = item.weather[0].description;
      day.iconCode = item.weather[0].icon;
      day.humidity = item.main.humidity;
      day.windMph = Math.round(item.wind.speed);
    }
  }

  return Object.values(byDay)
    .map(({ noonDiff, ...rest }) => ({
      ...rest,
      highF: Math.round(rest.highF),
      lowF: Math.round(rest.lowF),
    }))
    .slice(0, 5);
}

module.exports = {
  computeHeatIndex,
  describeWind,
  degreesToCompass,
  formatCurrentWeather,
  formatForecast,
};
