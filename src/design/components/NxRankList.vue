<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export interface RankItem {
  id: string | number
  title: string
  sub?: string
  /** Right-aligned value (plays, minutes, points). */
  value?: string | number
  image?: string | null
  to?: RouteLocationRaw
}

/**
 * Ranked items. `circles` is the editorial grid (round artwork + big rank
 * number), `rows` is a compact list.
 */
withDefaults(
  defineProps<{
    items: RankItem[]
    variant?: 'circles' | 'rows'
    /** Shape of artwork in circles mode. */
    shape?: 'circle' | 'square'
  }>(),
  { variant: 'rows', shape: 'circle' },
)
</script>

<template>
  <ol class="nx-rank" :class="[`v-${variant}`, `shape-${shape}`]">
    <li v-for="(item, i) in items" :key="item.id">
      <component :is="item.to ? 'RouterLink' : 'div'" :to="item.to" class="item" :class="{ link: Boolean(item.to) }">
        <template v-if="variant === 'circles'">
          <div class="art">
            <img v-if="item.image" :src="item.image" :alt="''" loading="lazy" />
          </div>
          <div class="rk num">{{ i + 1 }}</div>
          <div class="ti">{{ item.title }}</div>
          <div v-if="item.sub || item.value !== undefined" class="pl">
            {{ item.sub }}<template v-if="item.sub && item.value !== undefined"> · </template>{{ item.value }}
          </div>
        </template>
        <template v-else>
          <span class="rk num">{{ i + 1 }}</span>
          <span v-if="item.image !== undefined" class="thumb">
            <img v-if="item.image" :src="item.image" :alt="''" loading="lazy" />
          </span>
          <span class="txt">
            <span class="ti">{{ item.title }}</span>
            <span v-if="item.sub" class="pl">{{ item.sub }}</span>
          </span>
          <span v-if="item.value !== undefined" class="val num">{{ item.value }}</span>
        </template>
      </component>
    </li>
  </ol>
</template>

<style scoped>
.nx-rank {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* circles */
.v-circles {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
}

.v-circles .item {
  display: block;
  min-width: 0;
}

.v-circles .art {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  background: var(--amb-2);
  transition: transform 0.35s var(--ease);
}

.shape-square.v-circles .art {
  border-radius: var(--r-lg);
}

.v-circles .item.link:hover .art {
  transform: scale(1.04);
}

.v-circles .art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-circles .rk {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 34px;
  letter-spacing: -0.04em;
  color: var(--acc);
  margin-top: 12px;
  line-height: 1;
}

.v-circles .ti {
  font-weight: 600;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v-circles .pl {
  font-size: 12.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* rows */
.v-rows .item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--line);
  min-width: 0;
}

.v-rows li:last-child .item {
  border-bottom: 0;
}

.v-rows .item.link:hover {
  background: var(--tint);
}

.v-rows .rk {
  width: 22px;
  font-size: 13px;
  color: var(--ink-3);
  text-align: right;
  flex-shrink: 0;
}

.v-rows .thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--r-xs);
  overflow: hidden;
  background: var(--amb-2);
  flex-shrink: 0;
}

.shape-circle.v-rows .thumb {
  border-radius: 50%;
}

.v-rows .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-rows .txt {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.v-rows .ti {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v-rows .pl {
  font-size: 12.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v-rows .val {
  font-size: 13px;
  color: var(--ink-2);
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .v-circles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .v-circles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}
</style>
