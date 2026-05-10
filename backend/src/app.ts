import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import weatherRouter from './routes/weather';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { cacheGet } from './services/cache';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Weather API', version: '1.0.0', description: 'Weather data powered by OpenWeatherMap' },
    servers: [{ url: 'http://localhost:3001' }],
  },
  apis: ['./src/routes/*.ts'],
});

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(rateLimiter);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/weather', apiKeyAuth, weatherRouter);

  /**
   * GET /health
   * Health check endpoint for load balancers and container orchestration
   */
  app.get('/health', async (req, res) => {
    try {
      // Check Redis connectivity by attempting a simple operation
      await cacheGet('health-check');
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        redis: 'connected'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.use(errorHandler);

  return app;
}
