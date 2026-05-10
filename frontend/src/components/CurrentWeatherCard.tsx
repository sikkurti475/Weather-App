import { CurrentWeather } from '../utils/types';
import { useUnits, toTemp, toWind, toVisibility, tempLabel, windLabel, visibilityLabel } from '../utils/units';

export function CurrentWeatherCard({ data, locationLabel }: { data: CurrentWeather; locationLabel?: string | null }) {
  const { unit, toggle } = useUnits();
  const tl = tempLabel(unit);
  const displayLocation = locationLabel ? locationLabel.split(',')[0].trim() : `${data.location}, ${data.country}`;

  return (
    <div className="current-weather">
      <div className="current-weather__header-row">
        <h2 className="current-weather__location">{displayLocation}</h2>
        <button className="unit-toggle" onClick={toggle} title="Toggle units">
          {unit === 'imperial' ? '°C' : '°F'}
        </button>
      </div>
      <p className="current-weather__observed">As of {data.observedAt}</p>
      <span className="current-weather__temp">{toTemp(data.temperature, unit)}°</span>
      <span className="current-weather__condition">{data.conditionDescription}</span>
      <span className="current-weather__hilo">H:{toTemp(data.tempMax, unit)}° L:{toTemp(data.tempMin, unit)}°</span>

      <div className="stats">
        <Stat label="Feels Like"  value={`${toTemp(data.feelsLike, unit)}${tl}`} />
        <Stat label="Humidity"    value={`${data.humidity}%`} />
        <Stat label="Wind"        value={`${toWind(data.windSpeed, unit)} ${windLabel(unit)} ${data.windDirection}`} />
        <Stat label="Visibility"  value={`${toVisibility(data.visibility, unit)} ${visibilityLabel(unit)}`} />
        <Stat label="Pressure"    value={`${data.pressure} hPa`} />
        <Stat label="Sunrise"     value={data.sunrise.slice(11, 16)} />
        <Stat label="Sunset"      value={data.sunset.slice(11, 16)} />
        {data.heatIndex !== null && <Stat label="Heat Index" value={`${toTemp(data.heatIndex, unit)}${tl}`} highlight />}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`stat${highlight ? ' stat--highlight' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}
