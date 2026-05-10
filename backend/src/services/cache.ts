import { createClient } from 'redis';
import config from '../config/env';

const TTL = 15 * 60;

const redis = createClient({ url: config.redisUrl });
redis.on('error', (err) => console.error('[redis]', err.message));
redis.connect().catch((err) => console.error('[redis] connect failed:', err.message));

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { EX: TTL });
  } catch {
    // non-fatal
  }
}
