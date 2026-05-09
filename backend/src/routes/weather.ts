import { Router, Request, Response, NextFunction } from 'express';
import { fetchCurrentWeather, fetchForecast, fetchSuggestions } from '../services/weatherService';
import { formatCurrentWeather, formatForecast } from '../utils/weatherFormatters';

const router = Router();

/**
 * @swagger
 * /api/weather/current:
 *   get:
 *     summary: Get current weather for a location
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: City name, e.g. "London" or "London,GB"
 *     responses:
 *       200:
 *         description: Current weather data
 *       400:
 *         description: Missing location parameter
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  const location = req.query.location as string | undefined;
  if (!location?.trim()) {
    res.status(400).json({ error: 'location query parameter is required' });
    return;
  }
  try {
    const raw = await fetchCurrentWeather(location.trim());
    res.json(formatCurrentWeather(raw));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/weather/forecast:
 *   get:
 *     summary: Get 5-day daily forecast for a location
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: City name, e.g. "London" or "London,GB"
 *     responses:
 *       200:
 *         description: 5-day forecast array
 *       400:
 *         description: Missing location parameter
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  const location = req.query.location as string | undefined;
  if (!location?.trim()) {
    res.status(400).json({ error: 'location query parameter is required' });
    return;
  }
  try {
    const raw = await fetchForecast(location.trim());
    res.json(formatForecast(raw));
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  const q = req.query.q as string | undefined;
  if (!q?.trim()) {
    res.status(400).json({ error: 'q query parameter is required' });
    return;
  }
  try {
    const results = await fetchSuggestions(q.trim());
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
