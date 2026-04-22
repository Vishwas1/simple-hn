<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  tone?: 'default' | 'accent';
  icon?: 'brands' | 'campaigns' | 'posts' | 'scheduled';
}>();
</script>

<template>
  <div
    class="rounded-xl2 border border-line bg-panel p-5 shadow-panel"
    :class="tone === 'accent' ? 'bg-accent text-white border-accent' : ''"
  >
    <div class="flex items-start justify-between gap-4">
      <p
        class="text-xs font-medium uppercase tracking-[0.24em]"
        :class="tone === 'accent' ? 'text-white/75' : 'text-mute'"
      >
        {{ label }}
      </p>
      <span
        class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
        :class="tone === 'accent' ? 'border-white/20 bg-white/10' : 'border-line bg-accent-soft text-accent'"
      >
        <svg
          v-if="icon === 'brands'"
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
          v-else-if="icon === 'campaigns'"
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
          v-else-if="icon === 'posts'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          class="h-4 w-4"
        >
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          class="h-4 w-4"
        >
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      </span>
    </div>
    <p class="mt-3 text-2xl font-semibold tracking-tight">
      {{ value }}
    </p>
  </div>
</template>
