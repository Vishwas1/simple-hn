/* eslint-disable @typescript-eslint/no-explicit-any */
// import { RunnableConfig } from '@langchain/core/runnables';
import { supabaseService } from '../../services/supabase';
import { llm } from '../llm';
import { CMOState } from '../state';
// import { supabaseService } from '../../services/supabase';

export const seoNode = async (state: typeof CMOState.State) => {
  console.log('--- Agent: SEO Specialist generating metadata ---');
  // const campaignId = config.configurable?.thread_id;

  // 2. SYNC POSTS WITH SUPABASE
  // let postsWithIds: any[] = [];

  // if (campaignId) {
  //   console.log(`--- System: Saving Posts for Campaign ${campaignId} ---`);

  //   // Call the service with the strictly defined Request type
  //   const result = await supabaseService.saveCampaignPosts({
  //     campaign_id: campaignId,
  //     posts: state.posts.map((post) => ({
  //       phase: post.phase,
  //       platform: post.platform,
  //       angle: post.angle,
  //       direction: post.direction,
  //       post_date: post.post_date,
  //       scheduled_day: post.scheduled_day,
  //     })),
  //   });

  //   // Handle the specific SaveCampaignPostsResponse structure
  //   if (result.success) {
  //     postsWithIds = result.posts;
  //     console.log(`--- System: Successfully synced ${result.count} posts ---`);
  //   } else {
  //     console.error('--- Error: Failed to save posts to Supabase ---');
  //     // Fallback to existing state if DB sync fails (to keep graph moving)
  //     postsWithIds = state.posts;
  //   }
  // }

  const brand = await supabaseService.getBrandProfile({
    workspace_id: state.workspace_id,
    brand_name: state.brand_name,
  });

  // 1. LLM generates SEO metadata
  const response = await llm.invoke(`
    You are an SEO Analyst for ${state.brand_name}.
    Objective: ${state.objective}
    Post Ideas: ${JSON.stringify(state.posts)}

    TASK: Suggest keywords, hashtags, and a specific content_type for each post.
    Return ONLY a JSON array:
    [{"content_type": "...", "keywords": ["..."], "hashtags": ["..."]}]
  `);

  const cleanJson = (response.content as string).replace(/```json|```/g, '').trim();
  const seoData = JSON.parse(cleanJson);

  // 3. GENERATE CONTENTS ARRAY (State Only)
  // Map keywords to the 'id' field returned in the Response
  const generatedContents = state.posts.map((post: any, index: number) => {
    const seo = seoData[index] || {};

    return {
      campaign_post_id: post.id, // Using 'id' from SaveCampaignPostsResponse.posts
      workspace_id: state.workspace_id,
      brand_name: state.brand_name,
      content_type: seo.content_type || post.platform,
      content_body: '',
      objective: state.objective,
      tone: brand.data.tone_voice || 'Professional',
      status: 'pending' as const,
      keywords: seo.keywords || [],
      hashtags: seo.hashtags || [],
    };
  });

  // 4. Return updated state to the Graph
  return {
    // posts: postsWithIds,
    contents: generatedContents,
  };
};
