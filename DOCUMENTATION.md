# Weather App — Full Technical Documentation

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Backend Deep Dive](#2-backend-deep-dive)
3. [Frontend Deep Dive](#3-frontend-deep-dive)
4. [Data Flow](#4-data-flow)
5. [Caching Strategy](#5-caching-strategy)
6. [Security](#6-security)
7. [Interview Q&A](#7-interview-qa)
8. [Gaps & Future Considerations](#8-gaps--future-considerations)

---

## 1. Architecture Overview

```
Browser (React + Vite :5173)
        │
        │  /api/* proxied by Vite dev server
        ▼
Express API (Node.js + TypeScript :3001)
        │
        ├── Redis (cache, TTL 15 min)
        │
        └── OpenWeatherMap API
              ├── /geo/1.0/direct      (geocoding)
              ├── /data/2.5/weather    (current, by coords)
              └── /data/2.5/forecast   (5-day, by coords)
```

**Key design decision:** all weather fetches use lat/lon coordinates, never city name strings.
The geocoding step resolves ambiguous names (e.g. Villanova, Pennsylvania, US vs Villanova, IT)
to exact coordinates first, then those coordinates drive every weather call.

---

## 2. Backend Deep Dive

### Stack
- Node.js 18+, Express 4, TypeScript 5
- axios for OWM HTTP calls (8s timeout)
- redis (node-redis v5) for caching
- express-rate-limit — 100 req / 15 min per IP
- swagger-jsdoc + swagger-ui-express — API docs at /api-docs
- ts-node-dev for hot reload in development

### File Structure
```
backend/src/
  config/env.ts           — typed env validation, fails fast if API key missing
  services/
    weatherService.ts     — axios calls to OWM (geocode, current, forecast)
    cache.ts              — Redis get/set wrapper, non-fatal on failure
  routes/weather.ts       — single router, 2 endpoints
  middleware/
    errorHandler.ts       — maps err.status to HTTP response
    rateLimiter.ts        — express-rate-limit config
  utils/
    types.ts              — OWM raw shapes + formatted response interfaces
    weatherFormatters.ts  — business logic (heat index, compass, forecast aggregation)
  app.ts                  — Express app factory (testable), includes health check
  server.ts               — entry point, binds port
```

### API Endpoints

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | /health | - | Health check with Redis status and uptime |
| GET | /api/weather | location OR lat+lon | Returns { current, forecast } |
| GET | /api/weather/suggestions | q | Returns [{ label, lat, lon }] |

### Resolution Flow for /api/weather?location=Villanova,Pennsylvania,US
1. Geocode query via /geo/1.0/direct → get lat/lon
2. Check Redis cache key locationCoords:{lat},{lon}
3. Cache hit → return immediately
4. Cache miss → parallel fetch current + forecast by coords → format → cache → return

### Business Logic (weatherFormatters.ts)
- **Heat Index** — Rothfusz regression, only applied when temp >= 80°F and humidity >= 40%
- **Wind compass** — converts 0–360° to 8-point compass (N, NE, E, SE, S, SW, W, NW)
- **Forecast aggregation** — collapses 3-hour OWM intervals into 1 entry per day; picks midday
  slot for representative condition; computes true daily min/max across all intervals
- **Visibility** — converts meters to miles

---

## 3. Frontend Deep Dive

### Stack
- React 18, TypeScript 5, Vite 5
- swr for data fetching, caching, and revalidation
- No UI component library — fully custom CSS with CSS variables and glassmorphism

### File Structure
```
frontend/src/
  services/weatherApi.ts     — fetch wrappers for backend endpoints
  hooks/useWeather.ts        — SWR-based hook, supports coords or location key
  components/
    SearchBar.tsx            — debounced suggestions, locate button, skipRef guard
    CurrentWeatherCard.tsx   — hero temp display + stats grid
    ForecastStrip.tsx        — vertical 5-day forecast rows
  utils/
    types.ts                 — shared TypeScript interfaces
    units.tsx                — UnitsContext, conversion helpers (F/C, mph/kmh)
  App.tsx                    — root, auto-loads geolocation on mount
  App.css                    — design system with CSS variables, glass morphism
  main.tsx                   — StrictMode + UnitsProvider wrapper
```

### State Management
- No Redux or Zustand — state is local to components or lifted to useWeather
- useWeather holds a Key union type (coords | location) as SWR key
- searchedLabel tracks what the user typed/selected so the header shows the searched city name
- UnitsProvider is the only global context — holds imperial | metric toggle state

### Unit Conversion
All conversions happen client-side from imperial values the backend always returns:
- Temperature: (F - 32) × 5/9
- Wind: mph × 1.60934
- Visibility: mi × 1.60934
Toggling units requires zero network calls.

### Search Flow
1. User types → 300ms debounce → GET /api/weather/suggestions?q=
2. OWM geocoding returns [{ label, lat, lon }]
3. User selects → commit(suggestion) → skipRef.current = true → setValue(label)
4. skipRef prevents useEffect from re-fetching suggestions when value is set programmatically
5. useWeather.searchByCoords(lat, lon, label) → SWR key changes → fetch fires

### Dynamic Background
data-condition attribute is set on body from current.condition.toLowerCase().
CSS attribute selectors apply different gradients per condition:
- clear       → bright blue
- clouds      → steel blue-grey
- rain/drizzle → dark slate
- thunderstorm → near-black
- snow        → soft blue
- mist/fog/haze → grey-blue

---

## 4. Data Flow

```
User types "Villanova, Pennsylvania"
        │
        ▼
SearchBar debounce (300ms)
        │
        ▼
GET /api/weather/suggestions?q=Villanova,+Pennsylvania
        │
        ▼
OWM /geo/1.0/direct → [{ label: "Villanova, Pennsylvania, US", lat: 40.03, lon: -75.35 }]
        │
        ▼
User selects suggestion
        │
        ▼
useWeather.searchByCoords(40.03, -75.35, "Villanova, Pennsylvania, US")
        │
        ▼
GET /api/weather?lat=40.03&lon=-75.35
        │
        ├── Redis check: "locationCoords:40.0300,-75.3500"
        │       hit  → return cached JSON
        │       miss ↓
        ▼
Parallel: OWM /data/2.5/weather?lat=40.03&lon=-75.35
        + OWM /data/2.5/forecast?lat=40.03&lon=-75.35&cnt=40
        │
        ▼
formatCurrentWeather() + formatForecast()
        │
        ▼
Redis SET "locationCoords:40.0300,-75.3500" EX 900
        │
        ▼
{ current, forecast } → React → render
```

---

## 5. Caching Strategy

| Layer | Mechanism | TTL | Key Pattern |
|-------|-----------|-----|-------------|
| Backend Redis | locationCoords:{lat},{lon} | 15 min | Coords rounded to 4 decimal places |
| Backend Redis | suggestions:{query} | 24h | Lowercased, trimmed query string |
| Frontend SWR | In-memory | dedupingInterval 60s | SWR key object |

**Why coords as cache key?**
City name strings are ambiguous. Coordinates are canonical — the same location always produces
the same key regardless of how the user typed the query.

**Why non-fatal cache failures?**
The try/catch in cache.ts swallows Redis errors silently. If Redis is down, requests fall through
to OWM. This is a deliberate availability-over-consistency tradeoff.

**Why SWR revalidateOnFocus: false?**
Weather data doesn't change meaningfully when a user switches tabs.
The 15-min Redis TTL is the source of truth for freshness.

---

## 6. Security

| Concern | Implementation |
|---------|---------------|
| API key exposure | Key lives in .env, never sent to frontend. Vite proxy keeps all /api calls server-side |
| Rate limiting | 100 req / 15 min per IP via express-rate-limit |
| CORS | cors() middleware on Express |
| Input validation | Location param validated before geocoding; lat/lon parsed with parseFloat + isNaN check |
| Axios timeout | 8s timeout prevents hanging OWM requests |
| Error masking | 500 errors return generic message to client; full error only logged server-side |

---

## 8. Gaps & Future Considerations

### Functional Gaps

**No authentication**
The API is fully open. Any client can call it as long as it has x-api-key. JWT and Auth based tokens can be added for personlization in future.

**Rate limiter is in-memory**
express-rate-limit defaults to in-memory storage. With multiple backend instances, each has
its own counter. We can switch to rate-limit-redis/ API Gateways (like Apigee)  to share state across instances.

**No offline support**
No service worker or PWA manifest. The app fails completely with no network.

---

### Production Readiness Gaps

**No structured logging**
console.error is used throughout. Replace with Winston or Pino with JSON output, log levels,
and correlation IDs per request. Ship logs to CloudWatch Logs.

**Health check endpoint implemented**
GET /health returns Redis connectivity status and uptime for load balancer health checks and container orchestration readiness probes.

**No Dockerfile**
A multi-stage Dockerfile (build TypeScript → copy dist → minimal node image) is needed for
consistent deployments and would reduce image size significantly.

**No CI/CD pipeline**
No GitHub Actions or similar. Should run tsc, npm test, and lint on every PR before merge.

**No environment-specific config**
A single .env file. Production needs secrets management (AWS Secrets Manager or Parameter
Store) and separate configs per environment (dev, staging, prod).

---

### Future Feature Considerations

**Hourly forecast** — OWM returns 3-hour intervals which could be displayed as an hourly
strip for the current day, similar to the iPhone Weather app.

**Weather alerts** — OWM's One Call API includes severe weather alerts. Surface these as
a dismissible banner when active for the searched location.

**Saved locations** — persist a list of favourite cities in localStorage so users don't
have to re-search on every visit.

**Dark/light mode** — the current design is dark-only. A light mode with inverted glass
effects would improve accessibility in bright environments.

**Internationalisation** — all text is hardcoded in English. Adding i18n support (react-i18next)
would open the app to non-English users.
