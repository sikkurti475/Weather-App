import { ForecastDay } from '../utils/types';
import { useUnits, toTemp } from '../utils/units';

export function ForecastStrip({ forecast }: { forecast: ForecastDay[] }) {
  if (!forecast.length) return null;
  return (
    <div className="forecast">
      <p className="forecast__title">5-Day Forecast</p>
      <div className="forecast__list">
        {forecast.map(day => <ForecastRow key={day.date} day={day} />)}
      </div>
    </div>
  );
}

function ForecastRow({ day }: { day: ForecastDay }) {
  const { unit } = useUnits();
  const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  return (
    <div className="forecast-row">
      <span className="forecast-row__day">{label}</span>
      <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.conditionDescription} className="forecast-row__icon" />
      <span className="forecast-row__humidity">💧{day.humidity}%</span>
      <div className="forecast-row__temps">
        <span className="forecast-row__max">{toTemp(day.tempMax, unit)}°</span>
        <span className="forecast-row__min">{toTemp(day.tempMin, unit)}°</span>
      </div>
    </div>
  );
}
