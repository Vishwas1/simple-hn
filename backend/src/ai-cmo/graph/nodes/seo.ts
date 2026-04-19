/* eslint-disable @typescript-eslint/no-explicit-any */

import { RunnableConfig } from '@langchain/core/runnables';
import { llm } from '../llm';
import { CMOState } from '../state';
import { db } from '../../services/db';

export const seoNode = async (state: typeof CMOState.State, config: RunnableConfig) => {
  console.log('--- Agent: SEO Specialist is optimizing tasks ---');

  // 1. Extract campaignId for DB updates
  const campaignId = config.configurable?.thread_id;

  // We send the tasks to the LLM to suggest keywords/tags for each
  const response = await llm.invoke(`
    You are an SEO & Social Media Specialist for ${state.brandProfile.name}.
    Objective: ${state.objective}
    Tasks: ${JSON.stringify(state.tasks)}

    For each task in the list, suggest 3-5 relevant SEO keywords and 2-3 trending hashtags.
    Return the result ONLY as a JSON array of objects:
    [{"id": "task_id", "keywords": ["..."], "hashtags": ["..."]}]
  `);

  // Clean the response (strip markdown if the LLM adds it)
  const cleanJson = (response.content as string).replace(/```json|```/g, '').trim();
  const seoData = JSON.parse(cleanJson);

  // 3. Map the SEO data back into our tasks
  const enrichedTasks = state.tasks.map((task) => {
    const optimization = seoData.find((o: any) => o.id === task.id);
    return {
      ...task,
      keywords: optimization?.keywords || [],
      hashtags: optimization?.hashtags || [],
    };
  });

  // 4. UPDATE DB: Save the enriched tasks to the JSON file
  if (campaignId) {
    console.log(`--- System: Saving SEO optimization to Campaign ${campaignId} ---`);
    await db.save('campaigns', campaignId, {
      id: campaignId,
      brandId: state.brandId,
      objective: state.objective,
      plan: state.plan,
      tasks: enrichedTasks,
    });
  }

  return { tasks: enrichedTasks };
};
