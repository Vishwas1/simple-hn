import express from 'express';
import { httpLogger } from './logger';
import { healthRouter } from './routes/health';
import { weatherAgentRouter } from './weather/routes/agent';
import { ingestionRouter } from './routes/ingestion';
import { documentRouter } from './routes/document';

export function createApp() {
  const app = express();

  app.use(httpLogger);
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.status(200).json({ name: 'simple-hn-backend', ok: true });
  });

  app.use('/api/v1', healthRouter);
  app.use('/api/v1/weather', weatherAgentRouter);
  app.use('/api/v1/ingest', ingestionRouter);
  app.use('/api/v1/document', documentRouter);

  // Basic 404 handler.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found', status: 404 });
  });

  return app;
}
