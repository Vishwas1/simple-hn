<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <section class="rounded-xl2 border border-line bg-panel p-6 shadow-panel">
    <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-semibold tracking-tight text-ink">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 text-sm leading-6 text-mute">{{ subtitle }}</p>
      </div>
      <div class="w-full sm:w-auto sm:max-w-[18rem] sm:shrink-0">
        <slot name="action" />
      </div>
    </div>
    <slot />
  </section>
</template>
