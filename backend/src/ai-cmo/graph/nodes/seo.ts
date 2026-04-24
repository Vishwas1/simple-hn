/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseService } from '../../services/supabase';
import { llm } from '../llm';
import { CMOState } from '../state';

export const seoNode = async (state: typeof CMOState.State) => {
  console.log('--- Agent: SEO Specialist generating metadata ---');
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
