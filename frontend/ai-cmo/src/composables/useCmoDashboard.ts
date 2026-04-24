import { computed, onMounted, reactive, ref, watch } from 'vue';
import type {
  BrandListItem,
  BrandProfile,
  BrandSelection,
  CampaignApprovalResponse,
  CampaignPost,
  CampaignRecord,
  CreateCampaignResponse,
  GetBrandProfileResponse,
  GetCampaignPostsResponse,
  GetCampaignsResponse,
  ListBrandProfilesResponse,
} from '../types/api';

type DashboardSection = 'home' | 'campaigns' | 'contents';

type CampaignReview = {
  campaignId: string;
  plan: string;
  posts: CampaignPost[];
};

type GenerationPreview = {
  objective: string;
  brandName: string;
};

type PostContentStatus = {
  success?: boolean;
  campaign_id?: string;
  campaign_post_id?: string;
  source?: 'database' | 'state';
  content_status?: string;
  content_asset_id?: string | null;
  content_type?: string;
  content_body?: string | null;
  generated_at?: string | null;
  keywords?: string[] | null;
  hashtags?: string[] | null;
  [key: string]: unknown;
};

type PollState = {
  startedAt: number;
  timedOut: boolean;
  error: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002/api/v1/cmo';
const DEFAULT_WORKSPACE_ID = import.meta.env.VITE_DEFAULT_WORKSPACE_ID ?? '';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while loading the dashboard.';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function useCmoDashboard() {
  const loadingBrands = ref(false);
  const loadingDashboard = ref(false);
  const submitting = ref(false);
  const error = ref('');
  const successMessage = ref('');

  const brands = ref<BrandListItem[]>([]);
  const selectedWorkspaceId = ref('');
  const brandProfile = ref<BrandProfile | null>(null);
  const campaigns = ref<CampaignRecord[]>([]);
  const selectedCampaignId = ref('');
  const contentCampaignFilter = ref('all');
  const postsByCampaignId = ref<Record<string, CampaignPost[]>>({});
  const contentsByCampaignId = ref<Record<string, Record<string, PostContentStatus>>>({});
  const selectedBrand = ref<BrandSelection | null>(null);
  const activeSection = ref<DashboardSection>('home');
  const isLeftNavExpanded = ref(true);
  const isCreateCampaignOpen = ref(false);
  const isGeneratingCampaign = ref(false);
  const generationPreview = ref<GenerationPreview | null>(null);
  const campaignReview = ref<CampaignReview | null>(null);
  const approvedCampaignId = ref('');
  const postContents = ref<Record<string, PostContentStatus>>({});
  const postPollingTimers = new Map<string, ReturnType<typeof setInterval>>();
  const postPollingStates = ref<Record<string, PollState>>({});
  const campaignForm = reactive({
    objective: 'Launch a lightweight AI CMO dashboard and publish a week of awareness content.',
  });

  const reviewForm = reactive({
    feedback: '',
  });

  const selectedCampaign = computed(
    () => campaigns.value.find((campaign) => campaign.id === selectedCampaignId.value) || null,
  );

  const posts = computed(() => postsByCampaignId.value[selectedCampaignId.value] || []);

  const workspaceOptions = computed(() =>
    Array.from(new Set(brands.value.map((brand) => brand.workspace_id))).sort((left, right) =>
      left.localeCompare(right),
    ),
  );

  const filteredBrands = computed(() =>
    brands.value
      .filter((brand) => brand.workspace_id === selectedWorkspaceId.value)
      .sort((left, right) => left.brand_name.localeCompare(right.brand_name)),
  );

  const dashboardStats = computed(() => {
    const allPosts = Object.values(postsByCampaignId.value).flat();
    const scheduledPosts = allPosts.filter((post) => post.status !== 'draft').length;

    return [
      { label: 'Brands', value: String(brands.value.length) },
      { label: 'Campaigns', value: String(campaigns.value.length) },
      { label: 'Planned Posts', value: String(allPosts.length) },
      { label: 'Scheduled', value: String(scheduledPosts) },
    ];
  });

  const contentItems = computed(() => {
    const sourcePosts =
      contentCampaignFilter.value === 'all'
        ? Object.values(postsByCampaignId.value).flat()
        : postsByCampaignId.value[contentCampaignFilter.value] || [];
    const sourceContents =
      contentCampaignFilter.value === 'all'
        ? Object.values(contentsByCampaignId.value).flatMap((campaignContents) =>
            Object.values(campaignContents),
          )
        : Object.values(contentsByCampaignId.value[contentCampaignFilter.value] || {});

    const contentByPostId = new Map(
      sourceContents
        .filter((content): content is PostContentStatus & { campaign_post_id: string } =>
          typeof content.campaign_post_id === 'string' && content.campaign_post_id.length > 0,
        )
        .map((content) => [content.campaign_post_id, content] as const),
    );

    return sourcePosts.map((post) => {
      const content = post.id ? contentByPostId.get(post.id) : undefined;

      return {
        id: post.id,
        title: post.angle,
        description: post.direction,
        platform: post.platform,
        phase: post.phase,
        status: post.status,
        postDate: post.post_date,
        campaignId: post.campaign_id,
        contentBody: content?.content_body || '',
        generatedAt: content?.generated_at || '',
        keywords: content?.keywords || [],
        hashtags: content?.hashtags || [],
        contentStatus: content?.content_status || 'pending',
      };
    });
  });

  const selectedBrandKey = computed(() =>
    selectedBrand.value
      ? `${selectedBrand.value.workspace_id}::${selectedBrand.value.brand_name}`
      : '',
  );

  async function loadBrands() {
    loadingBrands.value = true;

    try {
      const query = new URLSearchParams();
      if (DEFAULT_WORKSPACE_ID.trim()) {
        query.set('workspace_id', DEFAULT_WORKSPACE_ID.trim());
      }

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await request<ListBrandProfilesResponse>(`/brands${suffix}`);
      brands.value = response.brands || [];

      const availableWorkspaces = Array.from(
        new Set((response.brands || []).map((brand) => brand.workspace_id)),
      ).sort((left, right) => left.localeCompare(right));

      if (availableWorkspaces.length === 0) {
        selectedWorkspaceId.value = '';
      } else if (
        DEFAULT_WORKSPACE_ID.trim() &&
        availableWorkspaces.includes(DEFAULT_WORKSPACE_ID.trim())
      ) {
        selectedWorkspaceId.value = DEFAULT_WORKSPACE_ID.trim();
      } else if (!availableWorkspaces.includes(selectedWorkspaceId.value)) {
        selectedWorkspaceId.value = availableWorkspaces[0];
      }
    } finally {
      loadingBrands.value = false;
    }
  }

  async function loadBrandProfile() {
    if (!selectedBrand.value?.workspace_id || !selectedBrand.value?.brand_name) {
      brandProfile.value = null;
      return;
    }

    const query = new URLSearchParams({
      workspace_id: selectedBrand.value.workspace_id,
      brand_name: selectedBrand.value.brand_name,
    });

    const response = await request<GetBrandProfileResponse>(`/brands/profile?${query.toString()}`);
    brandProfile.value = response.data;
  }

  async function loadCampaigns() {
    if (!selectedBrand.value?.workspace_id || !selectedBrand.value?.brand_name) {
      campaigns.value = [];
      return;
    }

    const query = new URLSearchParams({
      workspace_id: selectedBrand.value.workspace_id,
      brand_name: selectedBrand.value.brand_name,
    });

    const response = await request<GetCampaignsResponse>(`/campaign?${query.toString()}`);
    campaigns.value = response.campaigns || [];

    if (!campaigns.value.some((campaign) => campaign.id === selectedCampaignId.value)) {
      selectedCampaignId.value = campaigns.value[0]?.id || '';
    }
  }

  async function loadPosts(campaignId = selectedCampaignId.value) {
    if (!campaignId) {
      return [];
    }

    const response = await request<GetCampaignPostsResponse>(`/campaign/${campaignId}/posts`);
    const nextPosts = response.posts || [];
    postsByCampaignId.value = {
      ...postsByCampaignId.value,
      [campaignId]: nextPosts,
    };
    return nextPosts;
  }

  async function loadPostContents(campaignId = selectedCampaignId.value) {
    if (!campaignId) {
      return {};
    }

    const currentPosts = postsByCampaignId.value[campaignId] || [];
    if (currentPosts.length === 0) {
      return {};
    }

    const entries = await Promise.all(
      currentPosts
        .filter((post) => post.id)
        .map(async (post) => {
          const content = await request<PostContentStatus>(
            `/campaign/${campaignId}/posts/${post.id}/contents`,
          );

          return [post.id as string, content] as const;
        }),
    );

    const nextContents = Object.fromEntries(entries);
    contentsByCampaignId.value = {
      ...contentsByCampaignId.value,
      [campaignId]: nextContents,
    };

    return nextContents;
  }

  function clearPostPolling(campaignId: string) {
    const timer = postPollingTimers.get(campaignId);
    if (timer) {
      clearInterval(timer);
      postPollingTimers.delete(campaignId);
    }
    delete postPollingStates.value[campaignId];
  }

  function stopAllPolling() {
    for (const campaignId of postPollingTimers.keys()) {
      clearPostPolling(campaignId);
    }
  }

  function isSeoComplete(status?: PostContentStatus) {
    return Boolean(status?.keywords?.length || status?.hashtags?.length);
  }

  function isWriterComplete(status?: PostContentStatus) {
    return Boolean(status?.content_body?.trim());
  }

  async function hydrateCampaignPosts() {
    if (campaigns.value.length === 0) {
      postsByCampaignId.value = {};
      return;
    }

    const postEntries = await Promise.all(
      campaigns.value.map(async (campaign) => [campaign.id, await loadPosts(campaign.id)] as const),
    );

    postsByCampaignId.value = Object.fromEntries(postEntries);
  }

  async function hydrateCampaignContents() {
    if (campaigns.value.length === 0) {
      contentsByCampaignId.value = {};
      return;
    }

    const contentEntries = await Promise.all(
      campaigns.value.map(async (campaign) => [campaign.id, await loadPostContents(campaign.id)] as const),
    );

    contentsByCampaignId.value = Object.fromEntries(contentEntries);
  }

  async function refreshDashboard() {
    if (!selectedBrand.value) {
      return;
    }

    loadingDashboard.value = true;
    error.value = '';

    try {
      await loadBrandProfile();
      await loadCampaigns();
      await hydrateCampaignPosts();
      await hydrateCampaignContents();
      if (!selectedCampaignId.value && campaigns.value.length > 0) {
        selectedCampaignId.value = campaigns.value[0].id;
      }
      if (!contentCampaignFilter.value || contentCampaignFilter.value === 'all') {
        contentCampaignFilter.value = selectedCampaignId.value || 'all';
      }
    } catch (err) {
      error.value = formatError(err);
    } finally {
      loadingDashboard.value = false;
    }
  }

  async function createCampaign() {
    if (
      !selectedBrand.value?.workspace_id ||
      !selectedBrand.value?.brand_name ||
      !campaignForm.objective.trim()
    ) {
      error.value = 'Select a brand and add a campaign objective.';
      return;
    }

    submitting.value = true;
    isGeneratingCampaign.value = true;
    error.value = '';
    successMessage.value = '';
    activeSection.value = 'campaigns';
    isCreateCampaignOpen.value = false;
    generationPreview.value = {
      objective: campaignForm.objective.trim(),
      brandName: selectedBrand.value.brand_name,
    };
    campaignReview.value = null;
    approvedCampaignId.value = '';
    selectedCampaignId.value = '';

    try {
      const response = await request<CreateCampaignResponse>('/campaign', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: selectedBrand.value.workspace_id,
          brand_name: selectedBrand.value.brand_name,
          objective: campaignForm.objective.trim(),
        }),
      });

      successMessage.value = `Campaign ${response.campaignId} created successfully.`;
      campaignReview.value = {
        campaignId: response.campaignId,
        plan: response.plan,
        posts: response.posts || [],
      };
      await loadCampaigns();
      selectedCampaignId.value = response.campaignId;
      postsByCampaignId.value = {
        ...postsByCampaignId.value,
        [response.campaignId]: response.posts || [],
      };
      await loadPostContents(response.campaignId);
      contentCampaignFilter.value = response.campaignId;
    } catch (err) {
      error.value = formatError(err);
    } finally {
      isGeneratingCampaign.value = false;
      submitting.value = false;
    }
  }

  async function pollPostContents(campaignId: string) {
    clearPostPolling(campaignId);

    const currentPosts = postsByCampaignId.value[campaignId] || [];
    if (currentPosts.length === 0) {
      return;
    }

    postPollingStates.value = {
      ...postPollingStates.value,
      [campaignId]: {
        startedAt: Date.now(),
        timedOut: false,
        error: '',
      },
    };

    const poll = async () => {
      const pollState = postPollingStates.value[campaignId];
      if (!pollState) {
        return;
      }

      if (Date.now() - pollState.startedAt > POLL_TIMEOUT_MS) {
        pollState.timedOut = true;
        pollState.error =
          'Polling timed out while waiting for SEO and writer agents. Please try Refresh or check the backend logs.';
        postPollingStates.value = {
          ...postPollingStates.value,
          [campaignId]: { ...pollState },
        };
        clearPostPolling(campaignId);
        error.value = pollState.error;
        return;
      }

      let allFinished = true;

      for (const post of currentPosts) {
        if(!post.id){
          continue;
        }
        try {
          const data = await request<PostContentStatus>(
            `/campaign/${campaignId}/posts/${post.id}/contents`,
          );
          postContents.value[post.id] = data;

          if (!isSeoComplete(data) || !isWriterComplete(data)) {
            allFinished = false;
          }
        } catch (err) {
          allFinished = false;
          console.error(`Failed to fetch content for post ${post.id}`, err);
        }
      }

      if (allFinished) {
        clearPostPolling(campaignId);
        successMessage.value = 'All post content is ready.';
      }
    };

    await poll();
    if (!postPollingTimers.has(campaignId) && !postPollingStates.value[campaignId]?.timedOut) {
      postPollingTimers.set(campaignId, setInterval(poll, POLL_INTERVAL_MS));
    }
  }

  async function submitCampaignReview(approved: boolean) {
    if (!selectedCampaignId.value) {
      error.value = 'Select a campaign before approving or rejecting it.';
      return;
    }  

    submitting.value = true;
    error.value = '';
    successMessage.value = '';

    try {
      const response = await request<CampaignApprovalResponse>(
        `/campaign/${selectedCampaignId.value}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            approved,
            feedback: reviewForm.feedback.trim(),
          }),
        },
      );

      successMessage.value = `${response.message}. Status: ${response.status}.`;
    approvedCampaignId.value = approved ? selectedCampaignId.value : '';
    if (campaignReview.value?.campaignId === selectedCampaignId.value) {
        campaignReview.value = {
          ...campaignReview.value,
          posts: postsByCampaignId.value[selectedCampaignId.value] || [],
        };
      }
      reviewForm.feedback = '';
      setTimeout(async () => {
        console.log('Reload posts after 10 sec')
        await loadPosts(selectedCampaignId.value);
        if (approved && selectedCampaignId.value) {
          await pollPostContents(selectedCampaignId.value);
        }
      }, 10000)
    } catch (err) {
      error.value = formatError(err);
    } finally {
      submitting.value = false;
    }
  }

  async function selectBrand(brand: BrandSelection) {
    selectedBrand.value = brand;
    activeSection.value = 'home';
    selectedCampaignId.value = '';
    contentCampaignFilter.value = 'all';
    postsByCampaignId.value = {};
    contentsByCampaignId.value = {};
    campaignReview.value = null;
    approvedCampaignId.value = '';
    postPollingStates.value = {};
    reviewForm.feedback = '';
    await refreshDashboard();
  }

  function leaveBrandDashboard() {
    stopAllPolling();
    selectedBrand.value = null;
    brandProfile.value = null;
    campaigns.value = [];
    postsByCampaignId.value = {};
    contentsByCampaignId.value = {};
    selectedCampaignId.value = '';
    contentCampaignFilter.value = 'all';
    campaignReview.value = null;
    approvedCampaignId.value = '';
    postPollingStates.value = {};
    reviewForm.feedback = '';
    error.value = '';
    successMessage.value = '';
  }

  function toggleLeftNav() {
    isLeftNavExpanded.value = !isLeftNavExpanded.value;
  }

  watch(selectedCampaignId, async (campaignId) => {
    if (!campaignId) {
      return;
    }

    try {
      if (!postsByCampaignId.value[campaignId]) {
        await loadPosts(campaignId);
      }
      if (!contentsByCampaignId.value[campaignId]) {
        await loadPostContents(campaignId);
      }
    } catch (err) {
      error.value = formatError(err);
    }
  });

  onMounted(loadBrands);

  return {
    activeSection,
    brandProfile,
    brands,
    campaignForm,
    campaignReview,
    campaigns,
    contentItems,
    contentsByCampaignId,
    dashboardStats,
    error,
    generationPreview,
    filteredBrands,
    contentCampaignFilter,
    isGeneratingCampaign,
    isCreateCampaignOpen,
    isLeftNavExpanded,
    loadingBrands,
    loadingDashboard,
    posts,
    reviewForm,
    selectedBrand,
    selectedBrandKey,
    selectedCampaignId,
    selectedCampaign,
    selectedWorkspaceId,
    submitting,
    successMessage,
    createCampaign,
    leaveBrandDashboard,
    refreshDashboard,
    selectBrand,
    setActiveSection: (section: DashboardSection) => {
      activeSection.value = section;
    },
    setCreateCampaignOpen: (isOpen: boolean) => {
      isCreateCampaignOpen.value = isOpen;
    },
    setSelectedWorkspaceId: (workspaceId: string) => {
      selectedWorkspaceId.value = workspaceId;
    },
    submitCampaignReview,
    toggleLeftNav,
    workspaceOptions,
    postContents,
    postPollingStates,
    isSeoComplete,
    isWriterComplete,
    approvedCampaignId,
  };
}
