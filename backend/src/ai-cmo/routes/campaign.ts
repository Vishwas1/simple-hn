/* eslint-disable @typescript-eslint/no-explicit-any */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { cmoGraph } from '../graph';
import { Command } from '@langchain/langgraph';

export const campaignRouter = Router();

/**
 * 1. START THE CAMPAIGN
 * This triggers the Strategist and pauses at the Human Review.
 */
campaignRouter.post('/', async (req, res) => {
  const { brandId, objective } = req.body;

  const brand = await db.get('brands', brandId);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const campaignId = uuidv4();

  // Run graph until the 'interrupt' in humanReviewNode
  const initialState = {
    brandId,
    brandProfile: brand,
    objective,
    tasks: [],
    isApproved: false,
  };

  const finalState = await cmoGraph.invoke(initialState, {
    configurable: { thread_id: campaignId },
  });

  // Save the initial strategy and generated task list to JSON
  await db.save('campaigns', campaignId, {
    id: campaignId,
    brandId,
    objective,
    plan: finalState.plan,
    tasks: finalState.tasks,
    status: 'PENDING_APPROVAL',
  });

  res.json({ campaignId, plan: finalState.plan, tasks: finalState.tasks });
});

/**
 * 2. GET CAMPAIGN STATUS
 * Use this to poll the progress of the Writer agents.
 */
campaignRouter.get('/:id', async (req, res) => {
  const campaign = await db.get('campaigns', req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  res.json(campaign);
});

/**
 * 3. APPROVE & EXECUTE
 * This resumes the graph. The Writer will start picking up tasks.
 */
campaignRouter.post('/:id/approve', async (req, res) => {
  const { approved, feedback } = req.body;
  const campaignId = req.params.id;

  // Resume the graph with the Human's decision
  const finalState = await cmoGraph.invoke(new Command({ resume: { approved, feedback } }), {
    configurable: { thread_id: campaignId },
  });

  // Update our JSON file with the current progress
  const currentData = await db.get('campaigns', campaignId);

  await db.save('campaigns', campaignId, {
    ...currentData,
    plan: finalState.plan, // might have changed if feedback was given
    tasks: finalState.tasks,
    status: approved ? 'EXECUTING' : 'REVISING',
  });

  res.json({ message: 'Process resumed', status: approved ? 'EXECUTING' : 'REVISING' });
});

/**
 * GET /campaigns/brand/:brandId
 * Returns all campaigns associated with a specific brand
 */
campaignRouter.get('/brand/:brandId', async (req, res) => {
  const { brandId } = req.params;

  try {
    // 1. Get all campaign IDs
    const allCampaignIds = await db.list('campaigns');

    // 2. Fetch each campaign and filter by brandId
    const brandCampaigns = await Promise.all(
      allCampaignIds.map(async (id) => {
        const campaign = await db.get('campaigns', id);
        return campaign;
      }),
    );

    // 3. Filter to keep only those matching the brandId
    // and map to a summary format for the UI
    const filteredList = brandCampaigns
      .filter((camp) => camp && camp.brandId === brandId)
      .map((camp) => ({
        campaignId: camp.campaignId,
        id: camp.id,
        objective: camp.objective,
        status: camp.status || 'UNKNOWN',
        taskCount: camp.tasks?.length || 0,
        completedTasks: camp.tasks?.filter((t: any) => t.status === 'completed').length || 0,
        createdAt: camp.createdAt || null, // if you track timestamps
      }));

    res.json(filteredList);
  } catch (error) {
    console.error('Failed to fetch campaigns for brand:', error);
    res.status(500).json({ error: 'Could not retrieve campaigns' });
  }
});
