/* eslint-disable @typescript-eslint/no-explicit-any */

import { llm } from '../llm';
import { CMOState } from '../state';

export const strategistNode = async (state: typeof CMOState.State) => {
  console.log('--- Agent: Strategist is Media Planning & Task Generation ---');

  const instruction = state.feedback
    ? `The user rejected the previous plan. Feedback: "${state.feedback}". Original: "${state.plan}"`
    : `Create a strategy for: "${state.objective}"`;

  const response = await llm.invoke(`
    You are the Lead Marketing Strategist for ${state.brandProfile.name}.
    Vision: ${state.brandProfile.profile.vision}
    Tone: ${state.brandProfile.profile.tone}
    
    ${instruction}

    TASK:
    1. Define a multi-channel strategy (Channels, Audience, Goals).
    2. Break this strategy down into a JSON list of specific content tasks.

    JSON FORMAT FOR TASKS (at the end of your response):
    [
      {"id": "1", "channel": "LinkedIn", "instructions": "Write a post about...", "audience": "CTOs"},
      {"id": "2", "channel": "X", "instructions": "Write a punchy tweet about...", "audience": "Devs"}
    ]

    Return a human-readable summary followed by the JSON array.`);

  // --- Helper to separate text from JSON ---
  const content = response.content as string;
  const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/); // Find the JSON array
  const planText = jsonMatch ? content.split(jsonMatch[0])[0].trim() : content;

  let taskList = [];
  if (jsonMatch) {
    try {
      taskList = JSON.parse(jsonMatch[0]).map((task: any) => ({
        ...task,
        status: 'pending', // Initialize all tasks as pending
        result: null,
        createdAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to parse tasks JSON', e);
    }
  }

  return {
    plan: planText, // This goes to the human for approval
    tasks: taskList, // This is the queue for the Writer agent
    isApproved: false,
    feedback: '',
  };
};
