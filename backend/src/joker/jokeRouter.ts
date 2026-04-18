import { Router } from 'express';
import { jokeGraph } from './joke-graph';
import { Command } from '@langchain/langgraph';
export const jokeAgentRouter = Router();

jokeAgentRouter.post('/agent', async (req, res) => {
  const topicParam = req.body.topic;
  const topic = typeof topicParam === 'string' ? topicParam : undefined;

  if (!topic) {
    res.status(400).json({
      error: 'Missing required query param: topic',
      status: 400,
    });
    return;
  }

  try {
    const config = { configurable: { thread_id: crypto.randomUUID() } };

    // This will run 'comedian' and then STOP before 'human_review'
    const initialState = await jokeGraph.invoke({ topic }, config);

    console.log('Joke generated:', initialState.joke);
    res.status(200).json({
      threadId: config.configurable.thread_id,
      joke: initialState.joke,
      status: 'pending_review',
    });
  } catch (err: unknown) {
    res.status(500).json({
      error: err,
      status: 500,
    });
  }
});

// STEP 2: The Human Review (Approve or Give Feedback)
jokeAgentRouter.post('/review', async (req, res) => {
  const { threadId, isApproved, feedback } = req.body;

  try {
    const config = { configurable: { thread_id: threadId } };

    const finalState = await jokeGraph.invoke(
      new Command({
        resume: { approved: isApproved, feedback: feedback },
      }),
      config,
    );

    // If isApproved was true, it hits END. If false, it loops to comedian and hits the interrupt again.
    if (isApproved) {
      res.status(200).json({ message: 'Joke approved!', finalJoke: finalState.joke });
    } else {
      res.status(200).json({
        message: 'Joke rejected. New draft created.',
        newJoke: finalState.joke,
      });
    }
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to process review ' + (err as Error)?.message });
  }
});
