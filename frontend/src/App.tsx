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

        {loading && !current && <p className="hint">Loading…</p>}

        {current && (
          <div className="weather-panel">
            <div className="weather-panel__left">
              <CurrentWeatherCard data={current} locationLabel={searchedLabel} />
            </div>
            <div className="weather-panel__right">
              <ForecastStrip forecast={forecast} />
            </div>
          </div>
        )}

        {!loading && !current && !error && (
          <p className="hint">Search for a city or allow location access.</p>
        )}
      </main>
    </div>
  );
}
