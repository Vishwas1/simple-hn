/* eslint-disable @typescript-eslint/no-explicit-any */
import { llm } from '../llm';
import { CMOState } from '../state';
import { supabaseService } from '../../services/supabase';

export const writerNode = async (state: typeof CMOState.State) => {
  // 1. Identify the next piece of work
  const contentIdx = state.contents.findIndex((c) => c.status === 'pending');

  // If no more pending content, the loop in the StateGraph will end
  if (contentIdx === -1) {
    console.log('--- System: All tasks finished ---');
    return {};
  }

  const currentContent = state.contents[contentIdx];
  console.log(`--- Agent: Writing ${currentContent.content_type} ---`);

  // 2. Generate the Content using LLM
  // We include keywords and hashtags to ensure the SEO strategy is followed
  const response = await llm.invoke(`
    You are a professional content creator for ${state.brand_name}.
    
    Task: Write a ${currentContent.content_type}
    Objective: ${currentContent.objective}
    Tone: ${currentContent.tone}
    Keywords: ${currentContent.keywords?.join(', ')}
    Hashtags: ${currentContent.hashtags?.join(' ')}

    Return only the final content body.
  `);

  const generatedBody = response.content as string;

  // 3. PERSIST TO DB: Using your saveContent service
  // We map state fields to your SaveContentRequest type
  try {
    console.log(
      `--- System: Persisting content to Supabase for Post ${currentContent.campaign_post_id} ---`,
    );

    const dbResponse = await supabaseService.saveContent({
      campaign_post_id: currentContent.campaign_post_id,
      workspace_id: state.workspace_id,
      brand_name: state.brand_name,
      // Mapping to your allowed 'content_type' literals
      content_type: currentContent.content_type.toLowerCase().includes('twitter')
        ? 'twitter'
        : (currentContent.content_type.toLowerCase() as any),
      content_body: generatedBody,
      objective: currentContent.objective,
      tone: currentContent.tone,
    });

    if (dbResponse.success) {
      console.log(`--- System: Content saved successfully. ID: ${dbResponse.content_id} ---`);
    }
  } catch (error) {
    console.error('--- Error: Failed to save content to database ---', error);
    // Even if DB fails, we update state to prevent an infinite loop
  }

  // 4. Update local state to mark as completed
  const updatedContents = [...state.contents];
  updatedContents[contentIdx] = {
    ...currentContent,
    status: 'completed',
    content_body: generatedBody,
    generated_at: new Date().toISOString(),
  };

  return { contents: updatedContents };
};
