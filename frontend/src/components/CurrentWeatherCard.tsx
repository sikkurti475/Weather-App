import { CurrentWeather } from '../utils/types';

interface CurrentWeatherCardProps {
  data: CurrentWeather;
}

export function CurrentWeatherCard({ data }: CurrentWeatherCardProps) {
  return (
    <div className="current-weather">
      <div className="current-weather__header">
        <div>
          <h2 className="current-weather__location">
            {data.location}, {data.country}
          </h2>
          <p className="current-weather__observed">As of {data.observedAt}</p>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
          alt={data.conditionDescription}
          className="current-weather__icon"
        />
      </div>

      <div className="current-weather__temp">
        <span className="current-weather__temp-main">{data.temperature}°F</span>
        <span className="current-weather__condition">{data.conditionDescription}</span>
      </div>

      <div className="current-weather__details">
        <Stat label="Feels Like" value={`${data.feelsLike}°F`} />
        <Stat label="High / Low" value={`${data.tempMax}° / ${data.tempMin}°`} />
        <Stat label="Humidity" value={`${data.humidity}%`} />
        <Stat label="Wind" value={`${data.windSpeed} mph ${data.windDirection}`} />
        <Stat label="Visibility" value={`${data.visibility} mi`} />
        <Stat label="Pressure" value={`${data.pressure} hPa`} />
        <Stat label="Sunrise" value={data.sunrise.slice(11, 16)} />
        <Stat label="Sunset" value={data.sunset.slice(11, 16)} />
        {data.heatIndex !== null && (
          <Stat label="Heat Index" value={`${data.heatIndex}°F`} highlight />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat${highlight ? ' stat--highlight' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}
