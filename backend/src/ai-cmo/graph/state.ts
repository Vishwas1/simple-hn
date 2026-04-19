/* eslint-disable @typescript-eslint/no-explicit-any */
import { Annotation } from '@langchain/langgraph';

export const CMOState = Annotation.Root({
  brandId: Annotation<string>(),
  brandProfile: Annotation<any>(),
  objective: Annotation<string>(),
  // We keep 'plan' ONLY as the high-level summary for the Human to approve
  plan: Annotation<string>(),
  // 'tasks' is the actual "Job Queue"
  tasks: Annotation<
    {
      id: string;
      channel: string;
      instructions: string;
      audience: string;
      campaignId: string;
      status: 'pending' | 'processing' | 'completed';
      result?: string;
      createdAt: string;
      finishedAt: string;
      keywords?: string[]; // New Field
      hashtags?: string[]; // New Field
    }[]
  >(),
  feedback: Annotation<string>(),
  isApproved: Annotation<boolean>(),
});
