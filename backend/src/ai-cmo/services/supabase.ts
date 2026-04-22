import fetch from 'node-fetch';
import { env } from '../../config/env.js';

const DEFAULT_AI_CMO_SUPABASE_URL = 'https://hkrvsdkvwyggscwwdauj.supabase.co/functions/v1';

const AI_CMO_SUPABASE_URL = env.SUPABASE_AI_CMO_URL || DEFAULT_AI_CMO_SUPABASE_URL;

export type SaveBrandProfileRequest = {
  workspace_id?: string;
  website_url?: string;
  brand_name: string;
  inspiration?: string;
  problem?: string;
  solution?: string;
  differentiation?: string;
  core_values?: string[];
  target_audience?: string;
  vision?: string;
  tone_voice?: string;
  customer_feeling?: string;
  keywords?: string[];
  positioning_summary?: string;
};

export type BrandProfile = SaveBrandProfileRequest & {
  id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  website_url?: string | null;
};

export type GetBrandProfileQuery = {
  workspace_id: string;
  brand_name: string;
};

export type ListBrandProfilesQuery = {
  workspace_id?: string;
};

export type BrandListItem = {
  brand_name: string;
  workspace_id: string;
};

export type ListBrandProfilesResponse = {
  success: boolean;
  count: number;
  brands: BrandListItem[];
};

export type GetBrandProfileResponse = {
  success: boolean;
  data: BrandProfile;
};

export type CampaignRecord = {
  id: string;
  workspace_id: string;
  brand_name: string;
  goal: string;
  campaign_type:
    | 'product_launch'
    | 'thought_leadership'
    | 'demand_gen'
    | 'feature_release'
    | 'brand_building';
  launch_date: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

export type GetCampaignsRequest = {
  workspace_id: string;
  brand_name: string;
};

export type GetCampaignsResponse = {
  success: boolean;
  count: number;
  campaigns: CampaignRecord[];
};

export type GetCampaignRequest = {
  campaign_id: string;
};

export type GetCampaignResponse = {
  success?: boolean;
  campaign?: CampaignRecord;
};

export type CampaignPost = {
  id?: string;
  campaign_id: string;
  content_asset_id: string | null;
  phase: string;
  platform: string;
  angle: string;
  direction: string;
  post_date: string;
  scheduled_day: number;
  status: string;
  // [key: string]: unknown;
};

export type GetCampaignPostsRequest = {
  campaign_id: string;
};

export type GetCampaignPostsResponse = {
  success: boolean;
  count: number;
  posts: CampaignPost[];
};

export type SearchContentRequest = {
  query: string;
  match_count?: number;
  match_threshold?: number;
  brand_name?: string;
  content_type?: string;
  domain_context?: string;
  user_intent?: string;
};

export type SearchContentResult = {
  id: string;
  content_body?: string;
  brand_name?: string;
  content_type?: string;
  similarity?: number;
  final_score?: number;
  [key: string]: unknown;
};

export type SearchContentResponse = {
  success?: boolean;
  count?: number;
  results?: SearchContentResult[];
};

export type CreateCampaignRequest = {
  workspace_id?: string;
  brand_name: string;
  goal: string;
  campaign_type?:
    | 'product_launch'
    | 'thought_leadership'
    | 'demand_gen'
    | 'feature_release'
    | 'brand_building';
  launch_date?: string;
  icp?: string;
};

export type SaveCampaignPostsRequest = {
  campaign_id: string;
  posts: Array<{
    phase: string;
    platform: string;
    angle: string;
    direction: string;
    post_date: string;
    scheduled_day: number;
  }>;
};

export type SaveCampaignPostsResponse = {
  success: boolean;
  count: number;
  posts: Array<{
    id: string;
    phase: string;
    platform: string;
    angle: string;
    direction: string;
    post_date: string;
    scheduled_day: number;
  }>;
};

export type SaveContentRequest = {
  campaign_post_id: string;
  workspace_id: string;
  brand_name: string;
  content_type: 'blog' | 'linkedin' | 'twitter' | 'email';
  content_body: string;
  objective: string;
  tone: string;
};

export type SaveContentResponse = {
  success: boolean;
  content_id: string;
  campaign_post_id: string;
};

export type ScoreContentRequest = {
  items: Array<{
    content_id: string;
    score: number;
  }>;
};

export type CreateCampaignResponse = {
  success?: boolean;
  campaign?: CampaignRecord;
};

export class SupabaseEdgeFunctionError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'SupabaseEdgeFunctionError';
    this.status = status;
    this.details = details;
  }
}

function buildHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function buildUrl(pathname: string, query?: Record<string, string | number | undefined>) {
  const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const baseUrl = AI_CMO_SUPABASE_URL.endsWith('/')
    ? AI_CMO_SUPABASE_URL
    : `${AI_CMO_SUPABASE_URL}/`;
  const url = new URL(normalizedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseResponse<T>(response: Awaited<ReturnType<typeof fetch>>): Promise<T> {
  const rawText = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson && rawText ? (JSON.parse(rawText) as T) : ((rawText || null) as T);

  if (!response.ok) {
    throw new SupabaseEdgeFunctionError(
      `AI CMO Supabase request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload;
}

async function request<TResponse>(
  method: 'GET' | 'POST',
  pathname: string,
  options?: {
    body?: unknown;
    query?: Record<string, string | number | undefined>;
  },
): Promise<TResponse> {
  const response = await fetch(buildUrl(pathname, options?.query), {
    method,
    headers: buildHeaders(),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return parseResponse<TResponse>(response);
}

export const supabaseService = {
  // Save a brand
  async saveBrandProfile(payload: SaveBrandProfileRequest) {
    return request<unknown>('POST', '/save-brand-profile', { body: payload });
  },

  // Get a brand
  async getBrandProfile(query: GetBrandProfileQuery) {
    return request<GetBrandProfileResponse>('GET', '/get-brand-profile', { query });
  },

  // List all brands
  async listBrandProfiles(query: ListBrandProfilesQuery = {}) {
    return request<ListBrandProfilesResponse>('GET', '/list-brand-profiles', { query });
  },

  // Get list of campaigns
  async getCampaigns(payload: GetCampaignsRequest) {
    return request<GetCampaignsResponse>('POST', '/get-campaigns', { body: payload });
  },

  // Get a campain
  async getCampaign(payload: GetCampaignRequest) {
    return request<GetCampaignResponse>('POST', '/get-campaign', { body: payload });
  },

  // Fetch list of posts for a campaign
  async getCampaignPosts(payload: GetCampaignPostsRequest) {
    return request<GetCampaignPostsResponse>('POST', '/get-posts-by-campaign', { body: payload });
  },

  // Create new campaign
  async createCampaign(payload: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    return request<CreateCampaignResponse>('POST', '/create-campaign', { body: payload });
  },

  // Save content for each posts for a campaign
  async saveContent(payload: SaveContentRequest) {
    return request<SaveContentResponse>('POST', '/save-content', { body: payload });
  },

  // Save campaing posts in vector db
  async saveCampaignPosts(payload: SaveCampaignPostsRequest) {
    return request<SaveCampaignPostsResponse>('POST', '/save-campaign-posts-bulk', {
      body: payload,
    });
  },

  // Evaluate the content give score
  async scoreContent(payload: ScoreContentRequest) {
    return request<unknown>('POST', '/score-content', { body: payload });
  },

  // Search old contents with context
  // these old content are later sent to writer agent while writing new content
  // so that it does not repeat
  async searchContent(payload: SearchContentRequest) {
    return request<SearchContentResponse>('POST', '/search-content', { body: payload });
  },
};
