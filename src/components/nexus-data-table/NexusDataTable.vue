<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import DataTable from 'primevue/datatable'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Preset name or any CSS color (hex / var()). */
    accent?: 'admin' | 'f1' | 'spotify' | 'github' | 'sports' | (string & {})
    value?: unknown[] | null
    loading?: boolean
    size?: 'small' | 'large' | undefined
    paginator?: boolean
    rows?: number
    lazy?: boolean
    totalRecords?: number
    stripedRows?: boolean
    emptyMessage?: string
  }>(),
  {
    accent: 'admin',
    value: () => [],
    loading: false,
    size: 'small',
    paginator: false,
    rows: 25,
    lazy: false,
    stripedRows: true,
    emptyMessage: 'No rows to show.',
  },
)

const emit = defineEmits<{
  page: [event: { page?: number; first?: number; rows?: number }]
}>()

const attrs = useAttrs()

const PRESETS: Record<string, string> = {
  admin: 'var(--admin-accent)',
  f1: 'var(--sport-f1)',
  spotify: 'var(--spotify-green)',
  github: 'var(--github-ink)',
  sports: 'var(--sports-accent)',
}

const accentColor = computed(
  () => PRESETS[props.accent] ?? props.accent ?? PRESETS.admin,
)

const tableValue = computed(() => props.value ?? [])
</script>

<template>
  <div
    class="nexus-data-table"
    :style="{ '--nexus-table-accent': accentColor }"
  >
    <DataTable
      v-bind="attrs"
      :value="tableValue"
      :loading="loading"
      :size="size"
      :paginator="paginator"
      :rows="rows"
      :lazy="lazy"
      :total-records="totalRecords"
      :striped-rows="stripedRows"
      @page="emit('page', $event)"
    >
      <slot />
      <template #empty>
        <div class="ndt-empty">
          <slot name="empty">{{ emptyMessage }}</slot>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.nexus-data-table {
  --ndt-accent: var(--nexus-table-accent, var(--admin-accent));
  --ndt-surface: color-mix(
    in srgb,
    var(--ndt-accent) 7%,
    var(--coffee-bean-panel)
  );
  --ndt-border: color-mix(in srgb, var(--ndt-accent) 22%, transparent);
  --ndt-row: color-mix(in srgb, var(--ndt-accent) 4%, transparent);
  --ndt-row-alt: color-mix(in srgb, var(--ndt-accent) 9%, transparent);
  --ndt-hover: color-mix(in srgb, var(--ndt-accent) 14%, transparent);
  width: 100%;
  border-radius: 0.85rem;
  border: 1px solid var(--ndt-border);
  background: var(--ndt-surface);
  overflow: hidden;
}

.nexus-data-table :deep(.p-datatable) {
  background: transparent;
  border: 0;
}

.nexus-data-table :deep(.p-datatable-table-container) {
  border: 0;
  background: transparent;
}

.nexus-data-table :deep(.p-datatable-table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.nexus-data-table :deep(.p-datatable-thead > tr > th) {
  background: color-mix(in srgb, var(--ndt-accent) 12%, transparent) !important;
  color: color-mix(in srgb, var(--lavender-blush) 78%, transparent) !important;
  border: 0 !important;
  border-bottom: 1px solid var(--ndt-border) !important;
  font-size: 0.68rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.75rem 0.9rem !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr > td) {
  border: 0 !important;
  border-bottom: 1px solid color-mix(in srgb, var(--ndt-accent) 10%, transparent) !important;
  padding: 0.7rem 0.9rem !important;
  color: var(--lavender-blush);
  font-size: 0.9rem;
  vertical-align: middle;
  background: var(--ndt-row) !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr:nth-child(even) > td) {
  background: var(--ndt-row-alt) !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: var(--ndt-hover) !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: 0 !important;
}

.nexus-data-table :deep(code) {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--lavender-blush);
  background: color-mix(in srgb, var(--ndt-accent) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--ndt-accent) 28%, transparent);
}

.nexus-data-table :deep(.p-datatable-paginator-bottom),
.nexus-data-table :deep(.p-paginator) {
  background: color-mix(in srgb, var(--ndt-accent) 8%, transparent) !important;
  border: 0 !important;
  border-top: 1px solid var(--ndt-border) !important;
  padding: 0.45rem 0.65rem !important;
  color: var(--lavender-blush);
}

.nexus-data-table :deep(.p-paginator .p-paginator-page.p-paginator-page-selected),
.nexus-data-table :deep(.p-paginator .p-highlight) {
  background: color-mix(in srgb, var(--ndt-accent) 35%, transparent) !important;
  color: var(--lavender-blush) !important;
  border-color: transparent !important;
}

.nexus-data-table :deep(.p-paginator-page),
.nexus-data-table :deep(.p-paginator-first),
.nexus-data-table :deep(.p-paginator-prev),
.nexus-data-table :deep(.p-paginator-next),
.nexus-data-table :deep(.p-paginator-last) {
  color: color-mix(in srgb, var(--lavender-blush) 80%, transparent) !important;
  min-width: 2rem;
  height: 2rem;
}

.nexus-data-table :deep(.p-datatable-mask),
.nexus-data-table :deep(.p-datatable-loading-overlay) {
  background: color-mix(in srgb, var(--coffee-bean) 55%, transparent) !important;
}

.ndt-empty {
  padding: 1.5rem 1rem;
  text-align: center;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  font-size: 0.9rem;
}
</style>
