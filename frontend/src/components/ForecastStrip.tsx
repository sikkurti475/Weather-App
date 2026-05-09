import { ForecastDay } from '../utils/types';

interface ForecastStripProps {
  forecast: ForecastDay[];
}

export function ForecastStrip({ forecast }: ForecastStripProps) {
  if (forecast.length === 0) return null;

  return (
    <div className="forecast">
      <h3 className="forecast__title">5-Day Forecast</h3>
      <div className="forecast__strip">
        {forecast.map((day) => (
          <ForecastCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ day }: { day: ForecastDay }) {
  const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="forecast-card">
      <span className="forecast-card__date">{label}</span>
      <img
        src={`https://openweathermap.org/img/wn/${day.icon}.png`}
        alt={day.conditionDescription}
        className="forecast-card__icon"
      />
      <span className="forecast-card__condition">{day.condition}</span>
      <span className="forecast-card__temps">
        {day.tempMax}° / {day.tempMin}°
      </span>
      <span className="forecast-card__detail">💧 {day.humidity}%</span>
      <span className="forecast-card__detail">💨 {day.windSpeed} mph</span>
    </div>
  );
}
