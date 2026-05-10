import { useEffect } from 'react';
import { useWeather } from './hooks/useWeather';
import { SearchBar } from './components/SearchBar';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { ForecastStrip } from './components/ForecastStrip';
import './App.css';

export default function App() {
  const { current, forecast, loading, error, searchedLabel, searchByCoords, searchByLocation } = useWeather();

  // Auto-load current location on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => searchByCoords(coords.latitude, coords.longitude),
      () => {} // silently ignore if denied
    );
  }, []);

  // Set dynamic background based on weather condition
  useEffect(() => {
    document.body.setAttribute('data-condition', current?.condition?.toLowerCase() ?? '');
  }, [current?.condition]);

  return (
    <div className="app">
      <main className="app__main">
        <SearchBar
          onSelectSuggestion={(lat, lon, label) => searchByCoords(lat, lon, label)}
          onSearchText={searchByLocation}
          loading={loading}
        />

        {error && <div className="error-banner" role="alert">{error}</div>}

      {loading && !current ? (
        <LoadingSkeleton />
      ) : current ? (
        <div className="weather-panel">
          <div className="weather-panel__left">
            <CurrentWeatherCard data={current} locationLabel={searchedLabel} />
          </div>
          <div className="weather-panel__right">
            <ForecastStrip forecast={forecast} />
          </div>
        </div>
      ) : (
        <p className="hint">Search for a city or allow location access.</p>
      )}
    </main>
  </div>
);
}

function LoadingSkeleton() {
  return (
    <div className="weather-panel weather-panel--skeleton" aria-busy="true" aria-label="Loading weather data">
      <div className="weather-panel__left">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-subtitle" />
        <div className="skeleton skeleton-temp" />
        <div className="skeleton skeleton-condition" />
        <div className="skeleton skeleton-hilo" />
        <div className="stats stats--skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="stat stat--skeleton" key={index}>
              <div className="skeleton skeleton-stat-label" />
              <div className="skeleton skeleton-stat-value" />
            </div>
          ))}
        </div>
      </div>
      <div className="weather-panel__right">
        <div className="forecast">
          <p className="forecast__title">5-Day Forecast</p>
          <div className="forecast__list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="forecast-row forecast-row--skeleton" key={index}>
                <div className="skeleton skeleton-forecast-day" />
                <div className="skeleton skeleton-forecast-icon" />
                <div className="skeleton skeleton-forecast-humidity" />
                <div className="forecast-row__temps">
                  <div className="skeleton skeleton-forecast-max" />
                  <div className="skeleton skeleton-forecast-min" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
