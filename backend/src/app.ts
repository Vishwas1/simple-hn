import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from './config/env';
import { httpLogger } from './logger';
import { healthRouter } from './routes/health';
import { weatherAgentRouter } from './weather/routes/agent';
import { ccdKBAgentRouter } from './ccd-kb/routes';
import { jokeAgentRouter } from './joker/jokeRouter';
import { aiCMORouter } from './ai-cmo/routes';

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}

export function createApp() {
  const app = express();

  app.use(corsMiddleware);
  app.use(httpLogger);
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.status(200).json({ name: 'simple-hn-backend', ok: true });
  });

  app.use('/api/v1', healthRouter);
  app.use('/api/v1/weather', weatherAgentRouter);
  app.use('/api/v1/ccd-kb', ccdKBAgentRouter);
  app.use('/api/v1/joker', jokeAgentRouter);
  app.use('/api/v1/cmo', aiCMORouter);

  // Basic 404 handler.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found', status: 404 });
  });

  return app;
}
