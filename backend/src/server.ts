import config from './config/env';
import { createApp } from './app';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Weather API running on http://localhost:${config.port}`);
  console.log(`Swagger docs at http://localhost:${config.port}/api-docs`);
});
