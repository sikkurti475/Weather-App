import { Router, Request, Response, NextFunction } from 'express';
import { geocode, fetchCurrentByCoords, fetchForecastByCoords } from '../services/weatherService';
import { formatCurrentWeather, formatForecast } from '../utils/weatherFormatters';
import { cacheGet, cacheSet } from '../services/cache';

const router = Router();

// Shared helper: resolve location string → coords, with caching
async function resolveCoords(q: string): Promise<{ lat: number; lon: number } | null> {
  const results = await geocode(q);
  if (!results.length) return null;
  return { lat: results[0].lat, lon: results[0].lon };
}

/**
 * GET /api/weather?location=Villanova,Pennsylvania,US
 * GET /api/weather?lat=40.03&lon=-75.35
 * Returns { current, forecast }
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let lat: number, lon: number;

    if (req.query.lat && req.query.lon) {
      lat = parseFloat(req.query.lat as string);
      lon = parseFloat(req.query.lon as string);
      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ error: 'Invalid lat/lon' });
        return;
      }
    } else if (req.query.location) {
      const coords = await resolveCoords(req.query.location as string);
      if (!coords) { res.status(404).json({ error: 'Location not found' }); return; }
      ({ lat, lon } = coords);
    } else {
      res.status(400).json({ error: 'Provide location or lat/lon' });
      return;
    }

    const cacheKey = `locationCoords:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) { res.json(cached); return; }

    const [rawCurrent, rawForecast] = await Promise.all([
      fetchCurrentByCoords(lat, lon),
      fetchForecastByCoords(lat, lon),
    ]);

    const payload = {
      current: formatCurrentWeather(rawCurrent),
      forecast: formatForecast(rawForecast),
    };

    await cacheSet(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/suggestions?q=villa
 * Returns geocoding suggestions for the search input
 */
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  const q = req.query.q as string | undefined;
  if (!q?.trim()) { res.status(400).json({ error: 'q is required' }); return; }
  try {
    const results = await geocode(q.trim());
    res.json(results.map(r => ({
      label: [r.name, r.state, r.country].filter(Boolean).join(', '),
      lat: r.lat,
      lon: r.lon,
    })));
  } catch (error) {
    next(error);
  }
});

export default router;
