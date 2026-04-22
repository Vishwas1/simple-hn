export type BrandListItem = {
  brand_name: string;
  workspace_id: string;
};

export type BrandSelection = {
  brand_name: string;
  workspace_id: string;
};

export type BrandProfile = {
  brand_name: string;
  workspace_id?: string;
  website_url?: string | null;
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
  campaign_type: string;
  launch_date: string;
  status: string;
  created_at: string;
};

export type GetCampaignsResponse = {
  success: boolean;
  count: number;
  campaigns: CampaignRecord[];
};

export type CampaignPost = {
  id: string;
  campaign_id: string;
  phase: string;
  platform: string;
  angle: string;
  direction: string;
  post_date: string;
  scheduled_day: number;
  status: string;
  content_asset_id: string | null;
};

export type GetCampaignPostsResponse = {
  success: boolean;
  count: number;
  posts: CampaignPost[];
};

export type CreateCampaignResponse = {
  campaignId: string;
  plan: string;
  posts: CampaignPost[];
};

export type CampaignApprovalResponse = {
  message: string;
  status: string;
};
