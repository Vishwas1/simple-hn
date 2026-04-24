/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, Router } from 'express';
import { cmoGraph } from '../graph';
import { Command } from '@langchain/langgraph';
import {
  CampaignRecord,
  // CampaignPost,
  CreateCampaignResponse,
  GetCampaignResponse,
  GetCampaignPostsResponse,
  GetCampaignsResponse,
  supabaseService,
} from '../services/supabase';

export const campaignRouter = Router();

type ErrorResponse = {
  error: string;
};

type GetCampaignPostContentStatusResponse = {
  success: boolean;
  campaign_id: string;
  campaign_post_id: string;
  source: 'database' | 'state';
  content_status: string;
  content_asset_id: string | null;
  content_type?: string;
  content_body?: string;
  generated_at?: string;
  keywords?: string[];
  hashtags?: string[];
};

type ListCampaignsQuery = {
  workspace_id?: string;
  brand_name?: string;
};

function buildPostsResponseFromState(campaignId: string, posts: Array<Record<string, unknown>>) {
  const normalizedPosts: any[] = posts.map((post) => ({
    id: typeof post.id === 'string' ? post.id : null,
    campaign_id: campaignId,
    content_asset_id:
      typeof post.content_asset_id === 'string' || post.content_asset_id === null
        ? (post.content_asset_id as string | null)
        : null,
    phase: String(post.phase ?? ''),
    platform: String(post.platform ?? ''),
    angle: String(post.angle ?? ''),
    direction: String(post.direction ?? ''),
    post_date: String(post.post_date ?? ''),
    scheduled_day: typeof post.scheduled_day === 'number' ? post.scheduled_day : 0,
    status: typeof post.status === 'string' ? post.status : 'draft',
  }));

  return {
    success: true,
    count: normalizedPosts.length,
    posts: normalizedPosts,
  } satisfies GetCampaignPostsResponse;
}

function buildCampaignResponseFromState(
  campaignId: string,
  stateValues: Record<string, unknown>,
): GetCampaignResponse {
  const campaign: CampaignRecord = {
    id: campaignId,
    workspace_id: typeof stateValues.workspace_id === 'string' ? stateValues.workspace_id : '',
    brand_name: typeof stateValues.brand_name === 'string' ? stateValues.brand_name : '',
    goal: typeof stateValues.objective === 'string' ? stateValues.objective : '',
    campaign_type: 'product_launch',
    launch_date: '',
    status:
      typeof stateValues.isApproved === 'boolean'
        ? stateValues.isApproved
          ? 'EXECUTING'
          : 'PENDING_APPROVAL'
        : 'PENDING_APPROVAL',
    created_at: '',
  };

  return {
    success: true,
    campaign,
  };
}

function buildContentStatusResponseFromState(
  campaignId: string,
  postId: string,
  content: Record<string, unknown>,
): GetCampaignPostContentStatusResponse {
  return {
    success: true,
    campaign_id: campaignId,
    campaign_post_id: postId,
    source: 'state',
    content_status: typeof content.status === 'string' ? content.status : 'pending',
    content_asset_id: null,
    content_type: typeof content.content_type === 'string' ? content.content_type : undefined,
    content_body: typeof content.content_body === 'string' ? content.content_body : undefined,
    generated_at: typeof content.generated_at === 'string' ? content.generated_at : undefined,
    keywords: Array.isArray(content.keywords)
      ? content.keywords.filter((value): value is string => typeof value === 'string')
      : undefined,
    hashtags: Array.isArray(content.hashtags)
      ? content.hashtags.filter((value): value is string => typeof value === 'string')
      : undefined,
  };
}

/**
 * GET /campaign
 * Returns campaigns for a workspace and brand
 */
campaignRouter.get(
  '/',
  async (
    req: Request<
      Record<string, never>,
      GetCampaignsResponse | ErrorResponse,
      never,
      ListCampaignsQuery
    >,
    res: Response<GetCampaignsResponse | ErrorResponse>,
  ) => {
    try {
      const workspace_id =
        typeof req.query.workspace_id === 'string' ? req.query.workspace_id.trim() : '';
      const brand_name =
        typeof req.query.brand_name === 'string' ? req.query.brand_name.trim() : '';

      if (!workspace_id || !brand_name) {
        return res.status(400).json({
          error: 'workspace_id and brand_name query params are required',
        });
      }

      const campaigns = await supabaseService.getCampaigns({
        workspace_id,
        brand_name,
      });

      return res.json(campaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return res.status(500).json({ error: 'Could not retrieve campaigns' });
    }
  },
);

/**
 * GET /campaign/:id
 * Returns a single campaign. Prefer database, then fall back to graph state.
 */
campaignRouter.get(
  '/:id',
  async (
    req: Request<{ id: string }, GetCampaignResponse | ErrorResponse>,
    res: Response<GetCampaignResponse | ErrorResponse>,
  ) => {
    try {
      const campaignId = req.params.id;

      const campaignResponse = await supabaseService.getCampaign({
        campaign_id: campaignId,
      });

      if (campaignResponse?.campaign) {
        return res.json(campaignResponse);
      }

      const graphState = await cmoGraph.getState({
        configurable: { thread_id: campaignId },
      });

      const stateValues = graphState?.values;

      if (stateValues && typeof stateValues === 'object') {
        return res.json(
          buildCampaignResponseFromState(campaignId, stateValues as Record<string, unknown>),
        );
      }

      return res.status(404).json({ error: 'Campaign not found' });
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      return res.status(500).json({ error: 'Could not retrieve campaign' });
    }
  },
);

/**
 * 1. START THE CAMPAIGN
 * This triggers the Strategist and pauses at the Human Review.
 */
campaignRouter.post('/', async (req, res) => {
  const { workspace_id, brand_name, objective } = req.body;

  // const brand = await db.get('brands', brandId);
  // const brand = await supabaseService.getBrandProfile({
  //   workspace_id,
  //   brand_name,
  // });
  // if (!brand) return res.status(404).json({ error: 'Brand not found' });

  // Save the initial strategy and generated task list to JSON
  const createCampaingResponse: CreateCampaignResponse = await supabaseService.createCampaign({
    workspace_id,
    brand_name,
    goal: objective,
    campaign_type: 'product_launch', // later remove hardcoding
    launch_date: '2026-04-30', // remove hardcoding later
  });

  if (!createCampaingResponse) {
    return res.status(500).json({ error: 'Could not create campaign' });
  }

  const campaignId = createCampaingResponse.campaign?.id;

  if (!campaignId) {
    return res.status(500).json({ error: 'Could not create campaign' });
  }

  // Run graph until the 'interrupt' in humanReviewNode
  const initialState = {
    workspace_id,
    brand_name,
    // brandProfile: brand,
    objective,
    plan: '',
    posts: [],
    isApproved: false,
  };

  const finalState = await cmoGraph.invoke(initialState, {
    configurable: { thread_id: campaignId },
  });

  ///// we will store it when human approves it.
  // await supabaseService.saveCampaignPosts({
  //   campaign_id: campaignId,
  //   posts: finalState.posts,
  // });

  // await db.save('campaigns', campaignId, {
  //   id: campaignId,
  //   brandId,
  //   objective,
  //   plan: finalState.plan,
  //   tasks: finalState.tasks,
  //   status: 'PENDING_APPROVAL',
  // });

  res.json({ campaignId, plan: finalState.plan, posts: finalState.posts });
});

/**
 * GET /campaign/:id/posts
 * Returns posts for a campaign. Prefer database, then fall back to graph state.
 */
campaignRouter.get(
  '/:id/posts',
  async (
    req: Request<{ id: string }, GetCampaignPostsResponse | ErrorResponse>,
    res: Response<GetCampaignPostsResponse | ErrorResponse>,
  ) => {
    try {
      const campaignId = req.params.id;

      const posts = await supabaseService.getCampaignPosts({
        campaign_id: campaignId,
      });

      if (posts?.posts && posts.posts.length > 0) {
        return res.json(posts);
      }

      const graphState = await cmoGraph.getState({
        configurable: { thread_id: campaignId },
      });

      const statePosts = graphState?.values?.posts;

      if (Array.isArray(statePosts) && statePosts.length > 0) {
        return res.json(
          buildPostsResponseFromState(campaignId, statePosts as Array<Record<string, unknown>>),
        );
      }

      return res.status(404).json({ error: 'No posts found for campaign ' + campaignId });
    } catch (error) {
      console.error('Failed to fetch campaign posts:', error);
      return res.status(500).json({ error: 'Could not retrieve campaign posts' });
    }
  },
);

/**
 * GET /campaign/:id/posts/:postId
 * Returns content generation status for a campaign post.
 * Prefer database-backed post status, then fall back to graph state contents.
 */
campaignRouter.get(
  '/:id/posts/:postId/contents',
  async (
    req: Request<
      { id: string; postId: string },
      GetCampaignPostContentStatusResponse | ErrorResponse
    >,
    res: Response<GetCampaignPostContentStatusResponse | ErrorResponse>,
  ) => {
    try {
      const campaignId = req.params.id;
      const postId = req.params.postId;

      // const postsResponse = await supabaseService.getCampaignPosts({
      //   campaign_id: campaignId,
      // });

      // const matchedPost = postsResponse?.posts?.find((post) => post.id === postId);

      // if (matchedPost) {
      //   return res.json({
      //     success: true,
      //     campaign_id: campaignId,
      //     campaign_post_id: postId,
      //     source: 'database',
      //     content_status: matchedPost.status,
      //     content_asset_id: matchedPost.content_asset_id,
      //   });
      // }

      const graphState = await cmoGraph.getState({
        configurable: { thread_id: campaignId },
      });

      const stateContents = graphState?.values?.contents;

      if (Array.isArray(stateContents)) {
        const matchedContent = stateContents.find(
          (content) =>
            content &&
            typeof content === 'object' &&
            'campaign_post_id' in content &&
            content.campaign_post_id === postId,
        );

        if (matchedContent && typeof matchedContent === 'object') {
          return res.json(
            buildContentStatusResponseFromState(
              campaignId,
              postId,
              matchedContent as Record<string, unknown>,
            ),
          );
        }
      }

      return res
        .status(404)
        .json({ error: 'Content status not found for campaign post ' + postId });
    } catch (error) {
      console.error('Failed to fetch content status for campaign post:', error);
      return res.status(500).json({ error: 'Could not retrieve content status' });
    }
  },
);

/**
 * 3. APPROVE & EXECUTE
 * This resumes the graph. The Writer will start picking up tasks.
 */
campaignRouter.post('/:id/approve', async (req, res) => {
  const { approved, feedback } = req.body;
  const campaignId = req.params.id;

  // Resume the graph with the Human's decision
  cmoGraph.invoke(new Command({ resume: { approved, feedback } }), {
    configurable: { thread_id: campaignId },
  });

  // if (finalState.isApproved) {
  // }
  // Update our JSON file with the current progress
  // const currentData = await db.get('campaigns', campaignId);

  // await db.save('campaigns', campaignId, {
  //   ...currentData,
  //   plan: finalState.plan, // might have changed if feedback was given
  //   posts: finalState.posts,
  //   status: approved ? 'EXECUTING' : 'REVISING',
  // });

  res.json({ message: 'Process resumed', status: approved ? 'EXECUTING' : 'REVISING' });
});
