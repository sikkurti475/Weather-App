import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  openWeatherApiKey: string;
  openWeatherBaseUrl: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

const apiKey = process.env.OPENWEATHER_API_KEY;
if (!apiKey) {
  throw new Error('OPENWEATHER_API_KEY environment variable is required');
}

const config: Config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  openWeatherApiKey: apiKey,
  openWeatherBaseUrl: 'https://api.openweathermap.org',
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 100,
};

export default config;
