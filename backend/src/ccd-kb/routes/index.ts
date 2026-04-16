import { Router } from 'express';
import ConcordiumKnowledgeBaseAgent from '../agent';
import { ingestionRouter } from './ingestion';

export const ccdKBAgentRouter = Router();

ccdKBAgentRouter.use('/ingest', ingestionRouter);

ccdKBAgentRouter.post('/agent', async (req, res) => {
  const questionParam = req.body.question;
  const question = typeof questionParam === 'string' ? questionParam : undefined;

  if (!question) {
    res.status(400).json({
      error: 'Missing required query param: question',
      status: 400,
    });
    return;
  }

  try {
    const answer = await ConcordiumKnowledgeBaseAgent.getInstance().answersQuestion(question);
    res.status(200).json(answer);
  } catch (err: unknown) {
    res.status(500).json({
      error: err,
      status: 500,
    });
  }
});
