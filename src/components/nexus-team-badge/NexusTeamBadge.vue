<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string | null
    label?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    src: null,
    label: null,
    size: 'md',
  },
)

function sizedBadge(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const cleaned = url.replace(/\/(tiny|small|medium)\/?$/, '')
  return `${cleaned}/small`
}

function initials(label: string | null | undefined): string {
  if (!label) return '?'
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
</script>

<template>
  <Avatar
    :image="sizedBadge(src)"
    :label="src ? undefined : initials(label)"
    shape="circle"
    :class="['team-badge', `team-badge--${size}`]"
  />
</template>

<style scoped>
.team-badge {
  flex-shrink: 0;
  background: color-mix(in srgb, var(--sports-accent) 18%, transparent) !important;
  color: var(--lavender-blush) !important;
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 14%, transparent);
}

.team-badge--sm :deep(img),
.team-badge--sm {
  width: 1.6rem !important;
  height: 1.6rem !important;
  font-size: 0.55rem !important;
}

.team-badge--md :deep(img),
.team-badge--md {
  width: 2.1rem !important;
  height: 2.1rem !important;
  font-size: 0.65rem !important;
}

.team-badge--lg :deep(img),
.team-badge--lg {
  width: 2.75rem !important;
  height: 2.75rem !important;
  font-size: 0.75rem !important;
}

.team-badge :deep(img) {
  object-fit: contain;
  background: color-mix(in srgb, var(--lavender-blush) 92%, transparent);
  padding: 2px;
}
</style>
