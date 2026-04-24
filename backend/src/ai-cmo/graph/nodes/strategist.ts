/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseService } from '../../services/supabase';
import { llm } from '../llm';
import { CMOState } from '../state';
export const strategistNode = async (state: typeof CMOState.State) => {
  console.log('--- Agent: Strategist is generating Campaign Posts ---');

  const instruction = state.feedback
    ? `The user rejected the previous plan. Feedback: "${state.feedback}". Original: "${state.plan}"`
    : `Create a multi-phase strategy for: "${state.objective}"`;

  const brand = await supabaseService.getBrandProfile({
    workspace_id: state.workspace_id,
    brand_name: state.brand_name,
  });

  const response = await llm.invoke(`
    You are a Brand Strategist with 10+ years of B2B marketing leadership for ${state.brand_name}.
    Vision: ${brand.data.vision}
    Tone: ${brand.data.tone_voice}
    
    ${instruction}

    TASK:
    1. Define a high-level strategic plan.
    2. Breakdown the plan into a sequence of "Posts". 

    JSON STRUCTURE FOR POSTS:
    {
      "phase": "Awareness | Consideration | Conversion",
      "platform": "LinkedIn | X | Blog",
      "angle": "The hook or perspective of the post",
      "direction": "Detailed instructions for the writer on what to cover",
      "post_date": "YYYY-MM-DD",
      "scheduled_day": 1
    }

    Return a human-readable summary followed by the JSON array of posts. 
    Ensure the JSON matches this key format:
    [
      {
        "phase": "...",
        "platform": "...",
        "angle": "...",
        "direction": "...",
        "post_date": "...",
        "scheduled_day": 1,
      }
    ]
      
    
    ## CAMPAIGN STRUCTURES

    ### PRODUCT LAUNCH
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | warm | -7 | linkedin | problem |
    | warm | -3 | twitter | contrarian |
    | launch | 0 | linkedin | announcement |
    | amplify | +3 | twitter | proof |

    ### FEATURE RELEASE
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | announce | 0 | linkedin | feature |
    | explain | +2 | twitter | use_case |

    ### DEMAND GEN
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | awareness | -14 | linkedin | problem |
    | consideration | -7 | twitter | solution |
    | conversion | 0 | linkedin | cta |

    ### THOUGHT LEADERSHIP
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | insight | 0 | linkedin | insight |
    | expand | +3 | twitter | contrarian |
    | depth | +7 | linkedin | breakdown |

    ### BRAND BUILDING
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | story | 0 | linkedin | story |
    | belief | +5 | linkedin | belief |

    ### WEBSITE TRAFFIC
    | Phase | Scheduled Day | Platform | Angle |
    |-------|--------------|----------|-------|
    | awareness | -7 | linkedin | problem |
    | traffic | 0 | linkedin | cta |
    | amplify | +3 | twitter | proof |
    | seo | +3 | landing page | belief |

    ## DIRECTION QUALITY RULES

    Audience:
    - Must include role + company type + industry

    Pain:
    - Must be operational and measurable

    Why:
    - Must explain systemic cause

    Impact:
    - Must show business consequence

    Shift:
    - Must introduce new thinking

    Product context:
    - Must tie directly to solution
    `);

  const content = response.content as string;
  const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
  const planText = jsonMatch ? content.split(jsonMatch[0])[0].trim() : content;

  let postsList = [];
  if (jsonMatch) {
    try {
      // Parse and ensure 'contents' is initialized as an empty array
      postsList = JSON.parse(jsonMatch[0]).map((post: any) => ({
        ...post,
      }));
    } catch (e) {
      console.error('Failed to parse posts JSON', e);
    }
  }

  return {
    plan: planText,
    posts: postsList,
    isApproved: false,
    feedback: '',
  };
};
