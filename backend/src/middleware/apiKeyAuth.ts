import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth if no key is configured (dev convenience)
  if (!config.appApiKey) { next(); return; }

  const key = req.headers['x-api-key'];
  if (!key || key !== config.appApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
