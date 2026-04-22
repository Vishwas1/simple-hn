/* eslint-disable @typescript-eslint/no-explicit-any */
import { interrupt } from '@langchain/langgraph';
import { CMOState } from '../state';
import { supabaseService } from '../../services/supabase';
import { RunnableConfig } from '@langchain/core/runnables';

export const humanReviewNode = async (state: typeof CMOState.State, config: RunnableConfig) => {
  console.log('--- System: Waiting for Human approval ---');
  const campaignId = config.configurable?.thread_id;

  // The execution pauses here.
  // When you resume via the API, the value passed to Command({ resume: ... })
  // becomes the return value of this interrupt function.
  const response = interrupt({
    message: 'The strategy is ready for your review.',
    plan: state.plan,
    posts: state.posts, // Good to show the human the tasks too!
  }) as { approved: boolean; feedback?: string };

  console.log('--- System: Received Human Input ---', response);
  let postsWithIds: any[] = [];

  if (response.approved) {
    if (campaignId) {
      console.log(`--- System: Saving Posts for Campaign ${campaignId} ---`);

      // Call the service with the strictly defined Request type
      const result = await supabaseService.saveCampaignPosts({
        campaign_id: campaignId,
        posts: state.posts.map((post) => ({
          phase: post.phase,
          platform: post.platform,
          angle: post.angle,
          direction: post.direction,
          post_date: new Date().toISOString(),
          scheduled_day: post.scheduled_day,
        })),
      });

      // Handle the specific SaveCampaignPostsResponse structure
      if (result.success) {
        postsWithIds = result.posts;
        console.log(`--- System: Successfully synced ${result.count} posts ---`);
      } else {
        console.error('--- Error: Failed to save posts to Supabase ---');
        // Fallback to existing state if DB sync fails (to keep graph moving)
        postsWithIds = state.posts;
      }
    }
  }

  // We return these to update the CMOState
  return {
    isApproved: response.approved === true,
    feedback: response.feedback || '',
    posts: postsWithIds,
  };
};
