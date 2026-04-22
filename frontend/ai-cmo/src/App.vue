<script setup lang="ts">
import SectionCard from './components/SectionCard.vue';
import StatCard from './components/StatCard.vue';
import { useCmoDashboard } from './composables/useCmoDashboard';

const {
  activeSection,
  brandProfile,
  campaignForm,
  campaignReview,
  campaigns,
  contentCampaignFilter,
  contentItems,
  dashboardStats,
  error,
  filteredBrands,
  generationPreview,
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
  approvedCampaignId,
  postPollingStates,
  createCampaign,
  leaveBrandDashboard,
  refreshDashboard,
  selectBrand,
  setActiveSection,
  setCreateCampaignOpen,
  submitCampaignReview,
  toggleLeftNav,
  workspaceOptions,
  postContents,
  isSeoComplete,
  isWriterComplete
} = useCmoDashboard();

function formatDate(value?: string) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function trimCopy(value?: string, fallback = 'No details yet.') {
  if (!value?.trim()) {
    return fallback;
  }

  return value;
}

function summarizeList(values?: string[] | null, fallback = 'Pending') {
  if (!values?.length) {
    return fallback;
  }

  return values.join(', ');
}

function isWorking(status?: { content_body?: string | null; keywords?: string[] | null; hashtags?: string[] | null }) {
  return !status || (!status.keywords?.length && !status.hashtags?.length && !status.content_body?.trim());
}

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'campaigns', label: 'Campaigns', icon: 'campaigns' },
  { id: 'contents', label: 'Contents', icon: 'contents' },
] as const;
</script>

<template>
  <div class="min-h-screen bg-canvas text-ink">
    <header class="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur">
      <div class="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
              <path d="M4 18V9l8-4 8 4v9" />
              <path d="M9 18v-4h6v4" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.26em] text-mute">AI CMO</p>
            <p class="text-sm font-medium text-ink">
              {{ selectedBrand?.brand_name || 'Brand Workspace Dashboard' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="selectedBrand"
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            @click="leaveBrandDashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All brands
          </button>
          <div class="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-[#f8faf6]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 text-accent">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 19c1.5-3 4-4.5 6.5-4.5S17 16 18.5 19" />
            </svg>
          </div>
        </div>
      </div>
    </header>

    <div v-if="!selectedBrand" class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <section
        class="overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#fdfefb] via-[#f5f8f2] to-[#e9f0e7] px-6 py-8 shadow-panel sm:px-8"
      >
        <p class="text-sm font-medium uppercase tracking-[0.3em] text-mute">Brand Directory</p>
        <h1 class="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Choose a brand to enter its campaign workspace.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-6 text-mute sm:text-base">
          Filter by workspace first, then choose the brand you want to open. The combination of
          `brand_name` and `workspace_id` stays unique.
        </p>
      </section>

      <div
        v-if="error"
        class="mt-6 rounded-xl2 border border-line bg-panel p-4 text-sm text-[#8a3f30] shadow-panel"
      >
        {{ error }}
      </div>

      <div v-if="loadingBrands" class="mt-6 rounded-xl2 border border-line bg-panel p-6 text-sm text-mute shadow-panel">
        Loading brands...
      </div>

      <div v-else class="mt-8 space-y-6">
        <!-- <section class="rounded-xl2 border border-line bg-panel p-5 shadow-panel"> -->
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <!-- <div>
              <p class="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-mute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M8 9h8M8 13h6" />
                </svg>
                Workspace Filter
              </p>
              <h2 class="mt-1 text-2xl font-semibold tracking-tight text-ink">
                {{ selectedWorkspaceId || 'No workspace available' }}
              </h2>
            </div> -->

            <label class="block w-full md:w-[22rem]">
              <span class="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-mute">
                Select workspace
              </span>
              <select
                v-model="selectedWorkspaceId"
                class="block w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
              >
                <option v-for="workspaceId in workspaceOptions" :key="workspaceId" :value="workspaceId">
                  {{ workspaceId }}
                </option>
              </select>
            </label>
          </div>
        <!-- </section> -->

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-mute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                  <path d="M4 19v-9l8-4 8 4v9" />
                  <path d="M9 19v-4h6v4" />
                </svg>
                Brands
              </p>
              <!-- <h2 class="mt-1 text-2xl font-semibold tracking-tight text-ink">
                {{ selectedWorkspaceId }}
              </h2> -->
            </div>
            <div class="rounded-full bg-white px-4 py-2 text-xs font-medium text-mute shadow-panel">
              {{ filteredBrands.length }} brands
            </div>
          </div>

          <div v-if="filteredBrands.length === 0" class="rounded-xl2 border border-dashed border-line bg-panel p-6 text-sm text-mute shadow-panel">
            No brands found for the selected workspace.
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="brand in filteredBrands"
              :key="`${brand.workspace_id}-${brand.brand_name}`"
              class="overflow-hidden rounded-[1.75rem] border border-line bg-panel p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-accent/60"
              @click="selectBrand(brand)"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <!-- <p class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mute">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                      <path d="M4 19v-9l8-4 8 4v9" />
                      <path d="M9 19v-4h6v4" />
                    </svg>
                    Brand
                  </p> -->
                  <h3 class="mt-2 text-xl font-semibold tracking-tight text-ink">
                    {{ brand.brand_name }}
                  </h3>
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5">
                    <path d="M8 16l8-8" />
                    <path d="M9 8h7v7" />
                  </svg>
                  Open
                </div>
              </div>

              <div class="mt-6 rounded-2xl bg-[#f8faf5] p-4">
                <p class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-mute">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                    <path d="M8 7h8M8 12h8M8 17h5" />
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Workspace ID
                </p>
                <p class="mt-2 text-sm font-medium text-ink">{{ brand.workspace_id }}</p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <aside
        class="sticky top-[88px] hidden self-start rounded-[1.75rem] border border-line bg-panel p-4 shadow-panel lg:block"
        :class="isLeftNavExpanded ? 'w-72' : 'w-24'"
      >
        <div class="mb-6 flex items-center justify-between gap-3">
          <div v-if="isLeftNavExpanded">
            <p class="text-xs uppercase tracking-[0.24em] text-mute">Brand Dashboard</p>
            <h2 class="mt-2 text-lg font-semibold text-ink">{{ selectedBrand.brand_name }}</h2>
          </div>
          <button
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-mute transition hover:border-accent hover:text-accent"
            @click="toggleLeftNav"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5">
              <path :d="isLeftNavExpanded ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'" />
            </svg>
          </button>
        </div>

        <div class="space-y-2">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition"
            :class="
              activeSection === item.id
                ? 'bg-accent text-white'
                : 'bg-white text-ink hover:border-accent hover:text-accent'
            "
            @click="setActiveSection(item.id)"
          >
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-current/15">
              <svg
                v-if="item.icon === 'home'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="h-4 w-4"
              >
                <path d="M4 19v-9l8-4 8 4v9" />
                <path d="M9 19v-4h6v4" />
              </svg>
              <svg
                v-else-if="item.icon === 'campaigns'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="h-4 w-4"
              >
                <rect x="4" y="5" width="16" height="14" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="h-4 w-4"
              >
                <rect x="5" y="4" width="14" height="16" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </span>
            <span v-if="isLeftNavExpanded">{{ item.label }}</span>
          </button>
        </div>

        <div v-if="isLeftNavExpanded" class="mt-6 rounded-3xl bg-accent-soft p-4 text-sm text-mute">
          <p class="text-xs uppercase tracking-[0.2em]">Selected key</p>
          <p class="mt-2 break-all font-medium text-ink">{{ selectedBrandKey }}</p>
        </div>
      </aside>

      <main class="min-w-0 flex-1 space-y-6">
        <div
          v-if="error || successMessage"
          class="flex flex-col gap-3 rounded-xl2 border border-line bg-panel p-4 text-sm shadow-panel"
        >
          <p v-if="error" class="text-[#8a3f30]">{{ error }}</p>
          <p v-if="successMessage" class="text-accent">{{ successMessage }}</p>
        </div>

        <section
          class="rounded-[2rem] border border-line bg-gradient-to-r from-white via-[#f8faf5] to-[#edf4eb] px-6 py-6 shadow-panel"
        >
          <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.26em] text-mute">{{ selectedBrand.workspace_id }}</p>
              <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink">
                {{ selectedBrand.brand_name }}
              </h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-mute">
                {{ trimCopy(brandProfile?.positioning_summary, 'Brand profile is loading for this workspace.') }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                class="inline-flex items-center gap-2 rounded-full border border-line bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition hover:bg-glow"
                @click="refreshDashboard"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                  <path d="M20 12a8 8 0 10-2.34 5.66" />
                  <path d="M20 7v5h-5" />
                </svg>
                {{ loadingDashboard ? 'Refreshing...' : 'Refresh' }}
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
                @click="
                  setActiveSection('campaigns');
                  setCreateCampaignOpen(true);
                "
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" class="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create campaign
              </button>
            </div>
          </div>
        </section>

        <template v-if="activeSection === 'home'">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              v-for="(stat, index) in dashboardStats"
              :key="stat.label"
              :label="stat.label"
              :value="stat.value"
              :icon="
                index === 0 ? 'brands' : index === 1 ? 'campaigns' : index === 2 ? 'posts' : 'scheduled'
              "
              :tone="index === 0 ? 'accent' : 'default'"
            />
          </div>

          <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              title="Brand profile"
              subtitle="A quick snapshot of the current brand for strategic context."
            >
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-3xl bg-[#f9fbf8] p-5">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">Audience</p>
                  <p class="mt-3 text-sm leading-6 text-ink">
                    {{ trimCopy(brandProfile?.target_audience, 'No audience set yet.') }}
                  </p>
                </div>
                <div class="rounded-3xl bg-[#f9fbf8] p-5">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">Tone of voice</p>
                  <p class="mt-3 text-sm leading-6 text-ink">
                    {{ trimCopy(brandProfile?.tone_voice, 'No tone of voice provided.') }}
                  </p>
                </div>
                <div class="rounded-3xl bg-[#f9fbf8] p-5">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">Problem</p>
                  <p class="mt-3 text-sm leading-6 text-ink">
                    {{ trimCopy(brandProfile?.problem, 'No problem statement added.') }}
                  </p>
                </div>
                <div class="rounded-3xl bg-[#f9fbf8] p-5">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">Solution</p>
                  <p class="mt-3 text-sm leading-6 text-ink">
                    {{ trimCopy(brandProfile?.solution, 'No solution statement added.') }}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Keyword cloud"
              subtitle="A compact reference for positioning and messaging."
            >
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="keyword in brandProfile?.keywords || []"
                  :key="keyword"
                  class="rounded-full border border-line bg-[#fafbf8] px-3 py-1 text-xs text-ink"
                >
                  {{ keyword }}
                </span>
                <span v-if="!brandProfile?.keywords?.length" class="text-sm text-mute">
                  No keywords configured.
                </span>
              </div>
            </SectionCard>
          </div>
        </template>

        <template v-else-if="activeSection === 'campaigns'">
          <div class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <SectionCard
              title="Campaign list"
              subtitle="Browse configured campaigns or start a new one for this brand."
            >
              <template #action>
                <button
                  class="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
                  @click="setCreateCampaignOpen(!isCreateCampaignOpen)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" class="h-4 w-4">
                    <path v-if="!isCreateCampaignOpen" d="M12 5v14M5 12h14" />
                    <path v-else d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  {{ isCreateCampaignOpen ? 'Close' : 'Create campaign' }}
                </button>
              </template>

              <div
                v-if="isCreateCampaignOpen"
                class="mb-5 rounded-3xl border border-line bg-[#f9fbf8] p-4"
              >
                <p class="text-xs uppercase tracking-[0.22em] text-mute">New objective</p>
                <textarea
                  v-model="campaignForm.objective"
                  rows="5"
                  class="mt-3 w-full rounded-3xl border border-line bg-white px-4 py-4 text-sm leading-6 outline-none transition focus:border-accent"
                  placeholder="Describe the goal for the new campaign"
                />
                <div class="mt-4 flex justify-end">
                  <button
                    class="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="submitting"
                    @click="createCampaign"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" class="h-4 w-4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {{ submitting ? 'Generating...' : 'Generate campaign' }}
                  </button>
                </div>
              </div>

              <div v-if="campaigns.length === 0" class="rounded-3xl border border-dashed border-line p-6 text-sm text-mute">
                No campaigns found for this brand yet.
              </div>

              <div v-else class="space-y-3">
                <button
                  v-for="campaign in campaigns"
                  :key="campaign.id"
                  class="w-full rounded-3xl border p-4 text-left transition"
                  :class="
                    selectedCampaignId === campaign.id
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-white hover:border-accent/50'
                  "
                  @click="selectedCampaignId = campaign.id"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.2em] text-mute">{{ campaign.status }}</p>
                      <h3 class="mt-2 text-base font-semibold text-ink">{{ campaign.goal }}</h3>
                      <p class="mt-2 text-sm text-mute">
                        Launch {{ formatDate(campaign.launch_date) }} • {{ campaign.campaign_type }}
                      </p>
                    </div>
                    <div class="rounded-full bg-white px-3 py-2 text-xs font-medium text-mute">
                      {{ campaign.id.slice(0, 8) }}
                    </div>
                  </div>
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Campaign review"
              subtitle="Review the generated plan and post list, then approve or reject with feedback."
            >
              <div
                v-if="isGeneratingCampaign"
                class="overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-[#f8fbf6] via-white to-[#edf4eb] p-6 shadow-panel"
              >
                <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div class="max-w-xl">
                    <p class="text-xs uppercase tracking-[0.24em] text-mute">Content Strategist</p>
                    <h3 class="mt-3 text-2xl font-semibold tracking-tight text-ink">
                      Building the campaign narrative and post sequence.
                    </h3>
                    <p class="mt-3 text-sm leading-6 text-mute">
                      Working on
                      <span class="font-medium text-ink">{{ generationPreview?.brandName }}</span>
                      with the objective:
                      <span class="font-medium text-ink">
                        {{ generationPreview?.objective }}
                      </span>
                    </p>
                  </div>

                  <div class="strategist-orbit mx-auto lg:mx-0">
                    <div class="strategist-orbit__ring"></div>
                    <div class="strategist-orbit__ring strategist-orbit__ring--delayed"></div>
                    <div class="strategist-orbit__core">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6">
                        <path d="M5 17.5V9l7-3.5L19 9v8.5" />
                        <path d="M9.5 17.5v-3h5v3" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="mt-6 grid gap-3 md:grid-cols-3">
                  <div class="rounded-3xl border border-line bg-white/80 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-mute">Step 1</p>
                    <p class="mt-2 text-sm font-medium text-ink">Reading brand context</p>
                    <div class="mt-4 strategist-bar"></div>
                  </div>
                  <div class="rounded-3xl border border-line bg-white/80 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-mute">Step 2</p>
                    <p class="mt-2 text-sm font-medium text-ink">Drafting high-level plan</p>
                    <div class="mt-4 strategist-bar strategist-bar--delayed"></div>
                  </div>
                  <div class="rounded-3xl border border-line bg-white/80 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-mute">Step 3</p>
                    <p class="mt-2 text-sm font-medium text-ink">Sequencing content posts</p>
                    <div class="mt-4 strategist-bar strategist-bar--late"></div>
                  </div>
                </div>
              </div>

              <div v-else-if="!selectedCampaignId" class="rounded-3xl border border-dashed border-line p-6 text-sm text-mute">
                Select a campaign to review it.
              </div>

              <div v-else class="space-y-5">
                <!-- <div class="rounded-3xl bg-accent p-5 text-white">
                  <p class="text-xs uppercase tracking-[0.22em] text-white/70">Selected campaign</p>
                  <h3 class="mt-3 text-xl font-semibold leading-tight">
                    {{ selectedCampaign?.goal || 'Campaign review' }}
                  </h3>
                  <p class="mt-2 text-sm text-white/80">
                    {{ selectedCampaignId }} • {{ selectedCampaign?.status || 'Pending review' }}
                  </p>
                </div> -->

                <div class="rounded-3xl border border-line bg-[#f9fbf8] p-5">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">High level plan</p>
                  <p class="mt-3 whitespace-pre-line text-sm leading-6 text-ink">
                    {{
                      trimCopy(
                        campaignReview?.campaignId === selectedCampaignId ? campaignReview.plan : '',
                        'No generated strategy summary is cached in the UI for this campaign yet.',
                      )
                    }}
                  </p>
                </div>

                <div class="space-y-3">
                  <div
                    v-if="posts.length === 0"
                    class="rounded-3xl border border-dashed border-line p-5 text-sm text-mute"
                  >
                    No posts available yet for this campaign.
                  </div>
<!-- 
                  <div v-for="post in posts" :key="post.id" class="rounded-3xl border border-line bg-white p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-mute">
                          Day {{ post.scheduled_day }} • {{ post.platform }}
                        </p>
                        <h4 class="mt-2 text-base font-semibold">{{ post.angle }}</h4>
                      </div>
                      <span class="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                        {{ post.status }}
                      </span>
                    </div>
                    <p class="mt-3 text-sm leading-6 text-mute">{{ post.direction }}</p>
                    <div class="mt-4 flex flex-wrap gap-2 text-xs text-mute">
                      <span class="rounded-full bg-[#f3f5ef] px-3 py-1">{{ post.phase }}</span>
                      <span class="rounded-full bg-[#f3f5ef] px-3 py-1">
                        {{ formatDate(post.post_date) }}
                      </span>
                    </div>
                  </div> -->


                  <div v-for="post in posts"  class="rounded-3xl border border-line bg-white p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-mute">
                          Day {{ post.scheduled_day }} • {{ post.platform }}
                        </p>
                        <h4 class="mt-2 text-base font-semibold text-ink">{{ post.angle }}</h4>
                        <p class="mt-2 text-sm leading-6 text-mute">{{ post.direction }}</p>
                      </div>
                      <span class="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                        {{ post.status }}
                      </span>
                    </div>

                    <div class="mt-5 space-y-3 border-t border-line/50 pt-4">
                      <div v-if="selectedCampaignId !== approvedCampaignId" class="rounded-2xl border border-dashed border-line bg-[#fbfcf9] p-4 text-xs text-mute">
                        Awaiting approval. Agent progress will appear here once the campaign is approved.
                      </div>

                      <div
                        v-if="postPollingStates[selectedCampaignId]?.timedOut"
                        class="rounded-2xl border border-[#d5a38e] bg-[#fff6f1] p-4 text-xs text-[#8b4a35]"
                      >
                        {{ postPollingStates[selectedCampaignId]?.error }}
                      </div>

                      <div v-if="selectedCampaignId === approvedCampaignId" class="rounded-2xl border border-line bg-[#fafcf7] p-4">
                        <div class="flex items-start gap-3">
                          <div class="strategist-orbit strategist-orbit--compact shrink-0">
                            <div
                              v-if="!isSeoComplete(postContents[post.id])"
                              class="strategist-orbit__ring"
                            ></div>
                            <div
                              v-if="!isSeoComplete(postContents[post.id])"
                              class="strategist-orbit__ring strategist-orbit__ring--delayed"
                            ></div>
                            <div
                              class="strategist-orbit__core strategist-orbit__core--compact"
                              :class="isSeoComplete(postContents[post.id]) ? 'strategist-orbit__core--done' : ''"
                            >
                              <svg
                                v-if="isSeoComplete(postContents[post.id])"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                class="h-4 w-4"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              <svg
                                v-else
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                class="h-4 w-4"
                              >
                                <path d="M5 17.5V9l7-3.5L19 9v8.5" />
                                <path d="M9.5 17.5v-3h5v3" />
                              </svg>
                            </div>
                          </div>

                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <p class="text-xs font-medium uppercase tracking-[0.18em] text-ink">SEO agent</p>
                              <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                :class="isSeoComplete(postContents[post.id]) ? 'bg-accent-soft text-accent' : 'bg-white text-mute'"
                              >
                                {{ isSeoComplete(postContents[post.id]) ? 'Completed' : 'Thinking...' }}
                              </span>
                            </div>
                            <p class="mt-1 text-xs text-mute">
                              {{ isSeoComplete(postContents[post.id]) ? 'Keywords and hashtags ready' : 'SEO agent is thinking...' }}
                            </p>
                            <div v-if="!isSeoComplete(postContents[post.id]) && !postPollingStates[selectedCampaignId]?.timedOut" class="mt-3 flex gap-2">
                              <div class="strategist-bar h-1.5 w-20"></div>
                              <div class="strategist-bar strategist-bar--delayed h-1.5 w-14"></div>
                            </div>
                          </div>
                        </div>

                        <div class="mt-3 grid gap-3 text-xs text-mute sm:grid-cols-2">
                          <div class="rounded-xl bg-white p-3">
                            <p class="text-[10px] uppercase tracking-[0.16em] text-mute">Keywords</p>
                            <p class="mt-2 leading-5 text-ink">
                              {{ summarizeList(postContents[post.id]?.keywords) }}
                            </p>
                          </div>
                          <div class="rounded-xl bg-white p-3">
                            <p class="text-[10px] uppercase tracking-[0.16em] text-mute">Hashtags</p>
                            <p class="mt-2 leading-5 text-ink">
                              {{ summarizeList(postContents[post.id]?.hashtags) }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div v-if="selectedCampaignId === approvedCampaignId" class="rounded-2xl border border-line bg-[#fcfbf7] p-4">
                        <div class="flex items-start gap-3">
                          <div class="strategist-orbit strategist-orbit--compact shrink-0">
                            <div
                              v-if="!isWriterComplete(postContents[post.id])"
                              class="strategist-orbit__ring"
                            ></div>
                            <div
                              v-if="!isWriterComplete(postContents[post.id])"
                              class="strategist-orbit__ring strategist-orbit__ring--delayed"
                            ></div>
                            <div
                              class="strategist-orbit__core strategist-orbit__core--compact"
                              :class="isWriterComplete(postContents[post.id]) ? 'strategist-orbit__core--done' : ''"
                            >
                              <svg
                                v-if="isWriterComplete(postContents[post.id])"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                class="h-4 w-4"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              <svg
                                v-else
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                class="h-4 w-4"
                              >
                                <path d="M5 17.5V9l7-3.5L19 9v8.5" />
                                <path d="M9.5 17.5v-3h5v3" />
                              </svg>
                            </div>
                          </div>

                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <p class="text-xs font-medium uppercase tracking-[0.18em] text-ink">Writer agent</p>
                              <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                :class="isWriterComplete(postContents[post.id]) ? 'bg-accent-soft text-accent' : 'bg-white text-mute'"
                              >
                                {{ isWriterComplete(postContents[post.id]) ? 'Completed' : 'Thinking...' }}
                              </span>
                            </div>
                            <p class="mt-1 text-xs text-mute">
                              {{ isWriterComplete(postContents[post.id]) ? 'Content body ready' : 'Writer agent is thinking...' }}
                            </p>
                            <div v-if="!isWriterComplete(postContents[post.id]) && !postPollingStates[selectedCampaignId]?.timedOut" class="mt-3 flex gap-2">
                              <div class="strategist-bar h-1.5 w-20"></div>
                              <div class="strategist-bar strategist-bar--late h-1.5 w-16"></div>
                            </div>
                          </div>
                        </div>

                        <div v-if="selectedCampaignId === approvedCampaignId && postContents[post.id]?.content_body" class="mt-3 rounded-2xl bg-white p-3 text-xs leading-5 text-ink">
                          {{ postContents[post.id]?.content_body?.slice(0, 160) }}{{ (postContents[post.id]?.content_body?.length || 0) > 160 ? '...' : '' }}
                        </div>
                      </div>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2 text-xs text-mute">
                      <span class="rounded-full bg-[#f3f5ef] px-3 py-1">{{ post.phase }}</span>
                      <span class="rounded-full bg-[#f3f5ef] px-3 py-1">{{ formatDate(post.post_date) }}</span>
                    </div>
                  </div>



                </div>

                <div class="rounded-3xl border border-line bg-[#f9fbf8] p-4">
                  <p class="text-xs uppercase tracking-[0.22em] text-mute">Feedback</p>
                  <textarea
                    v-model="reviewForm.feedback"
                    rows="4"
                    class="mt-3 w-full rounded-3xl border border-line bg-white px-4 py-4 text-sm leading-6 outline-none transition focus:border-accent"
                    placeholder="Add optional feedback for approval or rejection"
                  />
                  <div class="mt-4 flex flex-wrap justify-end gap-3">
                    <button
                      class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-medium text-ink transition hover:border-[#b55f4c] hover:text-[#b55f4c] disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="submitting"
                      @click="submitCampaignReview(false)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                      Reject
                    </button>
                    <button
                      class="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="submitting"
                      @click="submitCampaignReview(true)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
                        <path d="M5 12l4.5 4.5L19 7" />
                      </svg>
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </template>

        <template v-else>
          <SectionCard
            title="Contents"
            subtitle="All generated content items for this brand, filtered by the selected campaign."
          >
            <template #action>
              <select
                v-model="contentCampaignFilter"
                class="block w-full max-w-full rounded-full border border-line bg-white px-4 py-2 text-sm outline-none transition focus:border-accent"
              >
                <option value="all">All campaigns</option>
                <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
                  {{ campaign.goal }}
                </option>
              </select>
            </template>

            <div v-if="contentItems.length === 0" class="rounded-3xl border border-dashed border-line p-6 text-sm text-mute">
              No content is available yet. Select a campaign or generate one first.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in contentItems"
                :key="item.id"
                class="rounded-3xl border border-line bg-white p-5"
              >
                <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-mute">
                      {{ item.platform }} • {{ item.phase }}
                    </p>
                    <h3 class="mt-2 text-lg font-semibold text-ink">{{ item.title }}</h3>
                    <p class="mt-3 text-sm leading-6 text-mute">{{ item.description }}</p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <span class="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                      {{ item.status }}
                    </span>
                    <span class="rounded-full bg-[#f3f5ef] px-3 py-1 text-xs text-mute">
                      {{ formatDate(item.postDate) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </template>
      </main>
    </div>
  </div>
</template>
