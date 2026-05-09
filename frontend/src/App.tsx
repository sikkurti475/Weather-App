import { useWeather } from './hooks/useWeather';
import { SearchBar } from './components/SearchBar';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { ForecastStrip } from './components/ForecastStrip';
import './App.css';

export default function App() {
  const { current, forecast, loading, error, search } = useWeather();

  return (
    <div className="app">
      <header className="app__header">
        <h1>Weather</h1>
      </header>

      <main className="app__main">
        <SearchBar onSearch={search} loading={loading} error={error} />

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {current && <CurrentWeatherCard data={current} />}
        {forecast.length > 0 && <ForecastStrip forecast={forecast} />}

        {!loading && !current && !error && (
          <p className="app__placeholder">Search for a city to see the weather.</p>
        )}
      </main>
    </div>
  );
}
