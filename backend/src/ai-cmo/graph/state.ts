/* eslint-disable @typescript-eslint/no-explicit-any */
import { Annotation } from '@langchain/langgraph';

export const CMOState = Annotation.Root({
  workspace_id: Annotation<string>(),
  brand_name: Annotation<string>(),
  // brandProfile: Annotation<any>(),
  objective: Annotation<string>(), // lets have dinner tonight!
  plan: Annotation<string>(),

  // The Post "Idea" or "Task"
  posts: Annotation<
    {
      id?: string; // campaign_post_id
      phase: string;
      platform: string;
      angle: string;
      direction: string;
      post_date: string;
      scheduled_day: number;
    }[]
  >({
    reducer: (oldValue, newValue) => newValue, // Overwrite state with latest updates
  }),
  contents: Annotation<
    {
      content_type: string;
      content_body: string; // The Writer fills this
      generated_at?: string;
      status: 'pending' | 'processing' | 'completed'; // Track each piece
      keywords?: string[];
      hashtags?: string[];
      tone: string;
      objective: string;
      campaign_post_id: string;
    }[]
  >({
    reducer: (oldValue, newValue) => newValue, // Overwrite state with latest updates
  }),
  feedback: Annotation<string>(),
  isApproved: Annotation<boolean>(),
});
