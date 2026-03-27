// import { Router } from 'express';
// import { BaseAgent } from '../agent/answerQuestion';
// import { env } from '../config/env';

// export const agentRouter = Router();

// agentRouter.get('/agent', async (req, res) => {
//   const questionParam = req.query.question;
//   const question = typeof questionParam === 'string' ? questionParam : undefined;

//   if (!question) {
//     res.status(400).json({
//       error: 'Missing required query param: question',
//       status: 400
//     });
//     return;
//   }

//   try {
//     const answer = await answerQuestion(question);
//     res.status(200).json({ answer });
//   } catch (err: any) {
//     res.status(500).json({
//       error: err,
//       status: 500
//     });
//   }
// });
