import { Router } from 'express';
// import { answerQuestion } from '../../agent/answerQuestion';
import { WeatherAgent } from '../agent/agent';

export const weatherAgentRouter = Router();

weatherAgentRouter.get('/agent', async (req, res) => {
  const questionParam = req.query.question;
  const question = typeof questionParam === 'string' ? questionParam : undefined;

  if (!question) {
    res.status(400).json({
      error: 'Missing required query param: question',
      status: 400,
    });
    return;
  }

  try {
    const answer = await WeatherAgent.getInstance().answersQuestion(question);
    res.status(200).json({ answer });
  } catch (err: unknown) {
    res.status(500).json({
      error: err,
      status: 500,
    });
  }
});
