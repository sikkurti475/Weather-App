# Weather App

A full-stack weather application built with Node.js/Express (TypeScript) and React (TypeScript). Displays current conditions and a 5-day forecast powered by the [OpenWeatherMap API](https://openweathermap.org/api).

frontend/public/demo-ss.png
---

## Quick Start (2 steps)

### Prerequisites
- Node.js 18+
- A free [OpenWeatherMap API key](https://home.openweathermap.org/api_keys)

### 1. Backend

```bash
cd backend
cp .env.example .env          # then add your API key to .env
npm install
npm run dev                   # runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), type a city name, and hit Search.

---

## API Documentation

Swagger UI is available at **http://localhost:3001/api-docs** when the backend is running.

### Endpoints

| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| GET | `/api/weather/current` | `location` (required) | Current weather for a city |
| GET | `/api/weather/forecast` | `location` (required) | 5-day daily forecast |

**Example:**
```
GET /api/weather/current?location=Austin,TX
GET /api/weather/forecast?location=London,GB
```

**Error responses:**
```json
{ "error": "city not found" }         // 404
{ "error": "location query parameter is required" }  // 400
{ "error": "Internal server error" }  // 500
```

---

## Architecture

```
backend/
  src/
    config/env.ts           # env var validation & typed config
    services/weatherService.ts  # raw axios calls to OpenWeatherMap
    routes/weather.ts       # Express router with Swagger annotations
    middleware/
      errorHandler.ts       # centralised error → HTTP status mapping
      rateLimiter.ts        # 100 req / 15 min per IP
    utils/
      types.ts              # OWM raw shapes + formatted response types
      weatherFormatters.ts  # business logic: heat index, wind compass, forecast aggregation
  tests/
    weatherFormatters.test.ts
    weatherRoutes.test.ts

frontend/
  src/
    services/weatherApi.ts  # fetch wrapper calling our backend
    hooks/useWeather.ts     # loading / error / data state
    components/
      SearchBar.tsx
      CurrentWeatherCard.tsx
      ForecastStrip.tsx
    utils/types.ts
```

---

## Business Logic

Beyond proxying the API, the backend adds:

- **Heat Index** — Rothfusz regression formula applied when temp ≥ 80°F and humidity ≥ 40%, giving a "feels like" heat danger metric distinct from the raw feels-like temperature.
- **Wind compass direction** — converts raw degrees (0–360) to an 8-point compass label (N, NE, E, …).
- **Forecast aggregation** — collapses OpenWeatherMap's 3-hour intervals into one entry per calendar day, picking the midday interval for the representative condition and computing true daily min/max across all intervals.
- **Visibility in miles** — converts the API's meters value to miles for US audiences.

---

## Running Tests

```bash
# Backend (25 tests)
cd backend && npm test

# Frontend (14 tests)
cd frontend && npm test

# With coverage
npm run test:coverage
```

---

## Production Considerations

- **Rate limiting** — 100 requests per 15 minutes per IP via `express-rate-limit`.
- **API key security** — key lives in `.env`, never exposed to the frontend.
- **Error boundaries** — backend maps upstream HTTP errors to appropriate status codes; frontend surfaces user-friendly messages.
- **Timeout** — axios client has an 8-second timeout to prevent hanging requests.
- **CORS** — configured on the backend; the Vite dev proxy keeps the API key server-side in all environments.
- **To add for full production**: structured logging (e.g. Winston + CloudWatch), response caching (Redis with a short TTL to reduce OWM calls), containerisation (Dockerfile + docker-compose), CI pipeline, and environment-specific config management.
