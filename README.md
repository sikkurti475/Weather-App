# Weather App

A full-stack weather application built with Node.js/Express (TypeScript) and React (TypeScript).
Displays current conditions and a 5-day forecast powered by the [OpenWeatherMap API](https://openweathermap.org/api).

<img width="1442" height="808" alt="image" src="https://github.com/user-attachments/assets/94d4b7c4-c6d0-4fc6-baf2-ea2a771b5a5d" />
---

## Quick Start

### Prerequisites
- Node.js 18+
- Redis running locally (`brew install redis && brew services start redis`)
- A free [OpenWeatherMap API key](https://home.openweathermap.org/api_keys)

### 1. Backend

```bash
cd backend
cp .env.example .env          # add your API key and Redis URL to .env
npm install
npm run dev                   # runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). The app will request your location and load weather automatically. You can also type a city in the search bar.

---

## Features

- **Auto-loads current location** on first visit via browser geolocation
- **📍 Locate button** to re-fetch current location at any time
- **Search with suggestions** — debounced autocomplete using OWM geocoding
- **Correct city resolution** — geocodes to lat/lon first, then fetches weather by coordinates (avoids name ambiguity e.g. Villanova, PA vs Villanova, IT)
- **°F / °C toggle** — client-side unit conversion, no extra API calls
- **5-day forecast** displayed alongside current conditions
- **Dynamic background** — gradient changes based on weather condition (clear, clouds, rain, snow, etc.)
- **Redis cache** — 15-minute TTL per location, keyed by coordinates

---

## Environment Variables

### backend/.env
```
OPENWEATHER_API_KEY=your_api_key_here
PORT=3001
REDIS_URL=redis://localhost:6379
```

---

## API Documentation

Swagger UI is available at **http://localhost:3001/api-docs** when the backend is running.

### Endpoints

| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| GET | `/api/weather` | `location` (string) OR `lat` + `lon` | Returns `{ current, forecast }` |
| GET | `/api/weather/suggestions` | `q` (string) | Returns geocoding suggestions `[{ label, lat, lon }]` |

**Examples:**
```
GET /api/weather?location=Villanova,Pennsylvania,US
GET /api/weather?lat=40.0343&lon=-75.3521
GET /api/weather/suggestions?q=villa
```

**Response shape:**
```json
{
  "current": {
    "location": "Villanova",
    "country": "US",
    "temperature": 72,
    "feelsLike": 70,
    "tempMin": 65,
    "tempMax": 75,
    "humidity": 55,
    "pressure": 1015,
    "windSpeed": 8,
    "windDirection": "SW",
    "visibility": 10,
    "condition": "Clouds",
    "conditionDescription": "scattered clouds",
    "icon": "03d",
    "sunrise": "2026-05-09 05:38 UTC",
    "sunset": "2026-05-09 19:53 UTC",
    "observedAt": "2026-05-09 14:00 UTC",
    "heatIndex": null
  },
  "forecast": [
    {
      "date": "2026-05-09",
      "tempMin": 62,
      "tempMax": 75,
      "humidity": 55,
      "windSpeed": 8,
      "condition": "Clouds",
      "conditionDescription": "scattered clouds",
      "icon": "03d"
    }
  ]
}
```

**Error responses:**
```json
{ "error": "Location not found" }           // 404
{ "error": "Provide location or lat/lon" }  // 400
{ "error": "Internal server error" }        // 500
```

---

## Architecture

```
backend/
  src/
    config/env.ts               # env var validation & typed config
    services/
      weatherService.ts         # axios calls to OWM (geocode, current, forecast)
      cache.ts                  # Redis get/set wrapper with 15-min TTL
    routes/weather.ts           # single router — /api/weather and /api/weather/suggestions
    middleware/
      errorHandler.ts           # centralised error → HTTP status mapping
      rateLimiter.ts            # 100 req / 15 min per IP
    utils/
      types.ts                  # OWM raw shapes + formatted response types
      weatherFormatters.ts      # heat index, wind compass, forecast aggregation, visibility
  tests/
    weatherFormatters.test.ts
    weatherRoutes.test.ts

frontend/
  src/
    services/weatherApi.ts      # fetch wrappers for backend endpoints
    hooks/useWeather.ts         # SWR-based hook, coords or location key
    components/
      SearchBar.tsx             # debounced suggestions, locate button
      CurrentWeatherCard.tsx    # hero temp + stats grid + unit toggle
      ForecastStrip.tsx         # vertical 5-day forecast rows
    utils/
      types.ts                  # shared TypeScript interfaces
      units.tsx                 # UnitsContext + F/C conversion helpers
    App.tsx                     # root, auto-loads geolocation on mount
    App.css                     # glassmorphism design system
    main.tsx                    # StrictMode + UnitsProvider
```

---

## Business Logic

- **Heat Index** — Rothfusz regression applied when temp ≥ 80°F and humidity ≥ 40%
- **Wind compass** — converts raw degrees (0–360) to 8-point compass label (N, NE, E, …)
- **Forecast aggregation** — collapses OWM's 3-hour intervals into one entry per calendar day; picks midday interval for representative condition; computes true daily min/max
- **Visibility** — converts meters to miles
- **Unit conversion** — all conversions (°F↔°C, mph↔km/h, mi↔km) are done client-side from imperial backend values

---

## Caching

Redis caches the combined `{ current, forecast }` payload per location with a **15-minute TTL**.

Cache key format: `locationCoords:{lat},{lon}` (coords rounded to 4 decimal places)

If Redis is unavailable, requests fall through to OWM silently — the app remains functional.

---

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# With coverage
npm run test:coverage
```

> Note: tests are currently written against the previous API shape and need updating to reflect the new single-endpoint architecture.

---

## Production Considerations

- **Rate limiting** — 100 requests per 15 minutes per IP via `express-rate-limit`
- **API key security** — key lives in `.env`, never exposed to the frontend; Vite proxy keeps all `/api` calls server-side
- **Redis caching** — 15-min TTL reduces OWM API calls significantly for repeated/popular locations
- **Axios timeout** — 8-second timeout prevents hanging OWM requests
- **Error masking** — 500 errors return a generic message to the client; full stack trace only logged server-side
- **To add for full production**: structured logging (Winston + CloudWatch), HTTPS enforcement, Docker + docker-compose, CI/CD pipeline, rate-limit-redis for multi-instance deployments, React error boundary, health check endpoint
