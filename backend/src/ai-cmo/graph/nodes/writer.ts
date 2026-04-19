/* eslint-disable @typescript-eslint/no-explicit-any */
import { llm } from '../llm';
import { CMOState } from '../state';
import { db } from '../../services/db';
import { RunnableConfig } from '@langchain/core/runnables';

export const writerNode = async (state: typeof CMOState.State, config: RunnableConfig) => {
  // 0. Extract the Campaign ID (thread_id) from the config
  const campaignId = config.configurable?.thread_id;

  // 1. Find the first task that is still 'pending'
  const taskIndex = state.tasks.findIndex((t) => t.status === 'pending');

  // Safety check: if no tasks are pending, just return
  if (taskIndex === -1) {
    console.log('--- Agent: No pending tasks found ---');
    await db.save('campaigns', campaignId, {
      id: campaignId,
      brandId: state.brandId,
      objective: state.objective,
      plan: state.plan,
      tasks: state.tasks,
      status: 'COMPLETED',
    });

    return {};
  }

  const currentTask = state.tasks[taskIndex];
  console.log(`--- Agent: Writer picking up Task #${currentTask.id} [${currentTask.channel}] ---`);

  // 2. Prepare the task list update for the 'processing' state
  // We create a copy to maintain immutability
  const processingTasks = [...state.tasks];
  processingTasks[taskIndex] = { ...currentTask, status: 'processing' };

  // --- Optional: Save to DB immediately to show 'processing' status in UI ---
  if (campaignId) {
    await db.save('campaigns', campaignId, {
      id: campaignId,
      brandId: state.brandId,
      objective: state.objective,
      plan: state.plan,
      tasks: processingTasks,
    });
  }

  // 3. Execute the writing task
  const response = await llm.invoke(`
    Role: Expert Content Writer for ${state.brandProfile.name}.
    Channel: ${currentTask.channel}
    Target Audience: ${currentTask.audience}
    Task Instructions: ${currentTask.instructions}
    SEO keywords to include: ${currentTask.keywords?.join(', ')}
    Hashtags to include: ${currentTask.hashtags?.join(' ')}
    Brand Voice & Tone: ${state.brandProfile.profile.tone}
    Brand Vision: ${state.brandProfile.profile.vision}

    Write the high-quality content for this specific channel. 
    Focus only on the text for this specific task.
    Ensure the content naturally integrates the keywords and ends with the hashtags.`);

  // 4. Mark as 'completed' and save the result
  const finalTasks = [...processingTasks];
  finalTasks[taskIndex] = {
    ...finalTasks[taskIndex],
    status: 'completed',
    result: response.content as string,
    finishedAt: new Date().toISOString(),
  };

  console.log(`--- Agent: Task #${currentTask.id} Completed ---`);

  // 5. UPDATE DB: Final save for this specific task
  if (campaignId) {
    await db.save('campaigns', campaignId, {
      id: campaignId,
      brandId: state.brandId,
      objective: state.objective,
      plan: state.plan,
      tasks: finalTasks,
    });
  }

  return {
    tasks: finalTasks,
  };
};
