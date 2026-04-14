import { Router } from 'express';
import { runAgent } from '../agent/openAi';

export const agentRouter = Router();

agentRouter.post('/', async (_req, res) => {
  try {
    const result = await runAgent(_req.body.query);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while running ingestion:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while running ingestion',
    });
  }
});
